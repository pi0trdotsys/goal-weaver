import type { AppData, DayEntry, Goal, Horizon } from "@/types/goals";
import { HORIZON_ORDER } from "@/types/goals";

/** Zwraca dzisiejszą datę jako YYYY-MM-DD (czas lokalny). */
export function todayISO(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Liczba pełnych dni pozostałych do daty docelowej (0, gdy termin minął). */
export function daysLeft(targetDate: string, from: string = todayISO()): number {
  const ms = Date.parse(`${targetDate}T00:00:00`) - Date.parse(`${from}T00:00:00`);
  return Math.max(0, Math.round(ms / 86_400_000));
}

/** Ile procent czasu celu już upłynęło (0–100). */
export function timeElapsedPercent(goal: Goal, from: string = todayISO()): number {
  const start = Date.parse(`${goal.startDate}T00:00:00`);
  const end = Date.parse(`${goal.targetDate}T00:00:00`);
  const now = Date.parse(`${from}T00:00:00`);
  if (end <= start) return 100;
  return clampPercent(((now - start) / (end - start)) * 100);
}

export function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

/** Cel główny — ten pokazywany na ekranie "Dziś". */
export function primaryGoal(data: AppData): Goal | undefined {
  return data.goals.find((g) => g.id === data.settings.primaryGoalId) ?? data.goals[0];
}

export function goalById(data: AppData, id: string): Goal | undefined {
  return data.goals.find((g) => g.id === id);
}

/** Cele pogrupowane po horyzoncie, w stałej kolejności 3m → 6m → 1r → 2l. */
export function goalsByHorizon(goals: Goal[]): Array<{ horizon: Horizon; goals: Goal[] }> {
  return HORIZON_ORDER.map((horizon) => ({
    horizon,
    goals: goals.filter((g) => g.horizon === horizon),
  })).filter((group) => group.goals.length > 0);
}

export function entryForDate(entries: DayEntry[], date: string): DayEntry | undefined {
  return entries.find((e) => e.date === date);
}

/** Wpisy posortowane od najnowszego. */
export function sortedEntries(entries: DayEntry[]): DayEntry[] {
  return [...entries].sort((a, b) => (a.date < b.date ? 1 : -1));
}

/**
 * Seria: liczba kolejnych dni (licząc wstecz od dziś lub wczoraj),
 * w których odpowiedź była "tak" albo "częściowo".
 */
export function currentStreak(entries: DayEntry[], from: string = todayISO()): number {
  const byDate = new Map(entries.map((e) => [e.date, e]));
  let streak = 0;
  const cursor = new Date(`${from}T00:00:00`);

  // Brak dzisiejszego wpisu nie zeruje serii — liczymy od wczoraj.
  if (!byDate.has(from)) cursor.setDate(cursor.getDate() - 1);

  for (;;) {
    const entry = byDate.get(todayISO(cursor));
    if (!entry || entry.answer === "no") break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export const WEEKDAY_LABELS = ["Pn", "Wt", "Śr", "Czw", "Pt", "So", "Nd"];

/** Ostatnie 7 dni (poniedziałek → niedziela bieżącego tygodnia) z odpowiedziami. */
export function weekStrip(
  entries: DayEntry[],
  from: string = todayISO(),
): Array<{ date: string; label: string; entry: DayEntry | undefined; isToday: boolean }> {
  const base = new Date(`${from}T00:00:00`);
  const weekday = (base.getDay() + 6) % 7; // 0 = poniedziałek
  const monday = new Date(base);
  monday.setDate(base.getDate() - weekday);

  return WEEKDAY_LABELS.map((label, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const date = todayISO(d);
    return { date, label, entry: entryForDate(entries, date), isToday: date === from };
  });
}

const MONTHS_PL = [
  "stycznia",
  "lutego",
  "marca",
  "kwietnia",
  "maja",
  "czerwca",
  "lipca",
  "sierpnia",
  "września",
  "października",
  "listopada",
  "grudnia",
];

/** "14 marca 2026" */
export function formatDatePL(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return `${d.getDate()} ${MONTHS_PL[d.getMonth()]} ${d.getFullYear()}`;
}

/** "47 dni" / "1 dzień" / "3 dni" */
export function daysLabelPL(n: number): string {
  if (n === 1) return "1 dzień";
  return `${n} dni`;
}

export function newId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}
