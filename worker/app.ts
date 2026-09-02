import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { getDb } from "./db/client";
import { ensureSeeded } from "./db/seed";
import { blueprintConfig, users, weeklySchedule } from "./db/schema";
import { DEFAULT_USER_ID } from "./lib/blueprint";
import { todayRoute } from "./routes/today";
import { mealsRoute } from "./routes/meals";
import { strengthRoute } from "./routes/strength";
import { hydrationRoute } from "./routes/hydration";
import { foodLibraryRoute } from "./routes/foodLibrary";
import { exportRoute } from "./routes/export";
import { runsRoute } from "./routes/runs";
import { weightRoute } from "./routes/weight";
import { workoutsRoute } from "./routes/workouts";

const app = new Hono<{ Bindings: Env }>();

app.use("*", async (c, next) => {
  await ensureSeeded(getDb(c.env));
  await next();
});

app.get("/api/blueprint", async (c) => {
  const db = getDb(c.env);
  const userId = DEFAULT_USER_ID;
  const [config, schedule, user] = await Promise.all([
    db.select().from(blueprintConfig).where(eq(blueprintConfig.userId, userId)).limit(1),
    db.select().from(weeklySchedule).where(eq(weeklySchedule.userId, userId)),
    db.select().from(users).where(eq(users.id, userId)).limit(1),
  ]);
  return c.json({ config: config[0] ?? null, schedule, user: user[0] ?? null });
});

app.route("/api/today", todayRoute);
app.route("/api/meals", mealsRoute);
app.route("/api/strength", strengthRoute);
app.route("/api/hydration", hydrationRoute);
app.route("/api/food-library", foodLibraryRoute);
app.route("/api/export.csv", exportRoute);
app.route("/api/runs", runsRoute);
app.route("/api/weight", weightRoute);
app.route("/api/workouts", workoutsRoute);

app.onError((err, c) => {
  console.error(err);
  return c.json({ error: "Internal error", detail: err.message }, 500);
});

// Anything that isn't an API route falls through to the static frontend.
app.notFound((c) => c.env.ASSETS.fetch(c.req.raw));

export default app;
