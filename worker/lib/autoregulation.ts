import { and, desc, eq } from "drizzle-orm";
import type { Db } from "../db/client";
import { blueprintConfig, strengthMetrics } from "../db/schema";
import type { Lift } from "./blueprint";

const DROP_THRESHOLD = 0.1; // 10% Autoregulatory Strength Rule
const SAFETY_FLOOR_KCAL = 2000;

export interface AutoregulationResult {
  triggered: boolean;
  message?: string;
}

/**
 * Checks the last three logged top-weights for a lift. If the two most
 * recent week-over-week deltas are both drops of >10%, the CNS/muscle-wasting
 * safety rule fires: flatten the baseline to a 2,000 kcal recovery floor.
 */
export async function checkAutoregulation(
  db: Db,
  userId: string,
  lift: Lift,
): Promise<AutoregulationResult> {
  const history = await db
    .select()
    .from(strengthMetrics)
    .where(and(eq(strengthMetrics.userId, userId), eq(strengthMetrics.lift, lift)))
    .orderBy(desc(strengthMetrics.date))
    .limit(3);

  if (history.length < 3) {
    return { triggered: false };
  }

  const [latest, prior, priorPrior] = history;
  const delta1 = (latest.topWeightLbs - prior.topWeightLbs) / prior.topWeightLbs;
  const delta2 = (prior.topWeightLbs - priorPrior.topWeightLbs) / priorPrior.topWeightLbs;

  const bothDropped = delta1 <= -DROP_THRESHOLD && delta2 <= -DROP_THRESHOLD;
  if (!bothDropped) {
    return { triggered: false };
  }

  const reason = `${lift} top weight dropped ${(delta2 * -100).toFixed(1)}% then ${(delta1 * -100).toFixed(1)}% across two consecutive microcycles.`;

  await db
    .update(blueprintConfig)
    .set({
      lowCalorieKcal: SAFETY_FLOOR_KCAL,
      highCalorieKcal: SAFETY_FLOOR_KCAL,
      resetCalorieKcal: SAFETY_FLOOR_KCAL,
      autoregulationActive: true,
      autoregulationTriggeredAt: Date.now(),
      autoregulationReason: reason,
      updatedAt: Date.now(),
    })
    .where(eq(blueprintConfig.userId, userId));

  return {
    triggered: true,
    message: `10% AUTOREGULATORY STRENGTH RULE TRIGGERED: ${reason} Daily baseline reset to a flat ${SAFETY_FLOOR_KCAL} kcal recovery floor to protect against muscle wasting.`,
  };
}
