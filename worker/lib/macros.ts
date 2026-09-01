import type { dailyLogs, blueprintConfig } from "../db/schema";

type DailyLog = typeof dailyLogs.$inferSelect;
type BlueprintConfig = typeof blueprintConfig.$inferSelect;

export interface MacroTotals {
  calories: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
}

export interface RemainingBudget {
  caloriesRemaining: number;
  proteinRemainingG: number;
  fatBudgetLeftG: number;
  carbsRemainingG: number;
  proteinFloorMet: boolean;
  overCalorieBudget: boolean;
}

// Rough macro-to-calorie split used only to bound a "remaining fat" hint —
// real fat/carb targets come from what's actually left after protein.
const FAT_KCAL_PER_G = 9;
const PROTEIN_KCAL_PER_G = 4;
const CARB_KCAL_PER_G = 4;

export function computeRemaining(log: DailyLog, config: BlueprintConfig): RemainingBudget {
  const caloriesRemaining = Math.round(log.targetCalories - log.caloriesConsumed);
  const proteinRemainingG = Math.max(0, Math.round(config.proteinFloorG - log.proteinGConsumed));

  // Calories left after reserving room for the remaining protein floor,
  // converted to a fat budget so a late-day meal doesn't blow the day.
  const caloriesAfterProteinReserve = caloriesRemaining - proteinRemainingG * PROTEIN_KCAL_PER_G;
  const fatBudgetLeftG = Math.max(0, Math.round(caloriesAfterProteinReserve / FAT_KCAL_PER_G));
  const carbsRemainingG = Math.max(
    0,
    Math.round((caloriesRemaining - proteinRemainingG * PROTEIN_KCAL_PER_G) / CARB_KCAL_PER_G),
  );

  return {
    caloriesRemaining,
    proteinRemainingG,
    fatBudgetLeftG,
    carbsRemainingG,
    proteinFloorMet: log.proteinGConsumed >= config.proteinFloorG,
    overCalorieBudget: log.caloriesConsumed > log.targetCalories,
  };
}

export function accumulate(log: DailyLog, meal: MacroTotals) {
  return {
    caloriesConsumed: log.caloriesConsumed + meal.calories,
    proteinGConsumed: log.proteinGConsumed + meal.proteinG,
    fatGConsumed: log.fatGConsumed + meal.fatG,
    carbsGConsumed: log.carbsGConsumed + meal.carbsG,
  };
}
