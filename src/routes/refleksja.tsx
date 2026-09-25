import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, RefreshCw, Sparkles } from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/AppShell";
import { CardLabel, GlassCard } from "@/components/GlassCard";
import { CheckinButtons } from "@/components/CheckinButtons";
import { Button } from "@/components/ui/button";
import { useAppState } from "@/context/app-state";
import { AiError, generateReflection, isAiConfigured } from "@/lib/ai";
import { entryForDate, formatDatePL, primaryGoal, reflectionDateISO } from "@/lib/goals";
import { LOCAL_MODEL, localReflection } from "@/lib/reflection-local";
import type { DayAnswer } from "@/types/goals";

const ANSWERS: readonly DayAnswer[] = ["yes", "partly", "no"];

export const Route = createFileRoute("/refleksja")({
  validateSearch: (search: Record<string, unknown>): { answer?: DayAnswer } => {
    const answer = ANSWERS.find((a) => a === search["answer"]);
    return answer ? { answer } : {};
  },
  head: () => ({
    meta: [
      { title: "Wieczorna refleksja — Kierunek" },
      {
        name: "description",
        content: "Podsumowanie dnia i jeden konkretny następny krok w stronę celu.",
      },
      { property: "og:title", content: "Wieczorna refleksja — Kierunek" },
      {
        property: "og:description",
        content: "Podsumowanie dnia i jeden konkretny następny krok w stronę celu.",
      },
    ],
  }),
  component: ReflectionPage,
});

const textareaClass =
  "mt-2 w-full resize-none rounded-xl bg-glass-soft px-3 py-3 text-sm text-foreground ring-1 ring-hairline outline-none placeholder:text-foreground/35 focus:ring-primary/50";

function ReflectionPage() {
  const search = Route.useSearch();
  const { data, saveDayEntry, saveReflection } = useAppState();
  const goal = primaryGoal(data);
  const date = reflectionDateISO();
  const entry = entryForDate(data.entries, date);
  const aiReady = isAiConfigured(data.settings.ai);

  const [answer, setAnswer] = useState<DayAnswer | null>(entry?.answer ?? search.answer ?? null);
  const [note, setNote] = useState(entry?.note ?? "");
  const [obstacle, setObstacle] = useState(entry?.obstacle ?? "");
  const [generating, setGenerating] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  if (!goal) {
    return (
      <AppShell title="Refleksja">
        <GlassCard>
          <p className="font-display text-2xl">Najpierw zapisz cel.</p>
          <Button asChild className="mt-5 rounded-xl">
            <Link to="/cele/nowy">Dodaj cel</Link>
          </Button>
        </GlassCard>
      </AppShell>
    );
  }

  const dirty =
    !entry || entry.answer !== answer || entry.note !== note || entry.obstacle !== obstacle;
  const reflection = entry?.reflection ?? null;

  const save = (): boolean => {
    if (!answer) return false;
    saveDayEntry({ date, goalId: goal.id, answer, note: note.trim(), obstacle: obstacle.trim() });
    return true;
  };

  // Z modelem, gdy jest skonfigurowany; bez niego (albo gdy zawiedzie) — lokalnie,
  // więc poranny krok i widżet dostają treść zawsze.
  const summarize = async () => {
    if (!answer) return;
    save();
    setNotice(null);
    const ctx = { goal, date, answer, note, obstacle, entries: data.entries };
    if (!aiReady) {
      saveReflection(date, localReflection(ctx));
      return;
    }
    setGenerating(true);
    try {
      saveReflection(date, await generateReflection(data.settings.ai, ctx));
    } catch (e) {
      saveReflection(date, localReflection(ctx));
      setNotice(
        `${e instanceof AiError ? e.message : "Model nie odpowiedział."} Podsumowanie przygotowano lokalnie.`,
      );
    } finally {
      setGenerating(false);
    }
  };

  return (
    <AppShell title="Refleksja" meta={formatDatePL(date)}>
      <div className="flex items-center px-1">
        <Button asChild variant="ghost" size="icon" aria-label="Wróć do ekranu Dziś">
          <Link to="/">
            <ArrowLeft />
          </Link>
        </Button>
      </div>

      <GlassCard className="rounded-[28px] p-6">
        <CardLabel>Wieczorna refleksja</CardLabel>
        <h1 className="font-display mt-3 text-3xl leading-tight">
          Czy dzisiejszy dzień przybliżył Cię do celu?
        </h1>
        <p className="mt-2 truncate text-sm text-foreground/50">{goal.title}</p>
        <CheckinButtons value={answer} onChange={setAnswer} />
      </GlassCard>

      <GlassCard>
        <label htmlFor="note" className="text-xs font-medium text-foreground/65">
          Co dziś zrobiłeś dla celu?
        </label>
        <textarea
          id="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="np. Zamówiłem stół roboczy, zadzwoniłem do elektryka"
          className={textareaClass}
        />
        <label htmlFor="obstacle" className="mt-4 block text-xs font-medium text-foreground/65">
          Co przeszkodziło? <span className="text-foreground/35">(opcjonalnie)</span>
        </label>
        <textarea
          id="obstacle"
          value={obstacle}
          onChange={(e) => setObstacle(e.target.value)}
          rows={2}
          placeholder="np. Sprawy urzędowe zjadły popołudnie"
          className={textareaClass}
        />

        <Button
          type="button"
          disabled={!answer || generating || (!dirty && Boolean(reflection))}
          onClick={() => void summarize()}
          className="press mt-4 h-11 w-full rounded-xl"
        >
          <Sparkles />
          {generating ? "Model myśli…" : "Zapisz i podsumuj dzień"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={!answer || !dirty || generating}
          onClick={save}
          className="mt-1 w-full rounded-xl text-foreground/55"
        >
          {dirty ? "Zapisz bez podsumowania" : "Zapisano"}
        </Button>
      </GlassCard>

      {generating ? (
        <GlassCard>
          <CardLabel>Podsumowanie dnia</CardLabel>
          <div className="mt-4 space-y-2">
            <div className="h-3 w-full animate-pulse rounded-full bg-glass-strong" />
            <div className="h-3 w-4/5 animate-pulse rounded-full bg-glass-strong" />
            <div className="h-3 w-3/5 animate-pulse rounded-full bg-glass-strong" />
          </div>
          <p className="mt-4 text-xs text-foreground/40">
            Model na ThinkCentre analizuje dzień. To może potrwać do minuty.
          </p>
        </GlassCard>
      ) : null}

      {notice ? (
        <GlassCard>
          <CardLabel>Model niedostępny</CardLabel>
          <p className="mt-3 text-sm leading-relaxed text-foreground/75">{notice}</p>
        </GlassCard>
      ) : null}

      {reflection && !generating ? (
        <GlassCard className="rounded-[28px] p-6">
          <div className="flex items-center justify-between">
            <CardLabel>Podsumowanie dnia</CardLabel>
            <Sparkles className="size-4 text-primary" />
          </div>
          <p className="mt-3 text-[15px] leading-relaxed text-foreground/85">
            {reflection.summary}
          </p>

          <div className="mt-5 rounded-2xl bg-primary/12 p-4 ring-1 ring-primary/30">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
              Następny krok na jutro
            </p>
            <p className="font-display mt-2 text-xl leading-snug">{reflection.nextStep}</p>
          </div>

          <p className="mt-5 border-t border-hairline pt-4 text-[13px] italic leading-relaxed text-foreground/60">
            „{reflection.motivation}”
          </p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.15em] text-foreground/30">
            na widżecie ·{" "}
            {reflection.model === LOCAL_MODEL ? "podsumowanie lokalne" : reflection.model}
          </p>

          {aiReady ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => void summarize()}
              className="mt-4 w-full rounded-xl bg-glass-soft"
            >
              <RefreshCw />
              Wygeneruj ponownie
            </Button>
          ) : null}
        </GlassCard>
      ) : null}

      {!aiReady ? (
        <GlassCard>
          <CardLabel>Podsumowanie z AI</CardLabel>
          <p className="mt-3 text-sm leading-relaxed text-foreground/60">
            Teraz podsumowanie powstaje lokalnie, z Twoich celów i kamieni milowych. Po połączeniu
            modelu z ThinkCentre przez AI Gateway będzie pisane przez AI — dalej trafi do porannego
            powiadomienia i na widżet.
          </p>
          <Button asChild variant="ghost" className="mt-3 w-full rounded-xl bg-glass-soft">
            <Link to="/ustawienia" hash="ai">
              Skonfiguruj AI Gateway
            </Link>
          </Button>
        </GlassCard>
      ) : null}
    </AppShell>
  );
}
