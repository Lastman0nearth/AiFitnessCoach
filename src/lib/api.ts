async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: { "content-type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({ error: res.statusText }))) as { error?: string };
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  today: (date?: string) => request(`/today${date ? `?date=${date}` : ""}`),
  blueprint: () => request("/blueprint"),
  foodLibrary: () => request("/food-library"),
  weeklyVolume: () => request("/runs/weekly-volume"),
  weightHistory: () => request("/weight/history"),
  strengthLatest: () => request("/strength/latest"),

  logMeal: (body: unknown) => request("/meals", { method: "POST", body: JSON.stringify(body) }),
  deleteMeal: (id: string) => request(`/meals/${id}`, { method: "DELETE" }),
  parseText: (text: string) =>
    request("/meals/parse-text", { method: "POST", body: JSON.stringify({ text }) }),
  parsePhoto: (imageBase64: string, mediaType: string) =>
    request("/meals/parse-photo", {
      method: "POST",
      body: JSON.stringify({ imageBase64, mediaType }),
    }),
  suggestMeal: (date?: string) =>
    request("/meals/suggest", { method: "POST", body: JSON.stringify({ date }) }),

  quickLogFood: (id: string, date?: string) =>
    request(`/food-library/${id}/quick-log`, { method: "POST", body: JSON.stringify({ date }) }),

  logHydration: (body: { addGallons?: number; electrolytesReplenished?: boolean; date?: string }) =>
    request("/hydration", { method: "POST", body: JSON.stringify(body) }),
  deleteHydration: (id: string) => request(`/hydration/${id}`, { method: "DELETE" }),
  todaysHydration: (date?: string) => request(`/hydration${date ? `?date=${date}` : ""}`),

  logStrength: (body: { lift: string; topWeightLbs: number; date?: string }) =>
    request("/strength", { method: "POST", body: JSON.stringify(body) }),
  deleteStrength: (id: string) => request(`/strength/${id}`, { method: "DELETE" }),

  logRun: (body: { distanceKm: number; pace?: string; date?: string }) =>
    request("/runs", { method: "POST", body: JSON.stringify(body) }),
  deleteRun: (id: string) => request(`/runs/${id}`, { method: "DELETE" }),
  todaysRuns: (date?: string) => request(`/runs${date ? `?date=${date}` : ""}`),

  logWeight: (weightLbs: number, date?: string) =>
    request("/weight", { method: "POST", body: JSON.stringify({ weightLbs, date }) }),

  logWorkout: (body: {
    equipmentType: "weights" | "resistance" | "kettlebell";
    exerciseName: string;
    weightLbs?: number;
    sets?: number;
    reps?: number;
    date?: string;
  }) => request("/workouts", { method: "POST", body: JSON.stringify(body) }),
  deleteWorkout: (id: string) => request(`/workouts/${id}`, { method: "DELETE" }),
  todaysWorkouts: (date?: string) => request(`/workouts${date ? `?date=${date}` : ""}`),

  historyDates: () => request("/history/dates"),
  historySummary: (date: string) => request(`/history/summary?date=${date}`),
};
