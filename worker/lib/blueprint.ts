// Ported from active_blueprint.md / daily_tracker.json — the "living reference"
// for the High-Performance Athletic Blueprint.

export const DEFAULT_USER_ID = "default-user";

export const BLUEPRINT_DEFAULTS = {
  proteinFloorG: 190,
  lowCalorieKcal: 1850,
  highCalorieKcal: 2300,
  resetCalorieKcal: 1700,
  fluidTargetGallons: 2.0,
  sodiumMinMg: 500,
  potassiumMinMg: 200,
};

export const USER_PROFILE_DEFAULTS = {
  name: "Athlete",
  heightInches: 71, // 5'11"
  startWeightLbs: 205,
  targetWeightLbs: 185,
  age: 37,
  startDate: "2026-09-01",
  targetDate: "2026-11-01",
};

type DayType = "low" | "high" | "reset";

export interface ScheduleDay {
  dayOfWeek: number; // 0=Sunday .. 6=Saturday
  label: string;
  dayType: DayType;
  targetCalories: number;
  amActivity: string;
  pmActivity: string;
  distanceKmGoal: number | null;
}

export const WEEKLY_SCHEDULE: ScheduleDay[] = [
  {
    dayOfWeek: 1,
    label: "Monday",
    dayType: "low",
    targetCalories: BLUEPRINT_DEFAULTS.lowCalorieKcal,
    amActivity: "8km Easy Run",
    pmActivity: "Heavy Bench / KB Push Focus",
    distanceKmGoal: 8,
  },
  {
    dayOfWeek: 2,
    label: "Tuesday",
    dayType: "high",
    targetCalories: BLUEPRINT_DEFAULTS.highCalorieKcal,
    amActivity: "10km Interval Track Session",
    pmActivity: "Sauna / Steam",
    distanceKmGoal: 10,
  },
  {
    dayOfWeek: 3,
    label: "Wednesday",
    dayType: "low",
    targetCalories: BLUEPRINT_DEFAULTS.lowCalorieKcal,
    amActivity: "45-60 Min Hike/Run",
    pmActivity: "Heavy Row / KB Pull Focus",
    distanceKmGoal: null,
  },
  {
    dayOfWeek: 4,
    label: "Thursday",
    dayType: "high",
    targetCalories: BLUEPRINT_DEFAULTS.highCalorieKcal,
    amActivity: "10km Intensive Track Run",
    pmActivity: "Heavy Deadlift / KB Hinge Focus",
    distanceKmGoal: 10,
  },
  {
    dayOfWeek: 5,
    label: "Friday",
    dayType: "low",
    targetCalories: BLUEPRINT_DEFAULTS.lowCalorieKcal,
    amActivity: "8km Easy Run",
    pmActivity: "Heavy OHP / KB Mixed Conditioning",
    distanceKmGoal: 8,
  },
  {
    dayOfWeek: 6,
    label: "Saturday",
    dayType: "high",
    targetCalories: BLUEPRINT_DEFAULTS.highCalorieKcal,
    amActivity: "15km-20km Long Endurance Run",
    pmActivity: "Sauna",
    distanceKmGoal: 17.5,
  },
  {
    dayOfWeek: 0,
    label: "Sunday",
    dayType: "reset",
    targetCalories: BLUEPRINT_DEFAULTS.resetCalorieKcal,
    amActivity: "Full CNS Rest",
    pmActivity: "No Running / Lifting",
    distanceKmGoal: 0,
  },
];

// Starter food library: ONLY fixed-serving packaged items with a printed
// label, per the "no portion guessing" rule. Values below are best-effort
// placeholders from the blueprint doc — correct them to the exact label via
// PUT /api/food-library/:id before relying on quick-log totals.
export const FOOD_LIBRARY_SEED = [
  {
    name: "Iron Vegan Athlete's Blend",
    brand: "Iron Vegan",
    category: "powder",
    unitLabel: "1 scoop",
    calories: 150,
    proteinG: 32,
    fatG: 3.5,
    carbsG: 3,
    quickLog: true,
  },
  {
    name: "Hemp Pro Fiber",
    brand: "Manitoba Harvest",
    category: "powder",
    unitLabel: "1 scoop",
    calories: 130,
    proteinG: 18,
    fatG: 3.5,
    carbsG: 9,
    quickLog: true,
  },
  {
    name: "Unsweetened Pea Milk",
    brand: "Ripple",
    category: "milk",
    unitLabel: "1 cup (240ml)",
    calories: 70,
    proteinG: 8,
    fatG: 4.5,
    carbsG: 0,
    quickLog: true,
  },
];

export const LIFTS = ["bench", "row", "deadlift", "squat", "ohp"] as const;
export type Lift = (typeof LIFTS)[number];
