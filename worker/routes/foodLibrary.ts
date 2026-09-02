import { Hono } from "hono";
import { and, eq } from "drizzle-orm";
import { getDb } from "../db/client";
import { foodLibrary } from "../db/schema";
import { logMeal } from "../db/mealOps";
import { DEFAULT_USER_ID } from "../lib/blueprint";
import { buildDayView, getConfig, getOrCreateDailyLog, todayIso } from "../lib/dailyLog";
import { computeRemaining, toMacroTotals } from "../lib/macros";

export const foodLibraryRoute = new Hono<{ Bindings: Env }>();
const userId = DEFAULT_USER_ID;

interface FoodItemBody {
  name: string;
  brand?: string;
  category?: string;
  unitLabel: string;
  calories: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  quickLog?: boolean;
}

function isValidFoodItem(body: unknown): body is FoodItemBody {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.name === "string" &&
    typeof b.unitLabel === "string" &&
    typeof b.calories === "number" &&
    typeof b.proteinG === "number" &&
    typeof b.fatG === "number" &&
    typeof b.carbsG === "number"
  );
}

foodLibraryRoute.get("/", async (c) => {
  const db = getDb(c.env);
  const items = await db.select().from(foodLibrary).where(eq(foodLibrary.userId, userId));
  return c.json({ items });
});

foodLibraryRoute.post("/", async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!isValidFoodItem(body)) {
    return c.json({ error: "name, unitLabel, calories, proteinG, fatG, carbsG are required" }, 400);
  }
  const db = getDb(c.env);
  const [created] = await db
    .insert(foodLibrary)
    .values({ id: crypto.randomUUID(), userId, quickLog: false, ...body })
    .returning();
  return c.json({ item: created }, 201);
});

foodLibraryRoute.put("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => null);
  if (!isValidFoodItem(body)) {
    return c.json({ error: "name, unitLabel, calories, proteinG, fatG, carbsG are required" }, 400);
  }
  const db = getDb(c.env);
  const [updated] = await db
    .update(foodLibrary)
    .set(body)
    .where(and(eq(foodLibrary.id, id), eq(foodLibrary.userId, userId)))
    .returning();
  if (!updated) return c.json({ error: "Not found" }, 404);
  return c.json({ item: updated });
});

foodLibraryRoute.post("/:id/quick-log", async (c) => {
  const id = c.req.param("id");
  const body = (await c.req.json().catch(() => ({}))) as { date?: string };
  const date = body.date ?? todayIso();
  const db = getDb(c.env);

  const [item] = await db
    .select()
    .from(foodLibrary)
    .where(and(eq(foodLibrary.id, id), eq(foodLibrary.userId, userId)))
    .limit(1);
  if (!item) return c.json({ error: "Food item not found" }, 404);

  const [log, config] = await Promise.all([
    getOrCreateDailyLog(db, userId, date),
    getConfig(db, userId),
  ]);
  if (!config) return c.json({ error: "Blueprint config not found" }, 500);

  await logMeal(db, userId, log.id, {
    description: `${item.unitLabel} ${item.name}`,
    source: "quick_log",
    calories: item.calories,
    proteinG: item.proteinG,
    fatG: item.fatG,
    carbsG: item.carbsG,
  });
  const view = await buildDayView(db, userId, log, config);

  return c.json({ log: view, remaining: computeRemaining(view.targetCalories, toMacroTotals(view), config) });
});
