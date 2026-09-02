import { Hono } from "hono";
import { and, asc, eq } from "drizzle-orm";
import { getDb } from "../db/client";
import { dailyLogs, workoutEntries } from "../db/schema";
import { DEFAULT_USER_ID } from "../lib/blueprint";
import { getOrCreateDailyLog, todayIso } from "../lib/dailyLog";

export const workoutsRoute = new Hono<{ Bindings: Env }>();
const userId = DEFAULT_USER_ID;

const EQUIPMENT_TYPES = ["weights", "resistance", "kettlebell"] as const;
type EquipmentType = (typeof EQUIPMENT_TYPES)[number];

interface LogWorkoutBody {
  date?: string;
  equipmentType: EquipmentType;
  exerciseName: string;
  weightLbs?: number;
  sets?: number;
  reps?: number;
  notes?: string;
}

function isValidBody(body: unknown): body is LogWorkoutBody {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.equipmentType === "string" &&
    EQUIPMENT_TYPES.includes(b.equipmentType as EquipmentType) &&
    typeof b.exerciseName === "string" &&
    b.exerciseName.trim().length > 0
  );
}

workoutsRoute.post("/", async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!isValidBody(body)) {
    return c.json(
      { error: `equipmentType (one of ${EQUIPMENT_TYPES.join(", ")}) and exerciseName are required` },
      400,
    );
  }

  const date = body.date ?? todayIso();
  const db = getDb(c.env);
  const log = await getOrCreateDailyLog(db, userId, date);

  await db.insert(workoutEntries).values({
    id: crypto.randomUUID(),
    userId,
    date,
    loggedAt: Date.now(),
    equipmentType: body.equipmentType,
    exerciseName: body.exerciseName.trim(),
    weightLbs: body.weightLbs,
    sets: body.sets,
    reps: body.reps,
    notes: body.notes,
  });

  if (!log.pmStrengthDone) {
    await db.update(dailyLogs).set({ pmStrengthDone: true }).where(eq(dailyLogs.id, log.id));
  }

  return c.json({ logged: true });
});

workoutsRoute.get("/", async (c) => {
  const date = c.req.query("date") ?? todayIso();
  const db = getDb(c.env);
  const entries = await db
    .select()
    .from(workoutEntries)
    .where(and(eq(workoutEntries.userId, userId), eq(workoutEntries.date, date)))
    .orderBy(asc(workoutEntries.loggedAt));
  return c.json({ entries });
});
