import { Hono } from "hono";
import { and, asc, desc, eq } from "drizzle-orm";
import { getDb } from "../db/client";
import { dailyLogs, runEntries } from "../db/schema";
import { DEFAULT_USER_ID } from "../lib/blueprint";
import { sumRuns } from "../lib/aggregates";
import { getOrCreateDailyLog, getSchedule, todayIso } from "../lib/dailyLog";

export const runsRoute = new Hono<{ Bindings: Env }>();
const userId = DEFAULT_USER_ID;

interface LogRunBody {
  date?: string;
  distanceKm: number;
  pace?: string;
}

runsRoute.post("/", async (c) => {
  const body = (await c.req.json().catch(() => null)) as LogRunBody | null;
  if (!body || typeof body.distanceKm !== "number") {
    return c.json({ error: "distanceKm is required" }, 400);
  }
  const date = body.date ?? todayIso();
  const db = getDb(c.env);
  const log = await getOrCreateDailyLog(db, userId, date);

  await db.insert(runEntries).values({
    id: crypto.randomUUID(),
    userId,
    date,
    loggedAt: Date.now(),
    distanceKm: body.distanceKm,
    pace: body.pace,
  });

  if (!log.amCardioDone) {
    await db.update(dailyLogs).set({ amCardioDone: true }).where(eq(dailyLogs.id, log.id));
  }

  return c.json({ logged: true });
});

runsRoute.get("/", async (c) => {
  const date = c.req.query("date") ?? todayIso();
  const db = getDb(c.env);
  const entries = await db
    .select()
    .from(runEntries)
    .where(and(eq(runEntries.userId, userId), eq(runEntries.date, date)))
    .orderBy(asc(runEntries.loggedAt));
  return c.json({ entries });
});

runsRoute.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const db = getDb(c.env);
  const [deleted] = await db
    .delete(runEntries)
    .where(and(eq(runEntries.id, id), eq(runEntries.userId, userId)))
    .returning();
  if (!deleted) return c.json({ error: "Not found" }, 404);
  return c.json({ deleted: true });
});

// Last 7 days of planned-vs-actual running volume for the dashboard matrix.
runsRoute.get("/weekly-volume", async (c) => {
  const db = getDb(c.env);
  const logs = await db
    .select()
    .from(dailyLogs)
    .where(eq(dailyLogs.userId, userId))
    .orderBy(desc(dailyLogs.date))
    .limit(7);

  const rows = await Promise.all(
    logs.map(async (log) => {
      const [schedule, runs] = await Promise.all([
        getSchedule(db, userId, log.date),
        sumRuns(db, userId, log.date),
      ]);
      return {
        date: log.date,
        label: schedule?.amActivity ?? "Rest",
        goalKm: schedule?.distanceKmGoal ?? null,
        actualKm: runs.distanceKm,
        pace: runs.lastPace,
      };
    }),
  );

  return c.json({ rows: rows.reverse() });
});
