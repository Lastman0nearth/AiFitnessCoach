import { useRef, useState } from "react";
import { Camera, Loader2, Sparkles } from "lucide-react";
import { api } from "../lib/api";

interface ParsedMacros {
  name: string;
  calories: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
  confidence: "high" | "low";
  assumptions: string;
}

interface MealSuggestion {
  recipe_name: string;
  ingredients: string[];
  instructions: string;
  calories: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function MealLogger({ onLogged }: { onLogged: () => void }) {
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState<ParsedMacros | null>(null);
  const [suggestion, setSuggestion] = useState<MealSuggestion | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleParseText() {
    if (!text.trim()) return;
    setError(null);
    setLoading("text");
    try {
      const res = (await api.parseText(text)) as { parsed: ParsedMacros };
      setParsed(res.parsed);
      setSuggestion(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse");
    } finally {
      setLoading(null);
    }
  }

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setLoading("photo");
    try {
      const base64 = await fileToBase64(file);
      const res = (await api.parsePhoto(base64, file.type)) as { parsed: ParsedMacros };
      setParsed(res.parsed);
      setSuggestion(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse photo");
    } finally {
      setLoading(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSuggest() {
    setError(null);
    setLoading("suggest");
    try {
      const res = (await api.suggestMeal()) as { suggestion: MealSuggestion };
      setSuggestion(res.suggestion);
      setParsed(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get suggestion");
    } finally {
      setLoading(null);
    }
  }

  async function confirmParsed(source: "text_parsed" | "photo_parsed") {
    if (!parsed) return;
    setLoading("confirm");
    try {
      await api.logMeal({
        description: parsed.name,
        source,
        calories: parsed.calories,
        proteinG: parsed.protein_g,
        fatG: parsed.fat_g,
        carbsG: parsed.carbs_g,
        rawInput: text || undefined,
      });
      setParsed(null);
      setText("");
      onLogged();
    } finally {
      setLoading(null);
    }
  }

  async function confirmSuggestion() {
    if (!suggestion) return;
    setLoading("confirm");
    try {
      await api.logMeal({
        description: suggestion.recipe_name,
        source: "text_parsed",
        calories: suggestion.calories,
        proteinG: suggestion.protein_g,
        fatG: suggestion.fat_g,
        carbsG: suggestion.carbs_g,
      });
      setSuggestion(null);
      onLogged();
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Log a Meal</div>
      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g. 6oz dry-cooked seitan, 1 cup jasmine rice"
          className="flex-1 rounded-lg bg-charcoal-light px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-protein"
        />
        <button
          onClick={handleParseText}
          disabled={loading !== null}
          className="rounded-lg bg-charcoal-light px-3 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-700 disabled:opacity-50"
        >
          {loading === "text" ? <Loader2 size={14} className="animate-spin" /> : "Parse"}
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={loading !== null}
          className="rounded-lg bg-charcoal-light px-3 py-2 text-zinc-200 hover:bg-zinc-700 disabled:opacity-50"
          aria-label="Upload a photo of a nutrition label or plate"
        >
          {loading === "photo" ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handlePhoto}
        />
      </div>

      <button
        onClick={handleSuggest}
        disabled={loading !== null}
        className="flex items-center gap-1 text-xs font-medium text-calorie hover:underline disabled:opacity-50"
      >
        <Sparkles size={12} /> Meal Prep Solver: fit my remaining budget
      </button>

      {error && <p className="text-xs text-warning">{error}</p>}

      {parsed && (
        <div className="rounded-lg border border-zinc-700 bg-charcoal-light p-3 text-xs">
          <div className="font-semibold text-zinc-100">{parsed.name}</div>
          <div className="mt-1 text-zinc-400">
            {parsed.calories} kcal · {parsed.protein_g}g P · {parsed.fat_g}g F · {parsed.carbs_g}g C
          </div>
          {parsed.confidence === "low" && (
            <div className="mt-1 text-alert">Low confidence: {parsed.assumptions}</div>
          )}
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => confirmParsed("text_parsed")}
              disabled={loading !== null}
              className="rounded-md bg-protein/20 px-2 py-1 font-medium text-protein"
            >
              Log this
            </button>
            <button onClick={() => setParsed(null)} className="rounded-md px-2 py-1 text-zinc-500">
              Discard
            </button>
          </div>
        </div>
      )}

      {suggestion && (
        <div className="rounded-lg border border-zinc-700 bg-charcoal-light p-3 text-xs">
          <div className="font-semibold text-zinc-100">{suggestion.recipe_name}</div>
          <ul className="mt-1 list-inside list-disc text-zinc-400">
            {suggestion.ingredients.map((ing, i) => (
              <li key={i}>{ing}</li>
            ))}
          </ul>
          <p className="mt-1 text-zinc-500">{suggestion.instructions}</p>
          <div className="mt-1 text-zinc-400">
            {suggestion.calories} kcal · {suggestion.protein_g}g P · {suggestion.fat_g}g F ·{" "}
            {suggestion.carbs_g}g C
          </div>
          <div className="mt-2 flex gap-2">
            <button
              onClick={confirmSuggestion}
              disabled={loading !== null}
              className="rounded-md bg-calorie/20 px-2 py-1 font-medium text-calorie"
            >
              Log this
            </button>
            <button onClick={() => setSuggestion(null)} className="rounded-md px-2 py-1 text-zinc-500">
              Discard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
