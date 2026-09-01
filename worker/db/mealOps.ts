import { eq } from "drizzle-orm";
import type { Db } from "./client";
import { dailyLogs, mealEntries } from "./schema";
import { accumulate, type MacroTotals } from "../lib/macros";

type DailyLog = typeof dailyLogs.$inferSelect;

export interface MealInput extends MacroTotals {
  description: string;
  source: "manual" | "text_parsed" | "photo_parsed" | "quick_log";
  rawInput?: string;
}

export async function logMeal(db: Db, userId: string, log: DailyLog, meal: MealInput) {
  await db.insert(mealEntries).values({
    id: crypto.randomUUID(),
    userId,
    dailyLogId: log.id,
    loggedAt: Date.now(),
    description: meal.description,
    source: meal.source,
    calories: meal.calories,
    proteinG: meal.proteinG,
    fatG: meal.fatG,
    carbsG: meal.carbsG,
    rawInput: meal.rawInput,
  });

  const totals = accumulate(log, meal);
  const [updated] = await db
    .update(dailyLogs)
    .set(totals)
    .where(eq(dailyLogs.id, log.id))
    .returning();

  return updated;
}
