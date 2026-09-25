import {
  addDaysISO,
  daysLabelPL,
  daysLeft,
  latestReflectionEntry,
  nextMilestone,
  todayISO,
} from "@/lib/goals";
import type { AppData, Goal } from "@/types/goals";

/**
 * Teksty motywujące dla widżetu 4x1 i powiadomień. Czyste funkcje — natywna
 * warstwa (src/lib/native.ts) tylko przekazuje wynik do Androida.
 */

/**
 * Znacznik liczby pozostałych dni w `lines` — podstawiany w dniu wyświetlenia
 * (tu i w GoalWidgetProvider.java), żeby widżet nie pokazywał starej liczby.
 */
export const DAYS_TOKEN = "{days}";

/** Stałe zdania, rotowane razem z tymi opartymi o cel. Własne, bez cytatów. */
const GENERIC_LINES = [
  "Kierunek jest ważniejszy niż tempo.",
  "Nie musisz dziś dużo. Wystarczy, że zrobisz coś.",
  "Mały krok dziś to mniej pracy jutro.",
  "Rzeczy wielkie składają się ze zwykłych dni.",
  "Zrób dziś to, za co jutro sobie podziękujesz.",
  "Konsekwencja wygrywa z motywacją.",
  "Jeden konkretny ruch jest lepszy niż dziesięć planów.",
];

/** Zdania o konkretnym celu — rotowane codziennie na widżecie. */
export function goalLines(goal: Goal, from: string = todayISO()): string[] {
  const left = daysLeft(goal.targetDate, from);
  const milestone = nextMilestone(goal);
  const lines = [
    goal.why,
    left > 0 ? `Zostało ${DAYS_TOKEN}. Każdy z nich się liczy.` : "To jest ten moment. Domknij to.",
    milestone ? `Najbliższy kamień milowy: ${milestone.title}.` : null,
    goal.progress > 0
      ? `${goal.progress}% za Tobą. Reszta to suma zwykłych dni.`
      : "Pierwszy krok jest najważniejszy. Zrób go dziś.",
    ...GENERIC_LINES,
  ];
  return lines.filter((line): line is string => Boolean(line && line.trim()));
}

export interface WidgetPayload {
  hasGoal: boolean;
  goalTitle: string;
  /** YYYY-MM-DD — widżet sam liczy pozostałe dni, więc działa bez otwierania aplikacji. */
  targetDate: string;
  progress: number;
  /** Motywacja z ostatniej refleksji AI; wyświetlana zamiast rotacji do `pinnedUntil`. */
  pinned: string;
  /** YYYY-MM-DD, ostatni dzień wyświetlania `pinned`. */
  pinnedUntil: string;
  /** Następny krok z refleksji (dla tego samego okna czasu co `pinned`). */
  nextStep: string;
  /** Zdania rotowane codziennie (dayOfYear % length). */
  lines: string[];
}

export function widgetPayload(data: AppData, from: string = todayISO()): WidgetPayload {
  const goal = data.goals.find((g) => g.id === data.settings.primaryGoalId) ?? data.goals[0];
  if (!goal) {
    return {
      hasGoal: false,
      goalTitle: "",
      targetDate: "",
      progress: 0,
      pinned: "",
      pinnedUntil: "",
      nextStep: "",
      lines: ["Zapisz swój pierwszy cel. Dokąd zmierzasz?"],
    };
  }

  // Motywacja z wieczora obowiązuje do końca następnego dnia.
  const latest = latestReflectionEntry(data.entries, goal.id, from, 1);
  const pinnedUntil = latest ? addDaysISO(latest.date, 1) : "";

  return {
    hasGoal: true,
    goalTitle: goal.title,
    targetDate: goal.targetDate,
    progress: goal.progress,
    pinned: latest?.reflection.motivation ?? "",
    pinnedUntil,
    nextStep: latest?.reflection.nextStep ?? "",
    lines: goalLines(goal, from),
  };
}

/** Linia na dany dzień — ta sama reguła co w natywnym widżecie (GoalWidgetProvider). */
export function lineForDay(payload: WidgetPayload, date: string = todayISO()): string {
  if (payload.pinned && date <= payload.pinnedUntil) return payload.pinned;
  if (payload.lines.length === 0) return "";
  const line = payload.lines[dayOfYear(date) % payload.lines.length] ?? "";
  return payload.targetDate
    ? line.replace(DAYS_TOKEN, daysLabelPL(daysLeft(payload.targetDate, date)))
    : line;
}

export function dayOfYear(iso: string): number {
  const d = new Date(`${iso}T12:00:00`);
  const start = new Date(d.getFullYear(), 0, 0, 12);
  return Math.round((d.getTime() - start.getTime()) / 86_400_000);
}

/** Treść porannego powiadomienia „Cel na dziś” dla wskazanego dnia. */
export function morningMessage(
  data: AppData,
  date: string,
): { title: string; body: string } | null {
  const goal = data.goals.find((g) => g.id === data.settings.primaryGoalId) ?? data.goals[0];
  if (!goal) return null;

  // Krok zaplanowany wczoraj wieczorem przez AI ma pierwszeństwo.
  const latest = latestReflectionEntry(data.entries, goal.id, addDaysISO(date, -1), 0);
  if (latest?.reflection.nextStep) {
    return {
      title: "Cel na dziś",
      body: `${goal.title}\nNastępny krok: ${latest.reflection.nextStep}`,
    };
  }

  const milestone = nextMilestone(goal);
  const left = daysLeft(goal.targetDate, date);
  const tail = milestone ? `Najbliżej: ${milestone.title}.` : goal.why;
  return { title: "Cel na dziś", body: `${goal.title} · ${daysLabelPL(left)}\n${tail}` };
}

/** Treść wieczornego powiadomienia „Wieczorna refleksja”. */
export function eveningMessage(data: AppData): { title: string; body: string } | null {
  const goal = data.goals.find((g) => g.id === data.settings.primaryGoalId) ?? data.goals[0];
  if (!goal) return null;
  return {
    title: "Wieczorna refleksja",
    body: `Czy dzisiejszy dzień przybliżył Cię do celu „${goal.title}”? Zapisz dwie linijki.`,
  };
}
