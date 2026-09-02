import { Hono } from "hono";
import { asc, eq } from "drizzle-orm";
import { getDb } from "../db/client";
import { dailyLogs } from "../db/schema";
import { DEFAULT_USER_ID } from "../lib/blueprint";
import { buildDayView, getConfig } from "../lib/dailyLog";

export const exportRoute = new Hono<{ Bindings: Env }>();

const COLUMNS = [
  "date",
  "dayType",
  "targetCalories",
  "caloriesConsumed",
  "proteinGConsumed",
  "fatGConsumed",
  "carbsGConsumed",
  "currentWeightLbs",
  "fluidGallons",
  "distanceKmActual",
  "paceActual",
  "electrolytesReplenished",
  "amCardioDone",
  "pmStrengthDone",
] as const;

function toCsvValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

exportRoute.get("/", async (c) => {
  const db = getDb(c.env);
  const userId = DEFAULT_USER_ID;

  const [logs, config] = await Promise.all([
    db.select().from(dailyLogs).where(eq(dailyLogs.userId, userId)).orderBy(asc(dailyLogs.date)),
    getConfig(db, userId),
  ]);
  if (!config) return c.json({ error: "Blueprint config not found" }, 500);

  const views = await Promise.all(logs.map((log) => buildDayView(db, userId, log, config)));

  const lines = [
    COLUMNS.join(","),
    ...views.map((row) => COLUMNS.map((col) => toCsvValue(row[col])).join(",")),
  ];

  return new Response(lines.join("\n"), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="athletic-blueprint-history.csv"`,
    },
  });
});
