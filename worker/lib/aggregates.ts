import { and, desc, eq, sql } from "drizzle-orm";
import type { Db } from "../db/client";
import { hydrationEntries, mealEntries, runEntries } from "../db/schema";
import type { MacroTotals } from "./macros";

export async function sumMeals(db: Db, userId: string, dailyLogId: string): Promise<MacroTotals> {
  const [row] = await db
    .select({
      calories: sql<number>`coalesce(sum(${mealEntries.calories}), 0)`,
      proteinG: sql<number>`coalesce(sum(${mealEntries.proteinG}), 0)`,
      fatG: sql<number>`coalesce(sum(${mealEntries.fatG}), 0)`,
      carbsG: sql<number>`coalesce(sum(${mealEntries.carbsG}), 0)`,
    })
    .from(mealEntries)
    .where(and(eq(mealEntries.userId, userId), eq(mealEntries.dailyLogId, dailyLogId)));
  return row;
}

export async function sumHydration(db: Db, userId: string, date: string): Promise<number> {
  const [row] = await db
    .select({ gallons: sql<number>`coalesce(sum(${hydrationEntries.gallons}), 0)` })
    .from(hydrationEntries)
    .where(and(eq(hydrationEntries.userId, userId), eq(hydrationEntries.date, date)));
  return row.gallons;
}

export async function sumRuns(
  db: Db,
  userId: string,
  date: string,
): Promise<{ distanceKm: number; lastPace: string | null }> {
  const entries = await db
    .select()
    .from(runEntries)
    .where(and(eq(runEntries.userId, userId), eq(runEntries.date, date)))
    .orderBy(desc(runEntries.loggedAt));

  const distanceKm = entries.reduce((sum, e) => sum + e.distanceKm, 0);
  const lastPace = entries.find((e) => e.pace)?.pace ?? null;
  return { distanceKm, lastPace };
}
