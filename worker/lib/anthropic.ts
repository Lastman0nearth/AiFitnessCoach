// Smart model routing: cheap/fast model for typed or spoken text, the
// stronger vision-capable model only when a photo is actually involved.
const TEXT_MODEL = "claude-haiku-4-5-20251001";
const VISION_MODEL = "claude-sonnet-5";
const ANTHROPIC_VERSION = "2023-06-01";

interface ToolCallOptions {
  apiKey: string;
  model: string;
  system: string;
  messages: Array<{ role: "user"; content: unknown }>;
  toolName: string;
  toolDescription: string;
  inputSchema: Record<string, unknown>;
  maxTokens?: number;
}

async function callClaudeTool<T>(opts: ToolCallOptions): Promise<T> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": opts.apiKey,
      "anthropic-version": ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model: opts.model,
      max_tokens: opts.maxTokens ?? 1024,
      system: opts.system,
      messages: opts.messages,
      tools: [
        {
          name: opts.toolName,
          description: opts.toolDescription,
          input_schema: opts.inputSchema,
        },
      ],
      tool_choice: { type: "tool", name: opts.toolName },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Anthropic API error (${res.status}): ${body}`);
  }

  const data = (await res.json()) as {
    content: Array<{ type: string; input?: T }>;
  };
  const toolUse = data.content.find((block) => block.type === "tool_use");
  if (!toolUse?.input) {
    throw new Error("Anthropic response did not include the expected tool_use block");
  }
  return toolUse.input;
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

export async function textParseMeal(
  env: Env,
  description: string,
): Promise<ParsedMacros> {
  return callClaudeTool<ParsedMacros>({
    apiKey: env.ANTHROPIC_API_KEY,
    model: TEXT_MODEL,
    system: COACH_SYSTEM_PROMPT,
    messages: [{ role: "user", content: description }],
    toolName: "log_meal_macros",
    toolDescription: "Record the calculated macro breakdown for a described meal",
    inputSchema: MACRO_SCHEMA,
  });
}

export async function photoParseLabel(
  env: Env,
  imageBase64: string,
  mediaType: string,
): Promise<ParsedMacros> {
  return callClaudeTool<ParsedMacros>({
    apiKey: env.ANTHROPIC_API_KEY,
    model: VISION_MODEL,
    system: `${COACH_SYSTEM_PROMPT}\nYou are reading a photo of a nutrition facts label or a plated meal. Read exact printed figures when a label is visible (use the "per serving" row, not per container, unless told otherwise). If it's a plate photo with no label, set confidence "low" and describe your visual estimate in "assumptions".`,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data: imageBase64 },
          },
          {
            type: "text",
            text: "Extract the macro breakdown from this photo.",
          },
        ],
      },
    ],
    toolName: "log_meal_macros",
    toolDescription: "Record the calculated macro breakdown read from the photo",
    inputSchema: MACRO_SCHEMA,
    maxTokens: 1024,
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

  return callClaudeTool<MealSuggestion>({
    apiKey: env.ANTHROPIC_API_KEY,
    model: TEXT_MODEL,
    system:
      "You are a precise sports nutrition meal-prep solver. Only use the foods given. Never guess portions — calculate exact quantities that hit the target macros.",
    messages: [{ role: "user", content: prompt }],
    toolName: "propose_recipe",
    toolDescription: "Propose a recipe that fits the remaining macro budget",
    inputSchema: SUGGESTION_SCHEMA,
    maxTokens: 1024,
  });
}
