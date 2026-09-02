import { Droplet, X } from "lucide-react";
import type { FoodItem, HydrationEntry } from "../types";

interface QuickLogConsoleProps {
  foods: FoodItem[];
  hydrationEntries: HydrationEntry[];
  onQuickLogFood: (id: string) => void;
  onAddWater: (gallons: number) => void;
  onDeleteHydration: (id: string) => void;
  busy: boolean;
}

export function QuickLogConsole({
  foods,
  hydrationEntries,
  onQuickLogFood,
  onAddWater,
  onDeleteHydration,
  busy,
}: QuickLogConsoleProps) {
  return (
    <div>
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
        Quick Log Console
      </div>
      <div className="flex flex-wrap gap-2">
        {foods
          .filter((f) => f.quickLog)
          .map((food) => (
            <button
              key={food.id}
              disabled={busy}
              onClick={() => onQuickLogFood(food.id)}
              className="rounded-lg bg-charcoal-light px-3 py-2 text-xs font-medium text-zinc-200 transition hover:bg-zinc-700 disabled:opacity-50"
            >
              +{food.unitLabel} {food.name} ({food.proteinG}g P)
            </button>
          ))}
        <button
          disabled={busy}
          onClick={() => onAddWater(0.25)}
          className="flex items-center gap-1 rounded-lg bg-charcoal-light px-3 py-2 text-xs font-medium text-hydration transition hover:bg-zinc-700 disabled:opacity-50"
        >
          <Droplet size={14} /> +0.25 Gal Water
        </button>
      </div>
      {hydrationEntries.length > 0 && (
        <ul className="mt-2 space-y-1 text-xs text-zinc-300">
          {hydrationEntries.map((h) => (
            <li key={h.id} className="flex items-center justify-between border-t border-zinc-800 pt-1.5">
              <span>{h.gallons.toFixed(2)} gal</span>
              <button
                onClick={() => onDeleteHydration(h.id)}
                disabled={busy}
                className="text-zinc-500 hover:text-warning disabled:opacity-50"
                aria-label="Delete hydration entry"
              >
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
