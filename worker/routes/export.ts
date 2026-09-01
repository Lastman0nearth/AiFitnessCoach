import { Hono } from "hono";
import { asc, eq } from "drizzle-orm";
import { getDb } from "../db/client";
import { dailyLogs } from "../db/schema";
import { DEFAULT_USER_ID } from "../lib/blueprint";

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
  const rows = await db
    .select()
    .from(dailyLogs)
    .where(eq(dailyLogs.userId, DEFAULT_USER_ID))
    .orderBy(asc(dailyLogs.date));

  const lines = [
    COLUMNS.join(","),
    ...rows.map((row) => COLUMNS.map((col) => toCsvValue(row[col])).join(",")),
  ];

  return new Response(lines.join("\n"), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="athletic-blueprint-history.csv"`,
    },
  });
});
