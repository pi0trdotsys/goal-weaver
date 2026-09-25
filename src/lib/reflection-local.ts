import type { ReflectionContext } from "@/lib/ai";
import { currentStreak, daysLeft, nextMilestone, timeElapsedPercent } from "@/lib/goals";
import type { AiReflection, DayEntry } from "@/types/goals";

/**
 * Podsumowanie dnia bez modelu AI — z reguł opartych o cel, kamienie milowe,
 * serię i tempo. Używane, gdy AI Gateway nie jest skonfigurowany albo nie
 * odpowiada, więc pętla „refleksja → poranny krok → widżet” działa zawsze.
 */

export const LOCAL_MODEL = "lokalnie";

function sentence(text: string): string {
  return text.trim().replace(/[.!…\s]+$/, "");
}

function clip(text: string, max: number): string {
  const t = text.trim().replace(/\s+/g, " ");
  return t.length <= max ? t : `${t.slice(0, max - 1).trimEnd()}…`;
}

export function localReflection(ctx: ReflectionContext): AiReflection {
  const { goal, answer } = ctx;
  const note = sentence(ctx.note);
  const obstacle = sentence(ctx.obstacle);
  const milestone = nextMilestone(goal);

  // Seria liczona z dzisiejszym wpisem (ctx.entries może go jeszcze nie mieć).
  const entries: DayEntry[] = [
    ...ctx.entries.filter((e) => e.date !== ctx.date),
    {
      id: "today",
      date: ctx.date,
      goalId: goal.id,
      answer,
      note: ctx.note,
      obstacle: ctx.obstacle,
      reflection: null,
    },
  ];
  const streak = currentStreak(entries, ctx.date);

  const elapsed = timeElapsedPercent(goal, ctx.date);
  const left = daysLeft(goal.targetDate, ctx.date);

  const parts: string[] = [];
  if (answer === "yes") {
    parts.push(`Ten dzień pracował na cel „${goal.title}”.`);
    if (note) parts.push(`Zrobione: ${note}.`);
  } else if (answer === "partly") {
    parts.push(`Mały krok to wciąż krok w stronę celu „${goal.title}”.`);
    if (note) parts.push(`Zrobione: ${note}.`);
    if (obstacle) parts.push(`Hamowało: ${obstacle}.`);
  } else {
    parts.push(
      obstacle
        ? `Dziś cel „${goal.title}” musiał poczekać — przeszkodziło: ${obstacle}.`
        : `Dziś cel „${goal.title}” musiał poczekać.`,
    );
    parts.push("Jeden słabszy dzień nie zmienia kierunku.");
  }

  if (answer !== "no" && streak > 1) parts.push(`To już ${streak} dni z rzędu w dobrą stronę.`);
  if (goal.progress + 10 < elapsed) {
    parts.push(
      `Postęp (${goal.progress}%) jest za upływem czasu (${elapsed}%), a zostało ${left} dni — warto dołożyć tempa.`,
    );
  } else if (goal.progress >= elapsed && elapsed > 0) {
    parts.push(`Postęp (${goal.progress}%) nadąża za czasem (${elapsed}%). Dobre tempo.`);
  }

  const target = milestone ? `„${milestone.title}”` : `cel „${goal.title}”`;
  const nextStep =
    answer === "no"
      ? `Zacznij dzień od 15 minut na ${target}, zanim cokolwiek innego zabierze Ci czas.`
      : obstacle
        ? `Zaplanuj 30 minut na ${target} o stałej porze, z zapasem na to, co dziś przeszkodziło („${clip(obstacle, 40)}”).`
        : `Poświęć 30 minut na ${target} i zapisz jeden konkretny efekt.`;

  const motivation =
    answer === "no"
      ? "Wracasz do gry. Jeden mały krok wystarczy."
      : clip(`Pamiętaj, po co: ${sentence(goal.why)}.`, 110);

  return {
    summary: clip(parts.join(" "), 600),
    nextStep: clip(nextStep, 160),
    motivation,
    model: LOCAL_MODEL,
    generatedAt: new Date().toISOString(),
  };
}
