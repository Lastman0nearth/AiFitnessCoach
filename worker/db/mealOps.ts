import type { Db } from "./client";
import { mealEntries } from "./schema";
import type { MacroTotals } from "../lib/macros";

export interface MealInput extends MacroTotals {
  description: string;
  source: "manual" | "text_parsed" | "photo_parsed" | "quick_log";
  rawInput?: string;
}

export async function logMeal(db: Db, userId: string, dailyLogId: string, meal: MealInput) {
  const [created] = await db
    .insert(mealEntries)
    .values({
      id: crypto.randomUUID(),
      userId,
      dailyLogId,
      loggedAt: Date.now(),
      description: meal.description,
      source: meal.source,
      calories: meal.calories,
      proteinG: meal.proteinG,
      fatG: meal.fatG,
      carbsG: meal.carbsG,
      rawInput: meal.rawInput,
    })
    .returning();
  return created;
}
