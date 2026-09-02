import { Hono } from "hono";
import { and, asc, eq } from "drizzle-orm";
import { getDb } from "../db/client";
import { mealEntries } from "../db/schema";
import { DEFAULT_USER_ID } from "../lib/blueprint";
import { computeRemaining, toMacroTotals } from "../lib/macros";
import { buildDayView, getConfig, getOrCreateDailyLog, getSchedule, todayIso } from "../lib/dailyLog";

export const todayRoute = new Hono<{ Bindings: Env }>();

todayRoute.get("/", async (c) => {
  const date = c.req.query("date") ?? todayIso();
  const db = getDb(c.env);
  const userId = DEFAULT_USER_ID;

  const [log, config, schedule] = await Promise.all([
    getOrCreateDailyLog(db, userId, date),
    getConfig(db, userId),
    getSchedule(db, userId, date),
  ]);
  if (!config) return c.json({ error: "Blueprint config not found" }, 500);

  const view = await buildDayView(db, userId, log, config);

  const meals = await db
    .select()
    .from(mealEntries)
    .where(and(eq(mealEntries.userId, userId), eq(mealEntries.dailyLogId, log.id)))
    .orderBy(asc(mealEntries.loggedAt));

  return c.json({
    date,
    schedule,
    log: view,
    config,
    remaining: computeRemaining(view.targetCalories, toMacroTotals(view), config),
    meals,
  });
});
