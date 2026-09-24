import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

import { mockData } from "@/data/mock";
import { newId, todayISO } from "@/lib/goals";
import type { AppData, DayAnswer, Goal, Milestone, Settings } from "@/types/goals";

/**
 * Stan makiet trzymany w pamięci — pozwala klikać po aplikacji bez backendu.
 * Docelowo te same operacje realizuje warstwa danych opisana w docs/kontrakty.md.
 */

export interface GoalDraft {
  title: string;
  why: string;
  horizon: Goal["horizon"];
  targetDate: string;
  progress: number;
  milestoneTitles: string[];
}

interface AppState {
  data: AppData;
  saveDayEntry: (input: { goalId: string; answer: DayAnswer; note: string }) => void;
  createGoal: (draft: GoalDraft) => Goal;
  updateGoalProgress: (goalId: string, progress: number) => void;
  toggleMilestone: (milestoneId: string) => void;
  setPrimaryGoal: (goalId: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
}

const AppStateContext = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(mockData);

  const value = useMemo<AppState>(() => {
    return {
      data,
      saveDayEntry: ({ goalId, answer, note }) =>
        setData((prev) => {
          const date = todayISO();
          const existing = prev.entries.find((e) => e.date === date);
          const entries = existing
            ? prev.entries.map((e) => (e.date === date ? { ...e, goalId, answer, note } : e))
            : [{ id: newId("e"), date, goalId, answer, note }, ...prev.entries];
          return { ...prev, entries };
        }),

      createGoal: (draft) => {
        const goalId = newId("goal");
        const milestones: Milestone[] = draft.milestoneTitles
          .filter((t) => t.trim().length > 0)
          .map((title) => ({ id: newId("ms"), goalId, title: title.trim(), done: false, dueDate: null }));

        const goal: Goal = {
          id: goalId,
          title: draft.title.trim(),
          why: draft.why.trim(),
          horizon: draft.horizon,
          startDate: todayISO(),
          targetDate: draft.targetDate,
          progress: draft.progress,
          isPrimary: false,
          milestones,
        };
        setData((prev) => ({ ...prev, goals: [...prev.goals, goal] }));
        return goal;
      },

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
            milestones: g.milestones.map((m) => (m.id === milestoneId ? { ...m, done: !m.done } : m)),
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
    };
  }, [data]);

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppState {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState musi być użyte wewnątrz AppStateProvider");
  return ctx;
}
