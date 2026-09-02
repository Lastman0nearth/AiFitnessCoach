// Google AI Studio's Gemini API has a genuine free tier (no credit card,
// ever) for Flash-class models — that's why this app uses Gemini instead of
// a metered API. A cheap/fast model handles typed or spoken text, the
// stronger Flash model only when a photo is involved.
const TEXT_MODEL = "gemini-2.5-flash-lite";
const VISION_MODEL = "gemini-2.5-flash";
const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

interface GeminiPart {
  text?: string;
  inline_data?: { mime_type: string; data: string };
}

interface StructuredCallOptions {
  apiKey: string;
  model: string;
  system: string;
  parts: GeminiPart[];
  responseSchema: Record<string, unknown>;
}

async function callGeminiStructured<T>(opts: StructuredCallOptions): Promise<T> {
  const res = await fetch(`${API_BASE}/${opts.model}:generateContent?key=${opts.apiKey}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: opts.system }] },
      contents: [{ role: "user", parts: opts.parts }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: opts.responseSchema,
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${body}`);
  }

  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Gemini response did not include the expected content");
  }
  return JSON.parse(text) as T;
}

export interface ParsedMacros {
  name: string;
  calories: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
  confidence: "high" | "low";
  assumptions: string;
}

const MACRO_SCHEMA = {
  type: "object",
  properties: {
    name: { type: "string", description: "Short name for the food/meal" },
    calories: { type: "number" },
    protein_g: { type: "number" },
    fat_g: { type: "number" },
    carbs_g: { type: "number" },
    confidence: {
      type: "string",
      enum: ["high", "low"],
      description: "'low' if you had to estimate rather than use exact figures given",
    },
    assumptions: {
      type: "string",
      description: "Any assumptions made (portion size, brand, etc). Empty string if none.",
    },
  },
  required: ["name", "calories", "protein_g", "fat_g", "carbs_g", "confidence", "assumptions"],
};

const COACH_SYSTEM_PROMPT = `You are the macro-calculation engine for an elite athletic nutrition coach app.
Be exact, not generous. If the user gives precise weights/volumes and a known product, calculate precisely.
If a portion is vague ("a handful", "some rice"), set confidence to "low" and note the assumption you made in "assumptions" — never silently invent a large or unusual portion.`;

export async function textParseMeal(env: Env, description: string): Promise<ParsedMacros> {
  return callGeminiStructured<ParsedMacros>({
    apiKey: env.GEMINI_API_KEY,
    model: TEXT_MODEL,
    system: COACH_SYSTEM_PROMPT,
    parts: [{ text: description }],
    responseSchema: MACRO_SCHEMA,
  });
}

export async function photoParseLabel(
  env: Env,
  imageBase64: string,
  mediaType: string,
): Promise<ParsedMacros> {
  return callGeminiStructured<ParsedMacros>({
    apiKey: env.GEMINI_API_KEY,
    model: VISION_MODEL,
    system: `${COACH_SYSTEM_PROMPT}\nYou are reading a photo of a nutrition facts label or a plated meal. Read exact printed figures when a label is visible (use the "per serving" row, not per container, unless told otherwise). If it's a plate photo with no label, set confidence "low" and describe your visual estimate in "assumptions".`,
    parts: [
      { inline_data: { mime_type: mediaType, data: imageBase64 } },
      { text: "Extract the macro breakdown from this photo." },
    ],
    responseSchema: MACRO_SCHEMA,
  });
}

export interface MealSuggestion {
  recipe_name: string;
  ingredients: string[];
  instructions: string;
  calories: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
}

const SUGGESTION_SCHEMA = {
  type: "object",
  properties: {
    recipe_name: { type: "string" },
    ingredients: {
      type: "array",
      items: { type: "string" },
      description: "Exact quantities, e.g. '6 oz dry-cooked seitan', '1 cup cooked jasmine rice'",
    },
    instructions: { type: "string" },
    calories: { type: "number" },
    protein_g: { type: "number" },
    fat_g: { type: "number" },
    carbs_g: { type: "number" },
  },
  required: [
    "recipe_name",
    "ingredients",
    "instructions",
    "calories",
    "protein_g",
    "fat_g",
    "carbs_g",
  ],
};

export async function suggestMeal(
  env: Env,
  params: {
    caloriesRemaining: number;
    proteinRemainingG: number;
    fatBudgetLeftG: number;
    carbsRemainingG: number;
    approvedFoods: string[];
  },
): Promise<MealSuggestion> {
  const prompt = `Remaining budget for the rest of today: ${params.caloriesRemaining} kcal, ${params.proteinRemainingG}g protein (must hit this), max ${params.fatBudgetLeftG}g fat, ~${params.carbsRemainingG}g carbs available.
Construct ONE exact recipe, using only these approved soy-free plant alternatives, that fits this budget as closely as possible while prioritizing hitting the protein number:
${params.approvedFoods.join(", ")}
Give exact quantities (oz/cups/scoops), not vague amounts.`;

  return callGeminiStructured<MealSuggestion>({
    apiKey: env.GEMINI_API_KEY,
    model: TEXT_MODEL,
    system:
      "You are a precise sports nutrition meal-prep solver. Only use the foods given. Never guess portions — calculate exact quantities that hit the target macros.",
    parts: [{ text: prompt }],
    responseSchema: SUGGESTION_SCHEMA,
  });
}
