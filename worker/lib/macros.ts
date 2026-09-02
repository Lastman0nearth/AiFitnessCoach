import type { blueprintConfig } from "../db/schema";

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

/** Maps a day-view's renamed *Consumed fields back to plain MacroTotals. */
export function toMacroTotals(view: {
  caloriesConsumed: number;
  proteinGConsumed: number;
  fatGConsumed: number;
  carbsGConsumed: number;
}): MacroTotals {
  return {
    calories: view.caloriesConsumed,
    proteinG: view.proteinGConsumed,
    fatG: view.fatGConsumed,
    carbsG: view.carbsGConsumed,
  };
}

export function computeRemaining(
  targetCalories: number,
  totals: MacroTotals,
  config: BlueprintConfig,
): RemainingBudget {
  const caloriesRemaining = Math.round(targetCalories - totals.calories);
  const proteinRemainingG = Math.max(0, Math.round(config.proteinFloorG - totals.proteinG));

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
    proteinFloorMet: totals.proteinG >= config.proteinFloorG,
    overCalorieBudget: totals.calories > targetCalories,
  };
}
