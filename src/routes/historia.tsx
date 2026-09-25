import { createFileRoute } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { CardLabel, GlassCard } from "@/components/GlassCard";
import { useAppState } from "@/context/app-state";
import { formatDatePL, goalById, sortedEntries } from "@/lib/goals";
import { ANSWER_LABEL } from "@/types/goals";

export const Route = createFileRoute("/historia")({
  head: () => ({
    meta: [
      { title: "Historia — Kierunek" },
      {
        name: "description",
        content: "Historia codziennych odpowiedzi i krótkich notatek o postępie.",
      },
      { property: "og:title", content: "Historia — Kierunek" },
      {
        property: "og:description",
        content: "Historia codziennych odpowiedzi i krótkich notatek o postępie.",
      },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const { data } = useAppState();
  const entries = sortedEntries(data.entries);
  const positive = entries.filter((entry) => entry.answer !== "no").length;

  return (
    <AppShell title="Historia" meta={`${entries.length} wpisów`}>
      <GlassCard className="rounded-[28px] p-6">
        <CardLabel>Ostatnie dni</CardLabel>
        <h1 className="font-display mt-3 text-4xl leading-tight">Małe kroki tworzą kierunek.</h1>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-glass-soft p-3">
            <p className="text-3xl font-semibold tabular-nums">{entries.length}</p>
            <p className="mt-1 text-xs text-foreground/45">podsumowań</p>
          </div>
          <div className="rounded-xl bg-glass-soft p-3">
            <p className="text-3xl font-semibold tabular-nums text-primary">{positive}</p>
            <p className="mt-1 text-xs text-foreground/45">dni do przodu</p>
          </div>
        </div>
      </GlassCard>

      <section className="rise mt-2">
        <h2 className="mb-3 px-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-foreground/40">
          Dziennik
        </h2>
        <div className="space-y-2">
          {entries.length ? (
            entries.map((entry) => {
              const goal = goalById(data, entry.goalId);
              return (
                <article key={entry.id} className="glass-row rounded-2xl p-4">
                  <div className="flex items-center justify-between gap-3">
                    <time className="text-xs text-foreground/45">{formatDatePL(entry.date)}</time>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${entry.answer === "no" ? "bg-destructive/15 text-destructive-foreground" : "bg-primary/15 text-primary"}`}
                    >
                      {ANSWER_LABEL[entry.answer]}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-foreground/80">{entry.note || "Bez notatki"}</p>
                  {entry.obstacle ? (
                    <p className="mt-1 text-xs text-foreground/45">Przeszkoda: {entry.obstacle}</p>
                  ) : null}
                  {entry.reflection ? (
                    <details className="mt-3 rounded-xl bg-glass-soft px-3 py-2 ring-1 ring-hairline">
                      <summary className="flex cursor-pointer list-none items-center gap-1.5 text-xs text-primary">
                        <Sparkles className="size-3" /> Podsumowanie AI
                      </summary>
                      <p className="mt-2 text-xs leading-relaxed text-foreground/70">
                        {entry.reflection.summary}
                      </p>
                      <p className="mt-2 text-xs leading-relaxed text-foreground/85">
                        <span className="text-foreground/45">Następny krok: </span>
                        {entry.reflection.nextStep}
                      </p>
                    </details>
                  ) : null}
                  <p className="mt-2 truncate text-[11px] text-foreground/35">
                    {goal?.title ?? "Usunięty cel"}
                  </p>
                </article>
              );
            })
          ) : (
            <GlassCard>
              <p className="text-sm text-foreground/55">
                Wieczorne podsumowania pojawią się tutaj.
              </p>
            </GlassCard>
          )}
        </div>
      </section>
    </AppShell>
  );
}
