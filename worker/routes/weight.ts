import { Hono } from "hono";
import { asc, eq } from "drizzle-orm";
import { getDb } from "../db/client";
import { dailyLogs } from "../db/schema";
import { DEFAULT_USER_ID } from "../lib/blueprint";
import { getOrCreateDailyLog, todayIso } from "../lib/dailyLog";

export const weightRoute = new Hono<{ Bindings: Env }>();
const userId = DEFAULT_USER_ID;

weightRoute.post("/", async (c) => {
  const body = (await c.req.json().catch(() => null)) as { date?: string; weightLbs?: number } | null;
  if (!body || typeof body.weightLbs !== "number") {
    return c.json({ error: "weightLbs is required" }, 400);
  }
  const date = body.date ?? todayIso();
  const db = getDb(c.env);
  const log = await getOrCreateDailyLog(db, userId, date);

  const [updated] = await db
    .update(dailyLogs)
    .set({ currentWeightLbs: body.weightLbs })
    .where(eq(dailyLogs.id, log.id))
    .returning();

  return c.json({ log: updated });
});

weightRoute.get("/history", async (c) => {
  const db = getDb(c.env);
  const logs = await db
    .select({ date: dailyLogs.date, weightLbs: dailyLogs.currentWeightLbs })
    .from(dailyLogs)
    .where(eq(dailyLogs.userId, userId))
    .orderBy(asc(dailyLogs.date));

  return c.json({ history: logs.filter((l) => l.weightLbs !== null) });
});
