import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  heightInches: real("height_inches"),
  startWeightLbs: real("start_weight_lbs"),
  targetWeightLbs: real("target_weight_lbs"),
  age: integer("age"),
  startDate: text("start_date"),
  targetDate: text("target_date"),
  createdAt: integer("created_at").notNull(),
});

// The "living" mutable baseline. Autoregulation can rewrite these fields.
export const blueprintConfig = sqliteTable("blueprint_config", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  proteinFloorG: real("protein_floor_g").notNull().default(190),
  lowCalorieKcal: integer("low_calorie_kcal").notNull().default(1850),
  highCalorieKcal: integer("high_calorie_kcal").notNull().default(2300),
  resetCalorieKcal: integer("reset_calorie_kcal").notNull().default(1700),
  fluidTargetGallons: real("fluid_target_gallons").notNull().default(2.0),
  sodiumMinMg: integer("sodium_min_mg").notNull().default(500),
  potassiumMinMg: integer("potassium_min_mg").notNull().default(200),
  autoregulationActive: integer("autoregulation_active", { mode: "boolean" })
    .notNull()
    .default(false),
  autoregulationTriggeredAt: integer("autoregulation_triggered_at"),
  autoregulationReason: text("autoregulation_reason"),
  updatedAt: integer("updated_at").notNull(),
});

export const weeklySchedule = sqliteTable("weekly_schedule", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  dayOfWeek: integer("day_of_week").notNull(), // 0=Sunday .. 6=Saturday
  label: text("label").notNull(),
  dayType: text("day_type").notNull(), // 'low' | 'high' | 'reset'
  targetCalories: integer("target_calories").notNull(),
  amActivity: text("am_activity"),
  pmActivity: text("pm_activity"),
  distanceKmGoal: real("distance_km_goal"),
});

export const dailyLogs = sqliteTable("daily_logs", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD
  dayType: text("day_type").notNull(),
  targetCalories: integer("target_calories").notNull(),
  currentWeightLbs: real("current_weight_lbs"),
  caloriesConsumed: real("calories_consumed").notNull().default(0),
  proteinGConsumed: real("protein_g_consumed").notNull().default(0),
  fatGConsumed: real("fat_g_consumed").notNull().default(0),
  carbsGConsumed: real("carbs_g_consumed").notNull().default(0),
  fluidGallons: real("fluid_gallons").notNull().default(0),
  distanceKmActual: real("distance_km_actual").notNull().default(0),
  paceActual: text("pace_actual"),
  electrolytesReplenished: integer("electrolytes_replenished", { mode: "boolean" })
    .notNull()
    .default(false),
  amCardioDone: integer("am_cardio_done", { mode: "boolean" }).notNull().default(false),
  pmStrengthDone: integer("pm_strength_done", { mode: "boolean" }).notNull().default(false),
  notes: text("notes"),
  createdAt: integer("created_at").notNull(),
});

export const mealEntries = sqliteTable("meal_entries", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  dailyLogId: text("daily_log_id").notNull(),
  loggedAt: integer("logged_at").notNull(),
  description: text("description").notNull(),
  source: text("source").notNull(), // manual | text_parsed | photo_parsed | quick_log
  calories: real("calories").notNull(),
  proteinG: real("protein_g").notNull(),
  fatG: real("fat_g").notNull(),
  carbsG: real("carbs_g").notNull(),
  rawInput: text("raw_input"),
});

export const strengthMetrics = sqliteTable("strength_metrics", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  date: text("date").notNull(),
  lift: text("lift").notNull(), // bench | row | deadlift | squat | ohp
  topWeightLbs: real("top_weight_lbs").notNull(),
});

export const foodLibrary = sqliteTable("food_library", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  brand: text("brand"),
  category: text("category"), // protein | powder | milk | fat | carb
  unitLabel: text("unit_label").notNull(), // e.g. "1 scoop", "1 cup cooked"
  calories: real("calories").notNull(),
  proteinG: real("protein_g").notNull(),
  fatG: real("fat_g").notNull(),
  carbsG: real("carbs_g").notNull(),
  quickLog: integer("quick_log", { mode: "boolean" }).notNull().default(false),
});
