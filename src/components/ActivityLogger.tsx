import { useState } from "react";
import { api } from "../lib/api";
import type { Lift, WorkoutEntry } from "../types";

const LIFTS: Lift[] = ["bench", "row", "deadlift", "squat", "ohp"];
const EQUIPMENT_TYPES = ["weights", "resistance", "kettlebell"] as const;

const inputClass =
  "flex-1 rounded-lg bg-charcoal-light px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-protein";
const buttonClass =
  "rounded-lg bg-charcoal-light px-3 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-700 disabled:opacity-50";

interface ActivityLoggerProps {
  todaysWorkouts: WorkoutEntry[];
  onLogged: () => void;
}

export function ActivityLogger({ todaysWorkouts, onLogged }: ActivityLoggerProps) {
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

  const busy = saving !== null;

  return (
    <div className="space-y-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Log Activity</div>
      {error && <p className="text-xs text-warning">{error}</p>}

      {/* Run */}
      <div className="space-y-2">
        <div className="text-[11px] uppercase tracking-wide text-zinc-500">Run</div>
        <div className="flex gap-2">
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
          <button onClick={logRun} disabled={busy || !distanceKm} className={buttonClass}>
            Log
          </button>
        </div>
      </div>

      {/* General workout: weights / resistance / kettlebell */}
      <div className="space-y-2">
        <div className="text-[11px] uppercase tracking-wide text-zinc-500">Workout</div>
        <div className="flex gap-2">
          <select
            value={equipmentType}
            onChange={(e) => setEquipmentType(e.target.value as (typeof EQUIPMENT_TYPES)[number])}
            className="rounded-lg bg-charcoal-light px-2 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-protein"
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
        <div className="flex gap-2">
          <input
            value={weightLbs}
            onChange={(e) => setWeightLbs(e.target.value)}
            type="number"
            step="0.5"
            placeholder="Weight (lbs)"
            className={inputClass}
          />
          <input
            value={sets}
            onChange={(e) => setSets(e.target.value)}
            type="number"
            placeholder="Sets"
            className={`${inputClass} flex-none w-16`}
          />
          <input
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            type="number"
            placeholder="Reps"
            className={`${inputClass} flex-none w-16`}
          />
          <button onClick={logWorkout} disabled={busy || !exerciseName.trim()} className={buttonClass}>
            Log
          </button>
        </div>
      </div>

      {/* Compound lift PR check-in — feeds the 10% Autoregulatory Strength Rule */}
      <div className="space-y-2">
        <div className="text-[11px] uppercase tracking-wide text-zinc-500">
          PR Check-in (Bench / Row / Deadlift / Squat / OHP)
        </div>
        <div className="flex gap-2">
          <select
            value={lift}
            onChange={(e) => setLift(e.target.value as Lift)}
            className="rounded-lg bg-charcoal-light px-2 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-protein"
          >
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
            placeholder="Top working weight (lbs)"
            className={inputClass}
          />
          <button onClick={logPr} disabled={busy || !topWeight} className={buttonClass}>
            Log
          </button>
        </div>
        {autoregMessage && <p className="text-xs text-warning">{autoregMessage}</p>}
      </div>

      {todaysWorkouts.length > 0 && (
        <ul className="space-y-1 text-xs text-zinc-300">
          {todaysWorkouts.map((w) => (
            <li key={w.id} className="flex justify-between border-t border-zinc-800 py-1.5 first:border-t-0">
              <span>
                {w.exerciseName} <span className="text-zinc-500">({w.equipmentType})</span>
              </span>
              <span className="text-zinc-500">
                {w.weightLbs ? `${w.weightLbs} lbs` : ""}
                {w.sets && w.reps ? ` · ${w.sets}x${w.reps}` : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
