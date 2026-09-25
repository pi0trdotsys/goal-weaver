/**
 * Jedyne źródło prawdy dla modelu danych aplikacji.
 * Dokumentacja: docs/README.md, docs/ai-gateway.md
 */

/** Horyzont czasowy celu. */
export type Horizon = "3m" | "6m" | "1y" | "2y";

/** Odpowiedź na wieczorne pytanie "czy dzień przybliżył Cię do celu?". */
export type DayAnswer = "yes" | "partly" | "no";

export interface Milestone {
  id: string;
  goalId: string;
  title: string;
  done: boolean;
  /** ISO date (YYYY-MM-DD) lub null, jeśli bez terminu. */
  dueDate: string | null;
}

export interface Goal {
  id: string;
  title: string;
  /** "Po co" — motywacja przypominana rano. */
  why: string;
  horizon: Horizon;
  /** ISO date (YYYY-MM-DD). */
  startDate: string;
  /** ISO date (YYYY-MM-DD). */
  targetDate: string;
  /** 0–100, deklarowany postęp. */
  progress: number;
  /** Cel pokazywany na ekranie "Dziś". Dokładnie jeden w zbiorze. */
  isPrimary: boolean;
  milestones: Milestone[];
}

/** Wynik wieczornej refleksji wygenerowany przez model w AI Gateway. */
export interface AiReflection {
  /** 2–3 zdania podsumowania dnia w odniesieniu do celu. */
  summary: string;
  /** Jeden konkretny krok na jutro — trafia do porannego powiadomienia. */
  nextStep: string;
  /** Krótka linijka motywacji — trafia na widżet ekranu głównego. */
  motivation: string;
  /** Nazwa modelu, który wygenerował odpowiedź. */
  model: string;
  /** ISO datetime. */
  generatedAt: string;
}

export interface DayEntry {
  id: string;
  /** ISO date (YYYY-MM-DD). */
  date: string;
  goalId: string;
  answer: DayAnswer;
  /** Co dziś zrobiłem dla celu. */
  note: string;
  /** Co przeszkodziło (pusty string, gdy nic). */
  obstacle: string;
  /** Podsumowanie AI, null dopóki nie wygenerowano. */
  reflection: AiReflection | null;
}

/** Połączenie z modelem przez AI Gateway (API zgodne z OpenAI). */
export interface AiSettings {
  enabled: boolean;
  /** np. http://thinkcentre.tail1234.ts.net:4000/v1 */
  baseUrl: string;
  model: string;
  /** Opcjonalny klucz (nagłówek Authorization: Bearer). */
  apiKey: string;
}

export interface Settings {
  /** HH:mm, przypomnienie poranne. */
  morningTime: string;
  /** HH:mm, pytanie wieczorne. */
  eveningTime: string;
  notificationsEnabled: boolean;
  /** Pusty string, gdy nie ma jeszcze żadnego celu. */
  primaryGoalId: string;
  ai: AiSettings;
}

export interface AppData {
  goals: Goal[];
  entries: DayEntry[];
  settings: Settings;
}

export const HORIZON_LABEL: Record<Horizon, string> = {
  "3m": "3 miesiące",
  "6m": "6 miesięcy",
  "1y": "rok",
  "2y": "dwa lata",
};

export const HORIZON_SHORT: Record<Horizon, string> = {
  "3m": "3m",
  "6m": "6m",
  "1y": "1r",
  "2y": "2l",
};

export const HORIZON_ORDER: Horizon[] = ["3m", "6m", "1y", "2y"];

export const ANSWER_LABEL: Record<DayAnswer, string> = {
  yes: "Tak",
  partly: "Częściowo",
  no: "Nie",
};
