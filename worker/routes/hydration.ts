import { Hono } from "hono";
import { and, asc, eq } from "drizzle-orm";
import { getDb } from "../db/client";
import { dailyLogs, hydrationEntries } from "../db/schema";
import { DEFAULT_USER_ID } from "../lib/blueprint";
import { buildDayView, getConfig, getOrCreateDailyLog, todayIso } from "../lib/dailyLog";

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

  if (body.addGallons) {
    await db.insert(hydrationEntries).values({
      id: crypto.randomUUID(),
      userId,
      date,
      loggedAt: Date.now(),
      gallons: body.addGallons,
    });
  }
  if (body.electrolytesReplenished !== undefined) {
    await db
      .update(dailyLogs)
      .set({ electrolytesReplenished: body.electrolytesReplenished })
      .where(eq(dailyLogs.id, log.id));
  }

  const view = await buildDayView(db, userId, log, config);
  const fluidTargetMet = view.fluidGallons >= config.fluidTargetGallons;
  const needsElectrolyteReminder =
    !view.electrolytesReplenished && (view.amCardioDone || view.pmStrengthDone);

  return c.json({ log: view, fluidTargetMet, needsElectrolyteReminder });
});

hydrationRoute.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const db = getDb(c.env);
  const [deleted] = await db
    .delete(hydrationEntries)
    .where(and(eq(hydrationEntries.id, id), eq(hydrationEntries.userId, userId)))
    .returning();
  if (!deleted) return c.json({ error: "Not found" }, 404);
  return c.json({ deleted: true });
});

hydrationRoute.get("/", async (c) => {
  const date = c.req.query("date") ?? todayIso();
  const db = getDb(c.env);
  const entries = await db
    .select()
    .from(hydrationEntries)
    .where(and(eq(hydrationEntries.userId, userId), eq(hydrationEntries.date, date)))
    .orderBy(asc(hydrationEntries.loggedAt));
  return c.json({ entries });
});
