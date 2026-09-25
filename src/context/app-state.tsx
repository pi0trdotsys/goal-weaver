import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { mockData } from "@/data/mock";
import { addDaysISO, newId, todayISO } from "@/lib/goals";
import { syncNative } from "@/lib/native";
import { emptyData, loadData, normalize, saveData } from "@/lib/storage";
import type {
  AiReflection,
  AiSettings,
  AppData,
  DayAnswer,
  Goal,
  Milestone,
  Settings,
} from "@/types/goals";

/**
 * Stan aplikacji: dane z localStorage, zapis po każdej zmianie i synchronizacja
 * z Androidem (zaplanowane powiadomienia + widżet 4x1).
 */

export interface MilestoneDraft {
  /** null dla nowego kamienia milowego. */
  id: string | null;
  title: string;
  /** YYYY-MM-DD albo pusty string. */
  dueDate: string;
}

export interface GoalDraft {
  title: string;
  why: string;
  horizon: Goal["horizon"];
  targetDate: string;
  progress: number;
  milestones: MilestoneDraft[];
}

export interface DayEntryInput {
  date: string;
  goalId: string;
  answer: DayAnswer;
  note: string;
  obstacle: string;
}

interface AppState {
  data: AppData;
  saveDayEntry: (input: DayEntryInput) => void;
  saveReflection: (date: string, reflection: AiReflection) => void;
  createGoal: (draft: GoalDraft) => Goal;
  updateGoal: (goalId: string, draft: GoalDraft) => void;
  deleteGoal: (goalId: string) => void;
  updateGoalProgress: (goalId: string, progress: number) => void;
  toggleMilestone: (milestoneId: string) => void;
  setPrimaryGoal: (goalId: string) => void;
  updateSettings: (patch: Partial<Omit<Settings, "ai">>) => void;
  updateAiSettings: (patch: Partial<AiSettings>) => void;
  loadDemoData: () => void;
  resetData: () => void;
}

const AppStateContext = createContext<AppState | null>(null);

function buildMilestones(
  goalId: string,
  drafts: MilestoneDraft[],
  previous: Milestone[],
): Milestone[] {
  return drafts
    .filter((m) => m.title.trim().length > 0)
    .map((m) => {
      const old = m.id ? previous.find((p) => p.id === m.id) : undefined;
      return {
        id: old?.id ?? newId("ms"),
        goalId,
        title: m.title.trim(),
        done: old?.done ?? false,
        dueDate: m.dueDate || null,
      };
    });
}

/** Dane przykładowe przesunięte tak, żeby ostatni wpis był wczorajszy. */
function demoData(ai: AiSettings): AppData {
  const latest = mockData.entries.reduce((max, e) => (e.date > max ? e.date : max), "");
  const shift = Math.round(
    (Date.parse(`${addDaysISO(todayISO(), -1)}T12:00:00`) - Date.parse(`${latest}T12:00:00`)) /
      86_400_000,
  );
  return normalize({
    ...mockData,
    entries: mockData.entries.map((e) => ({ ...e, date: addDaysISO(e.date, shift) })),
    settings: { ...mockData.settings, ai },
  });
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(emptyData);
  const [ready, setReady] = useState(false);
  const syncTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Odczyt dopiero po zamontowaniu — SSR (podgląd Lovable) nie ma localStorage.
  useEffect(() => {
    setData(loadData());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    saveData(data);
    clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => void syncNative(data), 400);
  }, [data, ready]);

  const value = useMemo<AppState>(() => {
    return {
      data,
      saveDayEntry: ({ date, goalId, answer, note, obstacle }) =>
        setData((prev) => {
          const existing = prev.entries.find((e) => e.date === date);
          const entries = existing
            ? prev.entries.map((e) =>
                e.date === date ? { ...e, goalId, answer, note, obstacle } : e,
              )
            : [
                { id: newId("e"), date, goalId, answer, note, obstacle, reflection: null },
                ...prev.entries,
              ];
          return { ...prev, entries };
        }),

      saveReflection: (date, reflection) =>
        setData((prev) => ({
          ...prev,
          entries: prev.entries.map((e) => (e.date === date ? { ...e, reflection } : e)),
        })),

      createGoal: (draft) => {
        const goalId = newId("goal");
        const goal: Goal = {
          id: goalId,
          title: draft.title.trim(),
          why: draft.why.trim(),
          horizon: draft.horizon,
          startDate: todayISO(),
          targetDate: draft.targetDate,
          progress: draft.progress,
          isPrimary: false,
          milestones: buildMilestones(goalId, draft.milestones, []),
        };
        setData((prev) => normalize({ ...prev, goals: [...prev.goals, goal] }));
        return goal;
      },

      updateGoal: (goalId, draft) =>
        setData((prev) => ({
          ...prev,
          goals: prev.goals.map((goal) =>
            goal.id === goalId
              ? {
                  ...goal,
                  title: draft.title.trim(),
                  why: draft.why.trim(),
                  horizon: draft.horizon,
                  targetDate: draft.targetDate,
                  progress: draft.progress,
                  milestones: buildMilestones(goalId, draft.milestones, goal.milestones),
                }
              : goal,
          ),
        })),

      // Wpisy zostają w historii — pokazują się jako „Usunięty cel”.
      deleteGoal: (goalId) =>
        setData((prev) => normalize({ ...prev, goals: prev.goals.filter((g) => g.id !== goalId) })),

      updateGoalProgress: (goalId, progress) =>
        setData((prev) => ({
          ...prev,
          goals: prev.goals.map((g) => (g.id === goalId ? { ...g, progress } : g)),
        })),

      toggleMilestone: (milestoneId) =>
        setData((prev) => ({
          ...prev,
          goals: prev.goals.map((g) => ({
            ...g,
            milestones: g.milestones.map((m) =>
              m.id === milestoneId ? { ...m, done: !m.done } : m,
            ),
          })),
        })),

      setPrimaryGoal: (goalId) =>
        setData((prev) => ({
          ...prev,
          settings: { ...prev.settings, primaryGoalId: goalId },
          goals: prev.goals.map((g) => ({ ...g, isPrimary: g.id === goalId })),
        })),

      updateSettings: (patch) =>
        setData((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } })),

      updateAiSettings: (patch) =>
        setData((prev) => ({
          ...prev,
          settings: { ...prev.settings, ai: { ...prev.settings.ai, ...patch } },
        })),

      loadDemoData: () => setData((prev) => demoData(prev.settings.ai)),

      resetData: () => setData(emptyData()),
    };
  }, [data]);

  return (
    <AppStateContext.Provider value={value}>
      {ready ? children : <div className="min-h-screen bg-background" />}
    </AppStateContext.Provider>
  );
}

export function useAppState(): AppState {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState musi być użyte wewnątrz AppStateProvider");
  return ctx;
}
