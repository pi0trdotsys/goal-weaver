/**
 * Jedyne źródło prawdy dla modelu danych aplikacji.
 * Dokumentacja: docs/model-danych.md, docs/kontrakty.md
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

export interface DayEntry {
  id: string;
  /** ISO date (YYYY-MM-DD). */
  date: string;
  goalId: string;
  answer: DayAnswer;
  /** Jedna linijka o dniu. */
  note: string;
}

export interface Settings {
  /** HH:mm, przypomnienie poranne. */
  morningTime: string;
  /** HH:mm, pytanie wieczorne. */
  eveningTime: string;
  notificationsEnabled: boolean;
  primaryGoalId: string;
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
