import { Hono } from "hono";
import { getDb } from "../db/client";
import { logMeal } from "../db/mealOps";
import { DEFAULT_USER_ID } from "../lib/blueprint";
import { getConfig, getOrCreateDailyLog, todayIso } from "../lib/dailyLog";
import { computeRemaining } from "../lib/macros";
import { photoParseLabel, suggestMeal, textParseMeal } from "../lib/anthropic";
import { foodLibrary } from "../db/schema";

export const mealsRoute = new Hono<{ Bindings: Env }>();
const userId = DEFAULT_USER_ID;

interface LogMealBody {
  date?: string;
  description: string;
  source: "manual" | "text_parsed" | "photo_parsed" | "quick_log";
  calories: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  rawInput?: string;
}

function isValidLogMealBody(body: unknown): body is LogMealBody {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.description === "string" &&
    typeof b.source === "string" &&
    typeof b.calories === "number" &&
    typeof b.proteinG === "number" &&
    typeof b.fatG === "number" &&
    typeof b.carbsG === "number"
  );
}

mealsRoute.post("/", async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!isValidLogMealBody(body)) {
    return c.json({ error: "description, source, calories, proteinG, fatG, carbsG are required" }, 400);
  }

  const db = getDb(c.env);
  const date = body.date ?? todayIso();
  const [log, config] = await Promise.all([
    getOrCreateDailyLog(db, userId, date),
    getConfig(db, userId),
  ]);
  if (!config) return c.json({ error: "Blueprint config not found" }, 500);

  const updatedLog = await logMeal(db, userId, log, body);

  return c.json({ log: updatedLog, remaining: computeRemaining(updatedLog, config) });
});

mealsRoute.post("/parse-text", async (c) => {
  const body = await c.req.json().catch(() => null);
  const text = (body as { text?: string } | null)?.text;
  if (!text || typeof text !== "string") {
    return c.json({ error: "text is required" }, 400);
  }
  try {
    const parsed = await textParseMeal(c.env, text);
    return c.json({ parsed });
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : "Parse failed" }, 502);
  }
});

mealsRoute.post("/parse-photo", async (c) => {
  const body = await c.req.json().catch(() => null);
  const { imageBase64, mediaType } = (body ?? {}) as { imageBase64?: string; mediaType?: string };
  if (!imageBase64 || !mediaType) {
    return c.json({ error: "imageBase64 and mediaType are required" }, 400);
  }
  try {
    const parsed = await photoParseLabel(c.env, imageBase64, mediaType);
    return c.json({ parsed });
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : "Parse failed" }, 502);
  }
});

mealsRoute.post("/suggest", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const date = (body as { date?: string }).date ?? todayIso();
  const db = getDb(c.env);

  const [log, config] = await Promise.all([
    getOrCreateDailyLog(db, userId, date),
    getConfig(db, userId),
  ]);
  if (!config) return c.json({ error: "Blueprint config not found" }, 500);

  const remaining = computeRemaining(log, config);
  const foods = await db.select().from(foodLibrary);

  try {
    const suggestion = await suggestMeal(c.env, {
      caloriesRemaining: remaining.caloriesRemaining,
      proteinRemainingG: remaining.proteinRemainingG,
      fatBudgetLeftG: remaining.fatBudgetLeftG,
      carbsRemainingG: remaining.carbsRemainingG,
      approvedFoods: foods.map((f) => `${f.name} (${f.brand ?? "generic"})`).concat([
        "Seitan",
        "Pea Protein Isolate",
        "Chickpea Tofu",
        "Organic Tempeh",
        "Lentils",
        "Jasmine White Rice",
        "Bananas",
        "Rolled Oats",
        "Avocado",
        "Raw Almonds",
        "Chia Seeds",
      ]),
    });
    return c.json({ suggestion, remaining });
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : "Suggestion failed" }, 502);
  }
});
