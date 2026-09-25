import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { AppShell } from "@/components/AppShell";
import { CardLabel, GlassCard } from "@/components/GlassCard";
import { CheckinButtons } from "@/components/CheckinButtons";
import { HorizonRow } from "@/components/HorizonRow";
import { ProgressRing } from "@/components/ProgressRing";
import { StreakDots } from "@/components/StreakDots";
import { useAppState } from "@/context/app-state";
import {
  currentStreak,
  daysLabelPL,
  daysLeft,
  entryForDate,
  primaryGoal,
  todayISO,
} from "@/lib/goals";
import type { DayAnswer } from "@/types/goals";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dziś — Kierunek, tracker celów długofalowych" },
      {
        name: "description",
        content:
          "Codzienne przypomnienie o Twoim głównym celu i wieczorne pytanie, czy miniony dzień Cię do niego przybliżył.",
      },
      { property: "og:title", content: "Dziś — Kierunek, tracker celów długofalowych" },
      {
        property: "og:description",
        content:
          "Codzienne przypomnienie o Twoim głównym celu i wieczorne pytanie, czy miniony dzień Cię do niego przybliżył.",
      },
    ],
  }),
  component: TodayPage,
});

function TodayPage() {
  const { data, saveDayEntry } = useAppState();
  const goal = primaryGoal(data);
  const today = todayISO();
  const todayEntry = entryForDate(data.entries, today);

  const [answer, setAnswer] = useState<DayAnswer | null>(todayEntry?.answer ?? null);
  const [note, setNote] = useState(todayEntry?.note ?? "");
  const [saved, setSaved] = useState(Boolean(todayEntry));

  if (!goal) {
    return (
      <AppShell title="Cele">
        <GlassCard className="rounded-[28px] p-6">
          <p className="font-display text-2xl leading-snug">Nie masz jeszcze żadnego celu.</p>
          <p className="mt-2 text-sm text-foreground/55">
            Zacznij od jednego zdania: dokąd zmierzasz w najbliższych miesiącach.
          </p>
        </GlassCard>
      </AppShell>
    );
  }

  const left = daysLeft(goal.targetDate);
  const streak = currentStreak(data.entries);

  return (
    <AppShell title="Dziś" meta="2026">
      <GlassCard className="relative overflow-hidden rounded-[28px] p-6">
        <div className="absolute right-6 top-6 flex items-center gap-1.5 rounded-full bg-glass-strong px-3 py-1.5 ring-1 ring-hairline">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-foreground/70">
            Dziś
          </span>
        </div>
        <p className="mt-14 text-[11px] font-medium uppercase tracking-[0.3em] text-foreground/40">
          Twój główny cel
        </p>
        <h1 className="font-display mt-2 text-[40px] font-medium leading-[1.02] tracking-tight">
          {goal.title}
        </h1>
        <div className="mt-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-foreground/40">Pozostało</p>
            <p className="font-display mt-0.5 text-5xl font-medium leading-none">
              {left}
              <span className="ml-1 text-base font-normal tracking-wide text-foreground/50">dni</span>
            </p>
          </div>
          <ProgressRing value={goal.progress} />
        </div>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center justify-between">
          <CardLabel>Poranek</CardLabel>
          <span className="text-[11px] tabular-nums text-foreground/35">
            {data.settings.morningTime}
          </span>
        </div>
        <p className="font-display mt-3 text-[22px] font-normal leading-snug">
          Pamiętaj, po co dziś wstajesz.
        </p>
        <p className="mt-1 text-[13px] leading-relaxed text-foreground/55">{goal.why}</p>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center justify-between">
          <CardLabel>Wieczór</CardLabel>
          <span className="text-[11px] tabular-nums text-foreground/35">
            {data.settings.eveningTime}
          </span>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-foreground/80">
          Czy miniony dzień przybliżył Cię do celu?
        </p>
        <CheckinButtons
          value={answer}
          onChange={(next) => {
            setAnswer(next);
            setSaved(false);
          }}
        />
        <div className="mt-3">
          <label htmlFor="note" className="sr-only">
            Jedna linijka o dniu
          </label>
          <input
            id="note"
            value={note}
            onChange={(e) => {
              setNote(e.target.value);
              setSaved(false);
            }}
            placeholder="jedna linijka o dniu"
            className="w-full rounded-xl bg-glass-soft px-3 py-2.5 text-[13px] text-foreground ring-1 ring-hairline outline-none placeholder:text-foreground/35 focus:ring-primary/50"
          />
        </div>
        <Button
          type="button"
          disabled={!answer || saved}
          onClick={() => {
            if (!answer) return;
            saveDayEntry({ goalId: goal.id, answer, note });
            setSaved(true);
          }}
          className="press mt-3 h-10 w-full rounded-xl text-[13px] ring-1 ring-hairline disabled:bg-glass disabled:text-foreground/45"
        >
          {saved ? "Zapisano dzisiejszy wpis" : "Zapisz dzień"}
        </Button>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center justify-between">
          <CardLabel>Seria</CardLabel>
          <span className="text-xs tabular-nums text-foreground/60">{daysLabelPL(streak)}</span>
        </div>
        <StreakDots entries={data.entries} />
      </GlassCard>

      <section className="rise">
        <h2 className="mb-3 px-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-foreground/40">
          Horyzonty
        </h2>
        <div className="space-y-2">
          {data.goals
            .filter((g) => g.id !== goal.id)
            .map((g) => (
              <HorizonRow key={g.id} goal={g} />
            ))}
        </div>
      </section>
    </AppShell>
  );
}
