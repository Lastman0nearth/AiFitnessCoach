import { eq } from "drizzle-orm";
import type { Db } from "./client";
import { blueprintConfig, foodLibrary, users, weeklySchedule } from "./schema";
import {
  BLUEPRINT_DEFAULTS,
  DEFAULT_USER_ID,
  FOOD_LIBRARY_SEED,
  USER_PROFILE_DEFAULTS,
  WEEKLY_SCHEDULE,
} from "../lib/blueprint";

let seeded = false;

/** Idempotent: seeds the default user + blueprint on first run only. */
export async function ensureSeeded(db: Db) {
  if (seeded) return;

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, DEFAULT_USER_ID))
    .limit(1);

  if (existing.length > 0) {
    seeded = true;
    return;
  }

  const now = Date.now();

  await db.insert(users).values({
    id: DEFAULT_USER_ID,
    name: USER_PROFILE_DEFAULTS.name,
    heightInches: USER_PROFILE_DEFAULTS.heightInches,
    startWeightLbs: USER_PROFILE_DEFAULTS.startWeightLbs,
    targetWeightLbs: USER_PROFILE_DEFAULTS.targetWeightLbs,
    age: USER_PROFILE_DEFAULTS.age,
    startDate: USER_PROFILE_DEFAULTS.startDate,
    targetDate: USER_PROFILE_DEFAULTS.targetDate,
    createdAt: now,
  });

  await db.insert(blueprintConfig).values({
    id: crypto.randomUUID(),
    userId: DEFAULT_USER_ID,
    ...BLUEPRINT_DEFAULTS,
    updatedAt: now,
  });

  await db.insert(weeklySchedule).values(
    WEEKLY_SCHEDULE.map((day) => ({
      id: crypto.randomUUID(),
      userId: DEFAULT_USER_ID,
      ...day,
    })),
  );

  await db.insert(foodLibrary).values(
    FOOD_LIBRARY_SEED.map((item) => ({
      id: crypto.randomUUID(),
      userId: DEFAULT_USER_ID,
      ...item,
    })),
  );

  seeded = true;
}
