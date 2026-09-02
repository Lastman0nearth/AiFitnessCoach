import { Hono } from "hono";
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../db/client";
import { strengthMetrics } from "../db/schema";
import { checkAutoregulation } from "../lib/autoregulation";
import { DEFAULT_USER_ID, LIFTS, type Lift } from "../lib/blueprint";
import { todayIso } from "../lib/dailyLog";

export const strengthRoute = new Hono<{ Bindings: Env }>();
const userId = DEFAULT_USER_ID;

interface LogStrengthBody {
  date?: string;
  lift: Lift;
  topWeightLbs: number;
}

function isValidBody(body: unknown): body is LogStrengthBody {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return typeof b.lift === "string" && LIFTS.includes(b.lift as Lift) && typeof b.topWeightLbs === "number";
}

strengthRoute.post("/", async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!isValidBody(body)) {
    return c.json({ error: `lift (one of ${LIFTS.join(", ")}) and topWeightLbs are required` }, 400);
  }

  const db = getDb(c.env);
  const date = body.date ?? todayIso();

  await db.insert(strengthMetrics).values({
    id: crypto.randomUUID(),
    userId,
    date,
    lift: body.lift,
    topWeightLbs: body.topWeightLbs,
  });

  const autoregulation = await checkAutoregulation(db, userId, body.lift);

  return c.json({ logged: true, autoregulation });
});

strengthRoute.get("/latest", async (c) => {
  const db = getDb(c.env);

  const results = await Promise.all(
    LIFTS.map(async (lift) => {
      const history = await db
        .select()
        .from(strengthMetrics)
        .where(and(eq(strengthMetrics.userId, userId), eq(strengthMetrics.lift, lift)))
        .orderBy(desc(strengthMetrics.date))
        .limit(2);

      if (history.length === 0) return { lift, topWeightLbs: null, warning: false };

      const [latest, prior] = history;
      const warning = prior ? (latest.topWeightLbs - prior.topWeightLbs) / prior.topWeightLbs <= -0.1 : false;

      return { lift, topWeightLbs: latest.topWeightLbs, warning };
    }),
  );

  return c.json({ lifts: results });
});

strengthRoute.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const db = getDb(c.env);
  const [deleted] = await db
    .delete(strengthMetrics)
    .where(and(eq(strengthMetrics.id, id), eq(strengthMetrics.userId, userId)))
    .returning();
  if (!deleted) return c.json({ error: "Not found" }, 404);
  return c.json({ deleted: true });
});

strengthRoute.get("/:lift/history", async (c) => {
  const lift = c.req.param("lift") as Lift;
  if (!LIFTS.includes(lift)) return c.json({ error: `lift must be one of ${LIFTS.join(", ")}` }, 400);
  const db = getDb(c.env);
  const entries = await db
    .select()
    .from(strengthMetrics)
    .where(and(eq(strengthMetrics.userId, userId), eq(strengthMetrics.lift, lift)))
    .orderBy(desc(strengthMetrics.date))
    .limit(10);
  return c.json({ entries });
});
