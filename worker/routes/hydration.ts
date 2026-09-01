import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { getDb } from "../db/client";
import { dailyLogs } from "../db/schema";
import { DEFAULT_USER_ID } from "../lib/blueprint";
import { getConfig, getOrCreateDailyLog, todayIso } from "../lib/dailyLog";

export const hydrationRoute = new Hono<{ Bindings: Env }>();
const userId = DEFAULT_USER_ID;

interface HydrationBody {
  date?: string;
  addGallons?: number;
  electrolytesReplenished?: boolean;
}

hydrationRoute.post("/", async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as HydrationBody;
  const date = body.date ?? todayIso();
  const db = getDb(c.env);

  const [log, config] = await Promise.all([
    getOrCreateDailyLog(db, userId, date),
    getConfig(db, userId),
  ]);
  if (!config) return c.json({ error: "Blueprint config not found" }, 500);

  const [updated] = await db
    .update(dailyLogs)
    .set({
      fluidGallons: log.fluidGallons + (body.addGallons ?? 0),
      electrolytesReplenished:
        body.electrolytesReplenished ?? log.electrolytesReplenished,
    })
    .where(eq(dailyLogs.id, log.id))
    .returning();

  const fluidTargetMet = updated.fluidGallons >= config.fluidTargetGallons;
  const needsElectrolyteReminder =
    !updated.electrolytesReplenished &&
    (log.amCardioDone || log.pmStrengthDone);

  return c.json({ log: updated, fluidTargetMet, needsElectrolyteReminder });
});
