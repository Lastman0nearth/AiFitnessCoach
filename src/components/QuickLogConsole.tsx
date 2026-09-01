import { Droplet } from "lucide-react";
import type { FoodItem } from "../types";

interface QuickLogConsoleProps {
  foods: FoodItem[];
  onQuickLogFood: (id: string) => void;
  onAddWater: (gallons: number) => void;
  busy: boolean;
}

export function QuickLogConsole({ foods, onQuickLogFood, onAddWater, busy }: QuickLogConsoleProps) {
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
    </div>
  );
}
