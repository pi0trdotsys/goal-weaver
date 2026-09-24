import { Link, createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/AppShell";
import { HorizonRow } from "@/components/HorizonRow";
import { useAppState } from "@/context/app-state";
import { goalsByHorizon } from "@/lib/goals";
import { HORIZON_LABEL } from "@/types/goals";

export const Route = createFileRoute("/cele/")({
  head: () => ({
    meta: [
      { title: "Cele — Kierunek" },
      {
        name: "description",
        content: "Wszystkie Twoje cele pogrupowane po horyzoncie: 3 miesiące, 6 miesięcy, rok, dwa lata.",
      },
      { property: "og:title", content: "Cele — Kierunek" },
      {
        property: "og:description",
        content: "Wszystkie Twoje cele pogrupowane po horyzoncie: 3 miesiące, 6 miesięcy, rok, dwa lata.",
      },
    ],
  }),
  component: GoalsPage,
});

function GoalsPage() {
  const { data } = useAppState();
  const groups = goalsByHorizon(data.goals);

  return (
    <AppShell title="Cele" meta={`${data.goals.length} aktywne`}>
      <Link
        to="/cele/nowy"
        className="press glass-card rise flex items-center justify-between rounded-2xl px-4 py-3.5 text-sm font-medium"
      >
        Dodaj nowy cel
        <span className="text-primary">+</span>
      </Link>

      {groups.length === 0 ? (
        <p className="rise mt-6 px-1 text-sm text-foreground/55">
          Nie masz jeszcze celów. Zacznij od jednego zdania o tym, dokąd zmierzasz.
        </p>
      ) : (
        groups.map((group) => (
          <section key={group.horizon} className="rise mt-3">
            <h2 className="mb-3 px-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-foreground/40">
              {HORIZON_LABEL[group.horizon]}
            </h2>
            <div className="space-y-2">
              {group.goals.map((goal) => (
                <HorizonRow key={goal.id} goal={goal} />
              ))}
            </div>
          </section>
        ))
      )}
    </AppShell>
  );
}
