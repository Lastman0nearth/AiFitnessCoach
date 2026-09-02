import { useEffect, useState } from "react";
import { Calendar, X } from "lucide-react";
import { api } from "../lib/api";
import type { HydrationEntry, MealEntry, RunEntry, StrengthEntry, WorkoutEntry } from "../types";

interface DaySummary {
  empty: boolean;
  date: string;
  log?: {
    dayType: string;
    targetCalories: number;
    currentWeightLbs: number | null;
    caloriesConsumed: number;
    proteinGConsumed: number;
    fluidGallons: number;
    distanceKmActual: number;
    paceActual: string | null;
    electrolytesReplenished: boolean;
  };
  meals?: MealEntry[];
  workouts?: WorkoutEntry[];
  runs?: RunEntry[];
  strength?: StrengthEntry[];
  hydration?: HydrationEntry[];
}

interface HistorySidebarProps {
  open: boolean;
  onClose: () => void;
}

function formatDateLabel(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function HistorySidebar({ open, onClose }: HistorySidebarProps) {
  const [dates, setDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [summary, setSummary] = useState<DaySummary | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSelectedDate(null);
    setSummary(null);
    (api.historyDates() as Promise<{ dates: string[] }>).then((res) => setDates(res.dates));
  }, [open]);

  useEffect(() => {
    if (!selectedDate) return;
    setLoading(true);
    (api.historySummary(selectedDate) as Promise<DaySummary>)
      .then(setSummary)
      .finally(() => setLoading(false));
  }, [selectedDate]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-sm flex-col bg-charcoal p-4 shadow-xl sm:max-w-md">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
            <Calendar size={16} /> History
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-100" aria-label="Close history">
            <X size={18} />
          </button>
        </div>

        {!selectedDate ? (
          <div className="flex-1 overflow-y-auto">
            {dates.length === 0 && <p className="text-xs text-zinc-500">No history yet.</p>}
            <ul className="space-y-1">
              {dates.map((d) => (
                <li key={d}>
                  <button
                    onClick={() => setSelectedDate(d)}
                    className="w-full rounded-lg bg-charcoal-light px-3 py-2 text-left text-sm text-zinc-200 hover:bg-zinc-700"
                  >
                    {formatDateLabel(d)}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <button
              onClick={() => {
                setSelectedDate(null);
                setSummary(null);
              }}
              className="mb-3 text-xs text-zinc-400 hover:text-zinc-100"
            >
              ← Back to dates
            </button>
            <div className="mb-2 text-sm font-semibold text-zinc-100">{formatDateLabel(selectedDate)}</div>
            {loading && <p className="text-xs text-zinc-500">Loading…</p>}
            {!loading && summary?.empty && <p className="text-xs text-zinc-500">No data logged this day.</p>}
            {!loading && summary && !summary.empty && summary.log && (
              <div className="space-y-4 text-xs text-zinc-300">
                <div className="rounded-lg bg-charcoal-light p-3">
                  <div className="mb-1 text-[10px] uppercase tracking-wide text-zinc-500">
                    {summary.log.dayType} day
                  </div>
                  <div>
                    {Math.round(summary.log.caloriesConsumed)} / {summary.log.targetCalories} kcal
                  </div>
                  <div>{Math.round(summary.log.proteinGConsumed)}g protein</div>
                  <div>
                    {summary.log.fluidGallons.toFixed(2)} gal water
                    {summary.log.electrolytesReplenished ? " · electrolytes ✓" : ""}
                  </div>
                  {summary.log.distanceKmActual > 0 && (
                    <div>
                      {summary.log.distanceKmActual}km run
                      {summary.log.paceActual ? ` · ${summary.log.paceActual}` : ""}
                    </div>
                  )}
                  {summary.log.currentWeightLbs && <div>Weight: {summary.log.currentWeightLbs} lbs</div>}
                </div>

                {!!summary.meals?.length && (
                  <div>
                    <div className="mb-1 text-[10px] uppercase tracking-wide text-zinc-500">Meals</div>
                    <ul className="space-y-1">
                      {summary.meals.map((m) => (
                        <li key={m.id} className="flex justify-between border-t border-zinc-800 pt-1">
                          <span className="truncate pr-2">{m.description}</span>
                          <span className="shrink-0 text-zinc-500">{Math.round(m.calories)} kcal</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {!!summary.workouts?.length && (
                  <div>
                    <div className="mb-1 text-[10px] uppercase tracking-wide text-zinc-500">Workouts</div>
                    <ul className="space-y-1">
                      {summary.workouts.map((w) => (
                        <li key={w.id} className="border-t border-zinc-800 pt-1">
                          {w.exerciseName} ({w.equipmentType})
                          {w.weightLbs ? ` · ${w.weightLbs}lbs` : ""}
                          {w.sets && w.reps ? ` · ${w.sets}x${w.reps}` : ""}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {!!summary.strength?.length && (
                  <div>
                    <div className="mb-1 text-[10px] uppercase tracking-wide text-zinc-500">PRs Logged</div>
                    <ul className="space-y-1">
                      {summary.strength.map((s) => (
                        <li key={s.id} className="border-t border-zinc-800 pt-1">
                          {s.lift}: {s.topWeightLbs} lbs
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
