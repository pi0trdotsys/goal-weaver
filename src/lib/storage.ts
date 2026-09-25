import type { AiSettings, AppData, DayEntry, Goal, Settings } from "@/types/goals";

/**
 * Trwały zapis danych na urządzeniu. W aplikacji Android localStorage WebView
 * jest trwały i objęty automatyczną kopią zapasową Androida.
 * Wszystko idzie przez normalize(), więc starsze lub niepełne zapisy nie psują aplikacji.
 */

const STORAGE_KEY = "goal-weaver:data:v1";

export const DEFAULT_AI: AiSettings = { enabled: false, baseUrl: "", model: "", apiKey: "" };

export const DEFAULT_SETTINGS: Settings = {
  morningTime: "07:00",
  eveningTime: "21:00",
  notificationsEnabled: true,
  primaryGoalId: "",
  ai: DEFAULT_AI,
};

export function emptyData(): AppData {
  return { goals: [], entries: [], settings: { ...DEFAULT_SETTINGS, ai: { ...DEFAULT_AI } } };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function normalizeEntry(raw: Record<string, unknown>): DayEntry {
  const answer = raw["answer"];
  const reflection = raw["reflection"];
  return {
    id: str(raw["id"]),
    date: str(raw["date"]),
    goalId: str(raw["goalId"]),
    answer: answer === "yes" || answer === "partly" || answer === "no" ? answer : "partly",
    note: str(raw["note"]),
    obstacle: str(raw["obstacle"]),
    reflection:
      isRecord(reflection) && typeof reflection["nextStep"] === "string"
        ? {
            summary: str(reflection["summary"]),
            nextStep: str(reflection["nextStep"]),
            motivation: str(reflection["motivation"]),
            model: str(reflection["model"]),
            generatedAt: str(reflection["generatedAt"]),
          }
        : null,
  };
}

/** Uzupełnia brakujące pola i pilnuje spójności głównego celu. */
export function normalize(raw: unknown): AppData {
  if (!isRecord(raw)) return emptyData();
  const goals = Array.isArray(raw["goals"]) ? (raw["goals"] as Goal[]) : [];
  const entries = Array.isArray(raw["entries"])
    ? (raw["entries"] as unknown[]).filter(isRecord).map(normalizeEntry)
    : [];
  const s = isRecord(raw["settings"]) ? raw["settings"] : {};
  const ai = isRecord(s["ai"]) ? s["ai"] : {};

  const primaryRequested = str(s["primaryGoalId"]);
  const primaryGoalId = goals.some((g) => g.id === primaryRequested)
    ? primaryRequested
    : (goals[0]?.id ?? "");

  return {
    goals: goals.map((g) => ({ ...g, isPrimary: g.id === primaryGoalId })),
    entries,
    settings: {
      morningTime: str(s["morningTime"], DEFAULT_SETTINGS.morningTime),
      eveningTime: str(s["eveningTime"], DEFAULT_SETTINGS.eveningTime),
      notificationsEnabled:
        typeof s["notificationsEnabled"] === "boolean"
          ? s["notificationsEnabled"]
          : DEFAULT_SETTINGS.notificationsEnabled,
      primaryGoalId,
      ai: {
        enabled: ai["enabled"] === true,
        baseUrl: str(ai["baseUrl"]),
        model: str(ai["model"]),
        apiKey: str(ai["apiKey"]),
      },
    },
  };
}

export function loadData(): AppData {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? normalize(JSON.parse(raw)) : emptyData();
  } catch (error) {
    console.error("Nie udało się odczytać danych", error);
    return emptyData();
  }
}

export function saveData(data: AppData): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Nie udało się zapisać danych", error);
  }
}
