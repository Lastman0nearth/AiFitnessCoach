import { Hono } from "hono";
import { and, asc, desc, eq } from "drizzle-orm";
import { getDb } from "../db/client";
import { dailyLogs, mealEntries, strengthMetrics, workoutEntries } from "../db/schema";
import { DEFAULT_USER_ID } from "../lib/blueprint";
import { buildDayView, getConfig, getExistingDailyLog } from "../lib/dailyLog";
import { hydrationEntries, runEntries } from "../db/schema";

export const historyRoute = new Hono<{ Bindings: Env }>();
const userId = DEFAULT_USER_ID;

// Dates that have any logged data, most recent first — read-only, never
// creates rows, so browsing history can't pollute the log with empty days.
historyRoute.get("/dates", async (c) => {
  const db = getDb(c.env);
  const logs = await db
    .select({ date: dailyLogs.date })
    .from(dailyLogs)
    .where(eq(dailyLogs.userId, userId))
    .orderBy(desc(dailyLogs.date))
    .limit(90);
  return c.json({ dates: logs.map((l) => l.date) });
});

historyRoute.get("/summary", async (c) => {
  const date = c.req.query("date");
  if (!date) return c.json({ error: "date is required" }, 400);

  const db = getDb(c.env);
  const log = await getExistingDailyLog(db, userId, date);
  if (!log) return c.json({ empty: true, date });

  const config = await getConfig(db, userId);
  if (!config) return c.json({ error: "Blueprint config not found" }, 500);

  const [view, meals, workouts, runs, strength, hydration] = await Promise.all([
    buildDayView(db, userId, log, config),
    db
      .select()
      .from(mealEntries)
      .where(and(eq(mealEntries.userId, userId), eq(mealEntries.dailyLogId, log.id)))
      .orderBy(asc(mealEntries.loggedAt)),
    db
      .select()
      .from(workoutEntries)
      .where(and(eq(workoutEntries.userId, userId), eq(workoutEntries.date, date)))
      .orderBy(asc(workoutEntries.loggedAt)),
    db
      .select()
      .from(runEntries)
      .where(and(eq(runEntries.userId, userId), eq(runEntries.date, date)))
      .orderBy(asc(runEntries.loggedAt)),
    db
      .select()
      .from(strengthMetrics)
      .where(and(eq(strengthMetrics.userId, userId), eq(strengthMetrics.date, date))),
    db
      .select()
      .from(hydrationEntries)
      .where(and(eq(hydrationEntries.userId, userId), eq(hydrationEntries.date, date)))
      .orderBy(asc(hydrationEntries.loggedAt)),
  ]);

  return c.json({ empty: false, date, log: view, meals, workouts, runs, strength, hydration });
});
