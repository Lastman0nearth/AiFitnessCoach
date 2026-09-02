import { useCallback, useEffect, useState } from "react";
import { Download } from "lucide-react";
import { api } from "./lib/api";
import type {
  BlueprintConfig,
  FoodItem,
  ScheduleEntry,
  TodayResponse,
  UserProfile,
  WeeklyVolumeRow,
  WorkoutEntry,
} from "./types";
import { RadialGauge } from "./components/RadialGauge";
import { StatusHeader } from "./components/StatusHeader";
import { WeightTrendChart } from "./components/WeightTrendChart";
import { QuickLogConsole } from "./components/QuickLogConsole";
import { StrengthMonitor } from "./components/StrengthMonitor";
import { WeeklyVolumeMatrix } from "./components/WeeklyVolumeMatrix";
import { AlertBanner } from "./components/AlertBanner";
import { MealLogger } from "./components/MealLogger";
import { ActivityLogger } from "./components/ActivityLogger";

interface LiftStatus {
  lift: string;
  topWeightLbs: number | null;
  warning: boolean;
}

function dayNumber(date: string, startDate: string): number {
  const ms = new Date(`${date}T00:00:00`).getTime() - new Date(`${startDate}T00:00:00`).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24)) + 1;
}

export default function App() {
  const [today, setToday] = useState<TodayResponse | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [volumeRows, setVolumeRows] = useState<WeeklyVolumeRow[]>([]);
  const [weightHistory, setWeightHistory] = useState<{ date: string; weightLbs: number }[]>([]);
  const [lifts, setLifts] = useState<LiftStatus[]>([]);
  const [todaysWorkouts, setTodaysWorkouts] = useState<WorkoutEntry[]>([]);
  const [weightInput, setWeightInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    try {
      const [t, bp, fl, wv, wh, sl, wk] = await Promise.all([
        api.today() as Promise<TodayResponse>,
        api.blueprint() as Promise<{ config: BlueprintConfig; schedule: ScheduleEntry[]; user: UserProfile }>,
        api.foodLibrary() as Promise<{ items: FoodItem[] }>,
        api.weeklyVolume() as Promise<{ rows: WeeklyVolumeRow[] }>,
        api.weightHistory() as Promise<{ history: { date: string; weightLbs: number }[] }>,
        api.strengthLatest() as Promise<{ lifts: LiftStatus[] }>,
        api.todaysWorkouts() as Promise<{ entries: WorkoutEntry[] }>,
      ]);
      setToday(t);
      setUser(bp.user);
      setFoods(fl.items);
      setVolumeRows(wv.rows);
      setWeightHistory(wh.history);
      setLifts(sl.lifts);
      setTodaysWorkouts(wk.entries);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  async function withBusy(fn: () => Promise<unknown>) {
    setBusy(true);
    try {
      await fn();
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  if (error && !today) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-obsidian p-6 text-center text-warning">
        {error}
      </div>
    );
  }

  if (!today || !user) {
    return <div className="flex min-h-screen items-center justify-center bg-obsidian text-zinc-500">Loading blueprint…</div>;
  }

  const { log, config, remaining, schedule } = today;
  const totalDays = user.startDate && user.targetDate
    ? dayNumber(user.targetDate, user.startDate)
    : 61;
  const dNum = user.startDate ? dayNumber(today.date, user.startDate) : 1;
  const systemStatus = config.autoregulationActive || remaining.overCalorieBudget ? "WARNING" : "OPTIMIZED";
  const dayTypeLabel = schedule
    ? `${schedule.label.toUpperCase()} · ${schedule.dayType.toUpperCase()} (${log.targetCalories.toLocaleString()} kcal)`
    : `${log.dayType.toUpperCase()} (${log.targetCalories.toLocaleString()} kcal)`;

  const needsElectrolyteReminder =
    (log.amCardioDone || log.pmStrengthDone) && !log.electrolytesReplenished;

  return (
    <div className="min-h-screen bg-obsidian pb-10 text-zinc-100">
      <div className="mx-auto flex max-w-md flex-col gap-5 p-4 sm:max-w-lg">
        {config.autoregulationActive && (
          <AlertBanner
            variant="warning"
            title="10% Autoregulatory Strength Rule Active"
            message={config.autoregulationReason ?? "Baseline reset to a flat recovery floor."}
          />
        )}

        <StatusHeader
          dayNumber={dNum}
          totalDays={totalDays}
          dayTypeLabel={dayTypeLabel}
          caloriesRemaining={remaining.caloriesRemaining}
          systemStatus={systemStatus}
        />

        <div className="rounded-2xl bg-charcoal p-4">
          <div className="grid grid-cols-3 gap-2">
            <RadialGauge
              percent={(log.proteinGConsumed / config.proteinFloorG) * 100}
              colorClass="text-protein"
              label="Protein Floor"
              sublabel={`${Math.round(log.proteinGConsumed)}/${config.proteinFloorG}g`}
            />
            <RadialGauge
              percent={(log.caloriesConsumed / log.targetCalories) * 100}
              colorClass="text-calorie"
              label="Calorie Cycling"
              sublabel={`${Math.round(log.caloriesConsumed)}/${log.targetCalories}`}
            />
            <RadialGauge
              percent={(log.fluidGallons / config.fluidTargetGallons) * 100}
              colorClass="text-hydration"
              label="Hydration"
              sublabel={`${log.fluidGallons.toFixed(2)}/${config.fluidTargetGallons} gal`}
            />
          </div>
        </div>

        {remaining.overCalorieBudget && (
          <AlertBanner
            variant="warning"
            title="Deficit Rebalancing Alert"
            message={`You are over today's ${log.targetCalories} kcal cap. Skip remaining fats and stick to lean protein + fibrous carbs only.`}
          />
        )}
        {!remaining.overCalorieBudget && remaining.fatBudgetLeftG < 15 && remaining.caloriesRemaining > 100 && (
          <AlertBanner
            title="Budget Alert"
            message="Fat cap nearly met. Use dry protein sources (Seitan, Pea Protein Isolate) for remaining meals."
          />
        )}
        {needsElectrolyteReminder && (
          <AlertBanner
            title="Fluid & Sauna Sync"
            message="Post-workout: replenish min 500mg Sodium / 200mg Potassium and keep sipping toward your 2.0 gallon target."
          />
        )}

        <div className="rounded-2xl bg-charcoal p-4">
          <WeightTrendChart
            history={weightHistory}
            startDate={user.startDate ?? today.date}
            targetDate={user.targetDate ?? today.date}
            startWeightLbs={user.startWeightLbs ?? 200}
            targetWeightLbs={user.targetWeightLbs ?? 180}
          />
          <div className="mt-3 flex gap-2">
            <input
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              type="number"
              step="0.1"
              placeholder="Log today's weight (lbs)"
              className="flex-1 rounded-lg bg-charcoal-light px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-calorie"
            />
            <button
              disabled={busy || !weightInput}
              onClick={() =>
                withBusy(async () => {
                  await api.logWeight(Number(weightInput));
                  setWeightInput("");
                })
              }
              className="rounded-lg bg-charcoal-light px-3 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-700 disabled:opacity-50"
            >
              Log
            </button>
          </div>
        </div>

        <div className="rounded-2xl bg-charcoal p-4">
          <QuickLogConsole
            foods={foods}
            busy={busy}
            onQuickLogFood={(id) => withBusy(() => api.quickLogFood(id))}
            onAddWater={(gal) => withBusy(() => api.logHydration({ addGallons: gal }))}
          />
        </div>

        <div className="rounded-2xl bg-charcoal p-4">
          <MealLogger onLogged={loadAll} />
        </div>

        {today.meals.length > 0 && (
          <div className="rounded-2xl bg-charcoal p-4">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Today's Meals
            </div>
            <ul className="space-y-1 text-xs text-zinc-300">
              {today.meals.map((m) => (
                <li key={m.id} className="flex justify-between border-t border-zinc-800 py-1.5 first:border-t-0">
                  <span>{m.description}</span>
                  <span className="text-zinc-500">
                    {Math.round(m.calories)} kcal / {Math.round(m.proteinG)}g P
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="rounded-2xl bg-charcoal p-4">
          <ActivityLogger todaysWorkouts={todaysWorkouts} onLogged={loadAll} />
        </div>

        <div className="rounded-2xl bg-charcoal p-4">
          <StrengthMonitor lifts={lifts} />
        </div>

        <div className="rounded-2xl bg-charcoal p-4">
          <WeeklyVolumeMatrix rows={volumeRows} />
        </div>

        <a
          href="/api/export.csv"
          className="flex items-center justify-center gap-2 rounded-2xl bg-charcoal p-3 text-xs font-medium text-zinc-400 hover:text-zinc-200"
        >
          <Download size={14} /> Export Full History (CSV)
        </a>

        {error && <p className="text-center text-xs text-warning">{error}</p>}
      </div>
    </div>
  );
}
