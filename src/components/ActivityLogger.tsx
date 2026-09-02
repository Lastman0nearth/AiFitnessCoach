import { useState } from "react";
import { X } from "lucide-react";
import { api } from "../lib/api";
import type { Lift, RunEntry, WorkoutEntry } from "../types";

const LIFTS: Lift[] = ["bench", "row", "deadlift", "squat", "ohp"];
const EQUIPMENT_TYPES = ["weights", "resistance", "kettlebell"] as const;

const inputClass =
  "w-full min-w-0 rounded-lg bg-charcoal-light px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-protein";
const selectClass =
  "w-full min-w-0 rounded-lg bg-charcoal-light px-2 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-protein";
const submitClass =
  "w-full rounded-lg bg-charcoal-light px-3 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-700 disabled:opacity-50";
const sectionClass = "space-y-2 rounded-lg border border-zinc-800 p-3";

interface ActivityLoggerProps {
  todaysWorkouts: WorkoutEntry[];
  todaysRuns: RunEntry[];
  onLogged: () => void;
}

export function ActivityLogger({ todaysWorkouts, todaysRuns, onLogged }: ActivityLoggerProps) {
  const [distanceKm, setDistanceKm] = useState("");
  const [pace, setPace] = useState("");

  const [equipmentType, setEquipmentType] =
    useState<(typeof EQUIPMENT_TYPES)[number]>("weights");
  const [exerciseName, setExerciseName] = useState("");
  const [weightLbs, setWeightLbs] = useState("");
  const [sets, setSets] = useState("");
  const [reps, setReps] = useState("");

  const [lift, setLift] = useState<Lift>("bench");
  const [topWeight, setTopWeight] = useState("");
  const [autoregMessage, setAutoregMessage] = useState<string | null>(null);

  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function withSaving(key: string, fn: () => Promise<void>) {
    setError(null);
    setSaving(key);
    try {
      await fn();
      onLogged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to log");
    } finally {
      setSaving(null);
    }
  }

  function logRun() {
    if (!distanceKm) return;
    return withSaving("run", async () => {
      await api.logRun({ distanceKm: Number(distanceKm), pace: pace || undefined });
      setDistanceKm("");
      setPace("");
    });
  }

  function logWorkout() {
    if (!exerciseName.trim()) return;
    return withSaving("workout", async () => {
      await api.logWorkout({
        equipmentType,
        exerciseName: exerciseName.trim(),
        weightLbs: weightLbs ? Number(weightLbs) : undefined,
        sets: sets ? Number(sets) : undefined,
        reps: reps ? Number(reps) : undefined,
      });
      setExerciseName("");
      setWeightLbs("");
      setSets("");
      setReps("");
    });
  }

  function logPr() {
    if (!topWeight) return;
    return withSaving("pr", async () => {
      const res = (await api.logStrength({ lift, topWeightLbs: Number(topWeight) })) as {
        autoregulation: { triggered: boolean; message?: string };
      };
      setTopWeight("");
      setAutoregMessage(res.autoregulation.triggered ? res.autoregulation.message ?? null : null);
    });
  }

  function deleteWorkout(id: string) {
    return withSaving(`del-workout-${id}`, () => api.deleteWorkout(id).then(() => {}));
  }

  function deleteRun(id: string) {
    return withSaving(`del-run-${id}`, () => api.deleteRun(id).then(() => {}));
  }

  const busy = saving !== null;

  return (
    <div className="space-y-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Log Activity</div>
      {error && <p className="text-xs text-warning">{error}</p>}

      {/* Run */}
      <div className={sectionClass}>
        <div className="text-[11px] uppercase tracking-wide text-zinc-500">Run</div>
        <div className="grid grid-cols-2 gap-2">
          <input
            value={distanceKm}
            onChange={(e) => setDistanceKm(e.target.value)}
            type="number"
            step="0.1"
            placeholder="Distance (km)"
            className={inputClass}
          />
          <input
            value={pace}
            onChange={(e) => setPace(e.target.value)}
            placeholder="Pace (optional)"
            className={inputClass}
          />
        </div>
        <button onClick={logRun} disabled={busy || !distanceKm} className={submitClass}>
          Log Run
        </button>
        {todaysRuns.length > 0 && (
          <ul className="space-y-1 text-xs text-zinc-300">
            {todaysRuns.map((r) => (
              <li key={r.id} className="flex items-center justify-between border-t border-zinc-800 pt-1.5">
                <span>
                  {r.distanceKm}km{r.pace ? ` · ${r.pace}` : ""}
                </span>
                <button
                  onClick={() => deleteRun(r.id)}
                  disabled={busy}
                  className="text-zinc-500 hover:text-warning disabled:opacity-50"
                  aria-label="Delete run"
                >
                  <X size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* General workout: weights / resistance / kettlebell */}
      <div className={sectionClass}>
        <div className="text-[11px] uppercase tracking-wide text-zinc-500">Workout</div>
        <div className="grid grid-cols-2 gap-2">
          <select
            value={equipmentType}
            onChange={(e) => setEquipmentType(e.target.value as (typeof EQUIPMENT_TYPES)[number])}
            className={selectClass}
          >
            {EQUIPMENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <input
            value={exerciseName}
            onChange={(e) => setExerciseName(e.target.value)}
            placeholder="Exercise (e.g. KB Swings)"
            className={inputClass}
          />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <input
            value={weightLbs}
            onChange={(e) => setWeightLbs(e.target.value)}
            type="number"
            step="0.5"
            placeholder="lbs"
            className={inputClass}
          />
          <input
            value={sets}
            onChange={(e) => setSets(e.target.value)}
            type="number"
            placeholder="Sets"
            className={inputClass}
          />
          <input
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            type="number"
            placeholder="Reps"
            className={inputClass}
          />
        </div>
        <button onClick={logWorkout} disabled={busy || !exerciseName.trim()} className={submitClass}>
          Log Workout
        </button>
        {todaysWorkouts.length > 0 && (
          <ul className="space-y-1 text-xs text-zinc-300">
            {todaysWorkouts.map((w) => (
              <li key={w.id} className="flex items-center justify-between border-t border-zinc-800 pt-1.5">
                <span className="truncate pr-2">
                  {w.exerciseName} <span className="text-zinc-500">({w.equipmentType})</span>
                  {w.weightLbs ? ` · ${w.weightLbs}lbs` : ""}
                  {w.sets && w.reps ? ` · ${w.sets}x${w.reps}` : ""}
                </span>
                <button
                  onClick={() => deleteWorkout(w.id)}
                  disabled={busy}
                  className="shrink-0 text-zinc-500 hover:text-warning disabled:opacity-50"
                  aria-label="Delete workout"
                >
                  <X size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Compound lift PR check-in — feeds the 10% Autoregulatory Strength Rule */}
      <div className={sectionClass}>
        <div className="text-[11px] uppercase tracking-wide text-zinc-500">
          PR Check-in (Bench / Row / Deadlift / Squat / OHP)
        </div>
        <div className="grid grid-cols-2 gap-2">
          <select value={lift} onChange={(e) => setLift(e.target.value as Lift)} className={selectClass}>
            {LIFTS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
          <input
            value={topWeight}
            onChange={(e) => setTopWeight(e.target.value)}
            type="number"
            step="2.5"
            placeholder="Top weight (lbs)"
            className={inputClass}
          />
        </div>
        <button onClick={logPr} disabled={busy || !topWeight} className={submitClass}>
          Log PR
        </button>
        {autoregMessage && <p className="text-xs text-warning">{autoregMessage}</p>}
      </div>
    </div>
  );
}
