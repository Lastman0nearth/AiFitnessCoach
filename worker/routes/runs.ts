import { Hono } from "hono";
import { desc, eq } from "drizzle-orm";
import { getDb } from "../db/client";
import { dailyLogs } from "../db/schema";
import { DEFAULT_USER_ID } from "../lib/blueprint";
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

  const [updated] = await db
    .update(dailyLogs)
    .set({
      distanceKmActual: log.distanceKmActual + body.distanceKm,
      paceActual: body.pace ?? log.paceActual,
      amCardioDone: true,
    })
    .where(eq(dailyLogs.id, log.id))
    .returning();

  return c.json({ log: updated });
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
      const schedule = await getSchedule(db, userId, log.date);
      return {
        date: log.date,
        label: schedule?.amActivity ?? "Rest",
        goalKm: schedule?.distanceKmGoal ?? null,
        actualKm: log.distanceKmActual,
        pace: log.paceActual,
      };
    }),
  );

  return c.json({ rows: rows.reverse() });
});
