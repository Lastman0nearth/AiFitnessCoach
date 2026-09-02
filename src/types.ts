export interface BlueprintConfig {
  id: string;
  userId: string;
  proteinFloorG: number;
  lowCalorieKcal: number;
  highCalorieKcal: number;
  resetCalorieKcal: number;
  fluidTargetGallons: number;
  sodiumMinMg: number;
  potassiumMinMg: number;
  autoregulationActive: boolean;
  autoregulationTriggeredAt: number | null;
  autoregulationReason: string | null;
  updatedAt: number;
}

export interface ScheduleEntry {
  id: string;
  dayOfWeek: number;
  label: string;
  dayType: "low" | "high" | "reset";
  targetCalories: number;
  amActivity: string | null;
  pmActivity: string | null;
  distanceKmGoal: number | null;
}

export interface UserProfile {
  id: string;
  name: string;
  heightInches: number | null;
  startWeightLbs: number | null;
  targetWeightLbs: number | null;
  age: number | null;
  startDate: string | null;
  targetDate: string | null;
}

export interface DailyLog {
  id: string;
  userId: string;
  date: string;
  dayType: "low" | "high" | "reset";
  targetCalories: number;
  currentWeightLbs: number | null;
  caloriesConsumed: number;
  proteinGConsumed: number;
  fatGConsumed: number;
  carbsGConsumed: number;
  fluidGallons: number;
  electrolytesReplenished: boolean;
  amCardioDone: boolean;
  pmStrengthDone: boolean;
  distanceKmActual: number;
  paceActual: string | null;
  notes: string | null;
}

export interface MealEntry {
  id: string;
  loggedAt: number;
  description: string;
  source: string;
  calories: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
}

export interface RemainingBudget {
  caloriesRemaining: number;
  proteinRemainingG: number;
  fatBudgetLeftG: number;
  carbsRemainingG: number;
  proteinFloorMet: boolean;
  overCalorieBudget: boolean;
}

export interface TodayResponse {
  date: string;
  schedule: ScheduleEntry | null;
  log: DailyLog;
  config: BlueprintConfig;
  remaining: RemainingBudget;
  meals: MealEntry[];
}

export interface FoodItem {
  id: string;
  name: string;
  brand: string | null;
  category: string | null;
  unitLabel: string;
  calories: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  quickLog: boolean;
}

export type Lift = "bench" | "row" | "deadlift" | "squat" | "ohp";

export interface StrengthEntry {
  id: string;
  date: string;
  lift: Lift;
  topWeightLbs: number;
}

export interface RunEntry {
  id: string;
  date: string;
  loggedAt: number;
  distanceKm: number;
  pace: string | null;
}

export interface HydrationEntry {
  id: string;
  date: string;
  loggedAt: number;
  gallons: number;
}

export interface WorkoutEntry {
  id: string;
  date: string;
  loggedAt: number;
  equipmentType: "weights" | "resistance" | "kettlebell";
  exerciseName: string;
  weightLbs: number | null;
  sets: number | null;
  reps: number | null;
  notes: string | null;
}

export interface WeeklyVolumeRow {
  date: string;
  label: string;
  goalKm: number | null;
  actualKm: number;
  pace: string | null;
}
