import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Minus, Plus } from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/AppShell";
import { CardLabel, GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { useAppState, type GoalDraft, type MilestoneDraft } from "@/context/app-state";
import { goalById, todayISO } from "@/lib/goals";
import { HORIZON_LABEL, HORIZON_ORDER, type Horizon } from "@/types/goals";

export const Route = createFileRoute("/cele/nowy")({
  validateSearch: (search: Record<string, unknown>): { edit?: string } =>
    typeof search["edit"] === "string" ? { edit: search["edit"] } : {},
  head: () => ({
    meta: [
      { title: "Nowy cel — Kierunek" },
      {
        name: "description",
        content: "Zapisz kierunek, motywację, termin i kamienie milowe celu.",
      },
      { property: "og:title", content: "Nowy cel — Kierunek" },
      {
        property: "og:description",
        content: "Zapisz kierunek, motywację, termin i kamienie milowe celu.",
      },
    ],
  }),
  component: GoalFormPage,
});

function futureDate(months: number): string {
  const date = new Date(`${todayISO()}T12:00:00`);
  date.setMonth(date.getMonth() + months);
  return todayISO(date);
}

const HORIZON_MONTHS: Record<Horizon, number> = { "3m": 3, "6m": 6, "1y": 12, "2y": 24 };

function GoalFormPage() {
  const { edit } = Route.useSearch();
  const navigate = useNavigate({ from: "/cele/nowy" });
  const { data, createGoal, updateGoal } = useAppState();
  const existing = edit ? goalById(data, edit) : undefined;
  const [draft, setDraft] = useState<GoalDraft>(() => ({
    title: existing?.title ?? "",
    why: existing?.why ?? "",
    horizon: existing?.horizon ?? "3m",
    targetDate: existing?.targetDate ?? futureDate(3),
    progress: existing?.progress ?? 0,
    milestones: existing?.milestones.map((m) => ({
      id: m.id,
      title: m.title,
      dueDate: m.dueDate ?? "",
    })) ?? [{ id: null, title: "", dueDate: "" }],
  }));

  const update = <K extends keyof GoalDraft>(key: K, value: GoalDraft[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }));
  const updateMilestone = (index: number, patch: Partial<MilestoneDraft>) =>
    update(
      "milestones",
      draft.milestones.map((m, i) => (i === index ? { ...m, ...patch } : m)),
    );
  const valid =
    draft.title.trim().length > 0 && draft.why.trim().length > 0 && draft.targetDate.length > 0;

  return (
    <AppShell title={existing ? "Edytuj cel" : "Nowy cel"}>
      <GlassCard className="rounded-[28px] p-6">
        <CardLabel>Kierunek</CardLabel>
        <h1 className="font-display mt-3 text-3xl leading-tight">
          {existing ? "Doprecyzuj swój cel." : "Dokąd chcesz dojść?"}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-foreground/50">
          Nazwij rezultat tak, żeby od razu było wiadomo, co oznacza jego osiągnięcie.
        </p>
      </GlassCard>

      <GlassCard>
        <label htmlFor="goal-title" className="text-xs font-medium text-foreground/65">
          Nazwa celu
        </label>
        <Input
          id="goal-title"
          value={draft.title}
          onChange={(event) => update("title", event.target.value)}
          placeholder="np. Otworzyć własną pracownię"
          className="mt-2 h-11 rounded-xl bg-glass-soft"
        />
        <label htmlFor="goal-why" className="mt-5 block text-xs font-medium text-foreground/65">
          Dlaczego to jest ważne?
        </label>
        <textarea
          id="goal-why"
          value={draft.why}
          onChange={(event) => update("why", event.target.value)}
          placeholder="Jedno zdanie, które chcesz widzieć każdego ranka"
          rows={3}
          className="mt-2 w-full resize-none rounded-xl border border-input bg-glass-soft px-3 py-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring"
        />
      </GlassCard>

      <GlassCard>
        <CardLabel>Horyzont</CardLabel>
        <div className="mt-4 grid grid-cols-4 gap-2">
          {HORIZON_ORDER.map((horizon) => (
            <Button
              key={horizon}
              type="button"
              variant={draft.horizon === horizon ? "default" : "secondary"}
              onClick={() => {
                update("horizon", horizon);
                update("targetDate", futureDate(HORIZON_MONTHS[horizon]));
              }}
              className="rounded-xl px-1 text-xs"
            >
              {HORIZON_LABEL[horizon]}
            </Button>
          ))}
        </div>
        <label htmlFor="target-date" className="mt-5 block text-xs font-medium text-foreground/65">
          Data docelowa
        </label>
        <Input
          id="target-date"
          type="date"
          min={todayISO()}
          value={draft.targetDate}
          onChange={(event) => update("targetDate", event.target.value)}
          className="mt-2 h-11 rounded-xl bg-glass-soft"
        />
      </GlassCard>

      <GlassCard>
        <div className="flex items-center justify-between">
          <CardLabel>Postęp początkowy</CardLabel>
          <span className="text-sm tabular-nums text-primary">{draft.progress}%</span>
        </div>
        <Slider
          className="mt-5"
          value={[draft.progress]}
          max={100}
          onValueChange={(value) => update("progress", value[0] ?? 0)}
        />
      </GlassCard>

      <GlassCard>
        <CardLabel>Kamienie milowe</CardLabel>
        <div className="mt-4 space-y-2">
          {draft.milestones.map((milestone, index) => (
            <div
              key={milestone.id ?? `new-${index}`}
              className="rounded-xl bg-glass-soft p-2 ring-1 ring-hairline"
            >
              <div className="flex gap-2">
                <Input
                  value={milestone.title}
                  onChange={(event) => updateMilestone(index, { title: event.target.value })}
                  placeholder={`Krok ${index + 1}`}
                  className="h-10 rounded-lg bg-glass-soft"
                />
                {draft.milestones.length > 1 ? (
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label="Usuń krok"
                    onClick={() =>
                      update(
                        "milestones",
                        draft.milestones.filter((_, i) => i !== index),
                      )
                    }
                  >
                    <Minus />
                  </Button>
                ) : null}
              </div>
              <label className="mt-2 flex items-center gap-2 px-1 text-[11px] text-foreground/45">
                Termin
                <Input
                  type="date"
                  value={milestone.dueDate}
                  max={draft.targetDate}
                  onChange={(event) => updateMilestone(index, { dueDate: event.target.value })}
                  className="h-8 flex-1 rounded-lg bg-glass-soft text-xs"
                />
              </label>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="ghost"
          className="mt-2 w-full rounded-xl text-primary"
          onClick={() =>
            update("milestones", [...draft.milestones, { id: null, title: "", dueDate: "" }])
          }
        >
          <Plus />
          Dodaj krok
        </Button>
      </GlassCard>

      <Button
        disabled={!valid}
        className="press h-12 w-full rounded-xl"
        onClick={() => {
          const goal = existing ? (updateGoal(existing.id, draft), existing) : createGoal(draft);
          navigate({ to: "/cele/$id", params: { id: goal.id } });
        }}
      >
        {existing ? "Zapisz zmiany" : "Utwórz cel"}
      </Button>
    </AppShell>
  );
}
