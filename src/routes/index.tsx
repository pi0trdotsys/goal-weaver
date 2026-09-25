import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Sparkles } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { CardLabel, GlassCard } from "@/components/GlassCard";
import { CheckinButtons } from "@/components/CheckinButtons";
import { HorizonRow } from "@/components/HorizonRow";
import { ProgressRing } from "@/components/ProgressRing";
import { StreakDots } from "@/components/StreakDots";
import { Button } from "@/components/ui/button";
import { useAppState } from "@/context/app-state";
import {
  addDaysISO,
  currentStreak,
  daysLabelPL,
  daysLeft,
  entryForDate,
  formatShortDatePL,
  latestReflectionEntry,
  nextMilestone,
  primaryGoal,
  reflectionDateISO,
  todayISO,
} from "@/lib/goals";
import { ANSWER_LABEL } from "@/types/goals";

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
  const { data, loadDemoData } = useAppState();
  const navigate = useNavigate();
  const goal = primaryGoal(data);
  const today = todayISO();
  const reflectionDay = reflectionDateISO();
  const todayEntry = entryForDate(data.entries, reflectionDay);

  if (!goal) {
    return (
      <AppShell title="Dziś" meta={formatShortDatePL(today)}>
        <GlassCard className="rounded-[28px] p-6">
          <CardLabel>Kierunek</CardLabel>
          <p className="font-display mt-3 text-3xl leading-snug">Nie masz jeszcze żadnego celu.</p>
          <p className="mt-2 text-sm leading-relaxed text-foreground/55">
            Zacznij od jednego zdania: dokąd zmierzasz w najbliższych miesiącach i po co.
          </p>
          <Button asChild className="press mt-6 h-11 w-full rounded-xl">
            <Link to="/cele/nowy">Dodaj pierwszy cel</Link>
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="mt-2 w-full rounded-xl text-foreground/55"
            onClick={loadDemoData}
          >
            Obejrzyj na przykładowych danych
          </Button>
        </GlassCard>
      </AppShell>
    );
  }

  const left = daysLeft(goal.targetDate);
  const streak = currentStreak(data.entries);
  // Krok zaplanowany wczoraj wieczorem (albo dziś po refleksji — na jutro).
  const plannedStep = latestReflectionEntry(data.entries, goal.id, addDaysISO(today, -1), 0);
  const milestone = nextMilestone(goal);

  return (
    <AppShell title="Dziś" meta={formatShortDatePL(today)}>
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
        <Link to="/cele/$id" params={{ id: goal.id }}>
          <h1 className="font-display mt-2 text-[40px] font-medium leading-[1.02] tracking-tight">
            {goal.title}
          </h1>
        </Link>
        <div className="mt-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-foreground/40">Pozostało</p>
            <p className="font-display mt-0.5 text-5xl font-medium leading-none">
              {left}
              <span className="ml-1 text-base font-normal tracking-wide text-foreground/50">
                dni
              </span>
            </p>
          </div>
          <ProgressRing value={goal.progress} />
        </div>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center justify-between">
          <CardLabel>Cel na dziś</CardLabel>
          <span className="text-[11px] tabular-nums text-foreground/35">
            {data.settings.morningTime}
          </span>
        </div>
        {plannedStep ? (
          <>
            <p className="font-display mt-3 text-[22px] font-normal leading-snug">
              {plannedStep.reflection.nextStep}
            </p>
            <p className="mt-2 flex items-center gap-1.5 text-[11px] text-foreground/40">
              <Sparkles className="size-3 text-primary" />
              krok z wczorajszej refleksji
            </p>
          </>
        ) : (
          <>
            <p className="font-display mt-3 text-[22px] font-normal leading-snug">
              Pamiętaj, po co dziś wstajesz.
            </p>
            <p className="mt-1 text-[13px] leading-relaxed text-foreground/55">{goal.why}</p>
            {milestone ? (
              <p className="mt-3 border-t border-hairline pt-3 text-[12px] text-foreground/50">
                Najbliższy kamień milowy:{" "}
                <span className="text-foreground/80">{milestone.title}</span>
              </p>
            ) : null}
          </>
        )}
      </GlassCard>

      <GlassCard>
        <div className="flex items-center justify-between">
          <CardLabel>Wieczorna refleksja</CardLabel>
          <span className="text-[11px] tabular-nums text-foreground/35">
            {data.settings.eveningTime}
          </span>
        </div>
        {todayEntry ? (
          <>
            <div className="mt-3 flex items-center gap-2">
              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${todayEntry.answer === "no" ? "bg-destructive/15 text-destructive-foreground" : "bg-primary/15 text-primary"}`}
              >
                {ANSWER_LABEL[todayEntry.answer]}
              </span>
              <p className="min-w-0 flex-1 truncate text-sm text-foreground/75">
                {todayEntry.note || "Bez notatki"}
              </p>
            </div>
            {todayEntry.reflection ? (
              <div className="mt-4 rounded-xl bg-glass-soft p-3 ring-1 ring-hairline">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
                  Jutro
                </p>
                <p className="mt-1 text-sm leading-relaxed text-foreground/85">
                  {todayEntry.reflection.nextStep}
                </p>
              </div>
            ) : null}
            <Button
              asChild
              variant="ghost"
              className="mt-3 w-full justify-between rounded-xl bg-glass-soft"
            >
              <Link to="/refleksja">
                {todayEntry.reflection ? "Zobacz podsumowanie dnia" : "Podsumuj dzień"}
                <ArrowRight />
              </Link>
            </Button>
          </>
        ) : (
          <>
            <p className="mt-3 text-sm leading-relaxed text-foreground/80">
              Czy miniony dzień przybliżył Cię do celu?
            </p>
            <CheckinButtons
              value={null}
              onChange={(answer) => void navigate({ to: "/refleksja", search: { answer } })}
            />
          </>
        )}
      </GlassCard>

      <GlassCard>
        <div className="flex items-center justify-between">
          <CardLabel>Seria</CardLabel>
          <span className="text-xs tabular-nums text-foreground/60">{daysLabelPL(streak)}</span>
        </div>
        <StreakDots entries={data.entries} />
      </GlassCard>

      {data.goals.length > 1 ? (
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
      ) : null}
    </AppShell>
  );
}
