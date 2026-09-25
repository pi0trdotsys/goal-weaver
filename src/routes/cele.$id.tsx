import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Calendar, Check, Pencil, Sparkles, Trash2 } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { ConfirmAction } from "@/components/ConfirmAction";
import { CardLabel, GlassCard } from "@/components/GlassCard";
import { ProgressRing } from "@/components/ProgressRing";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useAppState } from "@/context/app-state";
import {
  daysLabelPL,
  daysLeft,
  formatDatePL,
  formatShortDatePL,
  goalById,
  sortedEntries,
} from "@/lib/goals";
import { ANSWER_LABEL, HORIZON_LABEL } from "@/types/goals";

export const Route = createFileRoute("/cele/$id")({
  head: () => ({
    meta: [
      { title: "Szczegóły celu — Kierunek" },
      { name: "description", content: "Postęp, kamienie milowe i historia wybranego celu." },
      { property: "og:title", content: "Szczegóły celu — Kierunek" },
      { property: "og:description", content: "Postęp, kamienie milowe i historia wybranego celu." },
    ],
  }),
  component: GoalDetailsPage,
});

function GoalDetailsPage() {
  const { id } = Route.useParams();
  const { data, toggleMilestone, updateGoalProgress, deleteGoal } = useAppState();
  const navigate = useNavigate();
  const goal = goalById(data, id);

  if (!goal) {
    return (
      <AppShell title="Cel">
        <GlassCard>
          <h1 className="font-display text-2xl">Nie znaleziono tego celu.</h1>
          <Button asChild className="mt-5 rounded-xl">
            <Link to="/cele">Wróć do listy</Link>
          </Button>
        </GlassCard>
      </AppShell>
    );
  }

  const entries = sortedEntries(data.entries.filter((entry) => entry.goalId === goal.id));

  return (
    <AppShell title={HORIZON_LABEL[goal.horizon]} meta={goal.isPrimary ? "główny" : undefined}>
      <div className="flex items-center justify-between px-1">
        <Button asChild variant="ghost" size="icon" aria-label="Wróć do celów">
          <Link to="/cele">
            <ArrowLeft />
          </Link>
        </Button>
        <Button asChild variant="ghost" size="icon" aria-label="Edytuj cel">
          <Link to="/cele/nowy" search={{ edit: goal.id }}>
            <Pencil />
          </Link>
        </Button>
      </div>

      <GlassCard className="rounded-[28px] p-6">
        <div className="flex items-start justify-between gap-5">
          <div className="min-w-0">
            <CardLabel>Twój kierunek</CardLabel>
            <h1 className="font-display mt-3 text-4xl leading-tight">{goal.title}</h1>
          </div>
          <ProgressRing value={goal.progress} />
        </div>
        <p className="mt-5 text-sm leading-relaxed text-foreground/60">{goal.why}</p>
        <div className="mt-5 flex items-center gap-2 border-t border-hairline pt-4 text-xs text-foreground/55">
          <Calendar className="size-4 text-primary" />
          <span>{formatDatePL(goal.targetDate)}</span>
          <span className="ml-auto">{daysLabelPL(daysLeft(goal.targetDate))}</span>
        </div>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center justify-between">
          <CardLabel>Postęp</CardLabel>
          <span className="text-sm tabular-nums text-primary">{goal.progress}%</span>
        </div>
        <Slider
          className="mt-5"
          value={[goal.progress]}
          max={100}
          step={1}
          aria-label="Postęp celu"
          onValueChange={(value) => updateGoalProgress(goal.id, value[0] ?? 0)}
        />
      </GlassCard>

      <GlassCard>
        <CardLabel>Kamienie milowe</CardLabel>
        <div className="mt-4 space-y-2">
          {goal.milestones.length === 0 ? (
            <p className="text-sm text-foreground/50">
              Dodaj kamienie milowe w edycji celu — pomagają AI planować następne kroki.
            </p>
          ) : null}
          {goal.milestones.map((milestone) => (
            <Button
              key={milestone.id}
              type="button"
              variant="ghost"
              onClick={() => toggleMilestone(milestone.id)}
              className="h-auto w-full justify-start whitespace-normal rounded-xl bg-glass-soft px-3 py-3 text-left"
            >
              <span
                className={`flex size-5 shrink-0 items-center justify-center rounded-full ring-1 ring-hairline ${milestone.done ? "bg-primary text-primary-foreground" : "bg-glass"}`}
              >
                {milestone.done ? <Check className="size-3" /> : null}
              </span>
              <span
                className={`flex-1 ${milestone.done ? "text-foreground/45 line-through" : "text-foreground/80"}`}
              >
                {milestone.title}
              </span>
              {milestone.dueDate ? (
                <span className="shrink-0 text-[11px] tabular-nums text-foreground/40">
                  {formatShortDatePL(milestone.dueDate)}
                </span>
              ) : null}
            </Button>
          ))}
        </div>
      </GlassCard>

      <GlassCard>
        <CardLabel>Ostatnie wpisy</CardLabel>
        <div className="mt-4 divide-y divide-hairline">
          {entries.length ? (
            entries.slice(0, 4).map((entry) => (
              <div key={entry.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex justify-between text-xs">
                  <span className="text-foreground/45">{formatDatePL(entry.date)}</span>
                  <span className="text-primary">{ANSWER_LABEL[entry.answer]}</span>
                </div>
                <p className="mt-1 text-sm text-foreground/70">{entry.note || "Bez notatki"}</p>
                {entry.reflection ? (
                  <p className="mt-2 flex gap-1.5 text-xs leading-relaxed text-foreground/50">
                    <Sparkles className="mt-0.5 size-3 shrink-0 text-primary" />
                    {entry.reflection.nextStep}
                  </p>
                ) : null}
              </div>
            ))
          ) : (
            <p className="text-sm text-foreground/50">
              Pierwszy wpis pojawi się po wieczornym podsumowaniu.
            </p>
          )}
        </div>
      </GlassCard>

      <ConfirmAction
        trigger={
          <Button type="button" variant="ghost" className="w-full rounded-xl text-foreground/45">
            <Trash2 />
            Usuń cel
          </Button>
        }
        title="Usunąć ten cel?"
        description="Cel i jego kamienie milowe znikną. Wpisy dnia zostaną w historii."
        confirmLabel="Usuń cel"
        onConfirm={() => {
          deleteGoal(goal.id);
          void navigate({ to: "/cele" });
        }}
      />
    </AppShell>
  );
}
