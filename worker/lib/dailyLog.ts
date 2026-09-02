import { and, eq } from "drizzle-orm";
import type { Db } from "../db/client";
import { blueprintConfig, dailyLogs, weeklySchedule } from "../db/schema";
import { sumHydration, sumMeals, sumRuns } from "./aggregates";

type BlueprintConfig = typeof blueprintConfig.$inferSelect;
type DailyLog = typeof dailyLogs.$inferSelect;

export function liveTargetCalories(config: BlueprintConfig, dayType: string): number {
  if (dayType === "low") return config.lowCalorieKcal;
  if (dayType === "high") return config.highCalorieKcal;
  return config.resetCalorieKcal;
}

export async function getSchedule(db: Db, userId: string, dateStr: string) {
  const dayOfWeek = new Date(`${dateStr}T00:00:00`).getDay();
  const [schedule] = await db
    .select()
    .from(weeklySchedule)
    .where(and(eq(weeklySchedule.userId, userId), eq(weeklySchedule.dayOfWeek, dayOfWeek)))
    .limit(1);
  return schedule ?? null;
}

export async function getConfig(db: Db, userId: string) {
  const [config] = await db
    .select()
    .from(blueprintConfig)
    .where(eq(blueprintConfig.userId, userId))
    .limit(1);
  return config ?? null;
}

export async function getOrCreateDailyLog(db: Db, userId: string, dateStr: string) {
  const [existing] = await db
    .select()
    .from(dailyLogs)
    .where(and(eq(dailyLogs.userId, userId), eq(dailyLogs.date, dateStr)))
    .limit(1);
  if (existing) return existing;

  const [schedule, config] = await Promise.all([
    getSchedule(db, userId, dateStr),
    getConfig(db, userId),
  ]);
  if (!config) throw new Error("Blueprint config missing for user; seed did not run");

  const dayType = schedule?.dayType ?? "reset";
  const targetCalories = liveTargetCalories(config, dayType);

  const [created] = await db
    .insert(dailyLogs)
    .values({
      id: crypto.randomUUID(),
      userId,
      date: dateStr,
      dayType,
      targetCalories,
      createdAt: Date.now(),
    })
    .returning();

  return created;
}

/** Read-only lookup for history views — never creates a row. */
export async function getExistingDailyLog(db: Db, userId: string, dateStr: string) {
  const [log] = await db
    .select()
    .from(dailyLogs)
    .where(and(eq(dailyLogs.userId, userId), eq(dailyLogs.date, dateStr)))
    .limit(1);
  return log ?? null;
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Merges a day descriptor row with its computed totals (summed from the
 * itemized entry tables) into the shape the frontend expects. The live
 * target reflects the current blueprint baseline, since autoregulation can
 * change it after the log row was created.
 */
export async function buildDayView(db: Db, userId: string, log: DailyLog, config: BlueprintConfig) {
  const [meals, fluidGallons, runs] = await Promise.all([
    sumMeals(db, userId, log.id),
    sumHydration(db, userId, log.date),
    sumRuns(db, userId, log.date),
  ]);

  const targetCalories = liveTargetCalories(config, log.dayType);

  return {
    ...log,
    targetCalories,
    caloriesConsumed: meals.calories,
    proteinGConsumed: meals.proteinG,
    fatGConsumed: meals.fatG,
    carbsGConsumed: meals.carbsG,
    fluidGallons,
    distanceKmActual: runs.distanceKm,
    paceActual: runs.lastPace,
  };
}
