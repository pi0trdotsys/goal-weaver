import { z } from "zod";

import {
  daysLeft,
  formatDatePL,
  nextMilestone,
  sortedEntries,
  timeElapsedPercent,
} from "@/lib/goals";
import type { AiReflection, AiSettings, DayAnswer, DayEntry, Goal } from "@/types/goals";
import { ANSWER_LABEL, HORIZON_LABEL } from "@/types/goals";

/**
 * Klient AI Gateway (API zgodne z OpenAI: LiteLLM, Ollama /v1, vLLM, LocalAI…).
 * Na Androidzie `fetch` jest przechwytywany przez CapacitorHttp (natywny HTTP),
 * więc nie obowiązuje CORS, a adres może być zwykłym http:// w sieci Tailscale.
 * Szczegóły: docs/ai-gateway.md
 */

const REQUEST_TIMEOUT_MS = 120_000;

export class AiError extends Error {}

export function isAiConfigured(ai: AiSettings): boolean {
  return ai.enabled && ai.baseUrl.trim().length > 0 && ai.model.trim().length > 0;
}

/**
 * Normalizuje adres bazowy: bez końcowego "/", a gdy podano sam host
 * (np. http://thinkcentre:4000) — dokleja "/v1".
 */
export function normalizeBaseUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, "");
  if (!trimmed) return "";
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
  try {
    const url = new URL(withScheme);
    if (url.pathname === "/" || url.pathname === "") return `${url.origin}/v1`;
  } catch {
    throw new AiError("Nieprawidłowy adres gatewaya.");
  }
  return withScheme;
}

function headers(ai: AiSettings): Record<string, string> {
  const h: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (ai.apiKey.trim()) h["Authorization"] = `Bearer ${ai.apiKey.trim()}`;
  return h;
}

async function request(url: string, init: RequestInit): Promise<unknown> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new AiError("Model nie odpowiedział w ciągu 2 minut.")),
      REQUEST_TIMEOUT_MS,
    );
  });

  try {
    const response = await Promise.race([fetch(url, init), timeout]);
    const text = await response.text();
    if (!response.ok) {
      throw new AiError(
        `Gateway zwrócił ${response.status}: ${text.slice(0, 200) || response.statusText}`,
      );
    }
    try {
      return JSON.parse(text) as unknown;
    } catch {
      throw new AiError("Gateway zwrócił odpowiedź, która nie jest JSON-em.");
    }
  } catch (error) {
    if (error instanceof AiError) throw error;
    throw new AiError(
      `Brak połączenia z gatewayem (${error instanceof Error ? error.message : String(error)}). Sprawdź adres i czy Tailscale jest włączony.`,
    );
  } finally {
    clearTimeout(timer);
  }
}

const modelsSchema = z.object({ data: z.array(z.object({ id: z.string() })) });

/** GET /models — służy też jako test połączenia. */
export async function listModels(ai: AiSettings): Promise<string[]> {
  const base = normalizeBaseUrl(ai.baseUrl);
  if (!base) throw new AiError("Podaj adres gatewaya.");
  const json = await request(`${base}/models`, { method: "GET", headers: headers(ai) });
  const parsed = modelsSchema.safeParse(json);
  if (!parsed.success) throw new AiError("Gateway odpowiedział, ale bez listy modeli.");
  return parsed.data.data.map((m) => m.id).sort();
}

export interface ReflectionContext {
  goal: Goal;
  date: string;
  answer: DayAnswer;
  note: string;
  obstacle: string;
  /** Wszystkie wpisy — funkcja sama wybierze ostatnie dni tego celu. */
  entries: DayEntry[];
}

export const SYSTEM_PROMPT = `Jesteś spokojnym, konkretnym coachem celów długofalowych. Odpowiadasz wyłącznie po polsku, zwięźle, ciepło, bez frazesów, bez emoji i bez markdownu.

Zwracasz WYŁĄCZNIE jeden obiekt JSON o polach:
{"summary": "...", "nextStep": "...", "motivation": "..."}

- summary: 2–3 zdania podsumowania dnia w odniesieniu do celu. Nazwij jedną rzecz, która zadziałała, albo jedną, która przeszkodziła. Nie powtarzaj notatki słowo w słowo.
- nextStep: JEDEN konkretny krok do wykonania jutro (15 minut – 2 godziny), zaczynający się od czasownika w trybie rozkazującym, maksymalnie 120 znaków. Powiąż go z najbliższym kamieniem milowym albo z tym, co dziś przeszkodziło. Użytkownik przeczyta go rano w powiadomieniu „Cel na dziś”, więc nie pisz w nim „jutro”.
- motivation: jedno krótkie zdanie (maksymalnie 80 znaków) w 2. osobie, odwołujące się do tego, po co jest ten cel. Pokaże się na widżecie ekranu głównego.`;

/** Buduje wiadomość użytkownika z kontekstem celu i ostatnich dni. */
export function buildReflectionPrompt(ctx: ReflectionContext): string {
  const { goal } = ctx;
  const milestone = nextMilestone(goal);
  const open = goal.milestones.filter((m) => !m.done);
  const done = goal.milestones.length - open.length;
  const recent = sortedEntries(ctx.entries)
    .filter((e) => e.goalId === goal.id && e.date < ctx.date)
    .slice(0, 7);
  const previousStep = recent.find((e) => e.reflection)?.reflection?.nextStep;

  const lines = [
    `CEL: ${goal.title}`,
    `PO CO: ${goal.why}`,
    `HORYZONT: ${HORIZON_LABEL[goal.horizon]}, termin ${formatDatePL(goal.targetDate)} (zostało ${daysLeft(goal.targetDate, ctx.date)} dni)`,
    `POSTĘP: ${goal.progress}% (upłynęło ${timeElapsedPercent(goal, ctx.date)}% czasu)`,
    `KAMIENIE MILOWE: ukończone ${done}/${goal.milestones.length}` +
      (open.length
        ? `; otwarte: ${open
            .slice(0, 4)
            .map((m) => (m.dueDate ? `${m.title} (do ${formatDatePL(m.dueDate)})` : m.title))
            .join("; ")}`
        : ""),
    milestone ? `NAJBLIŻSZY KAMIEŃ MILOWY: ${milestone.title}` : null,
    "",
    "OSTATNIE DNI:",
    ...(recent.length
      ? recent.map((e) => `- ${e.date}: ${ANSWER_LABEL[e.answer]}${e.note ? ` — ${e.note}` : ""}`)
      : ["- brak wcześniejszych wpisów"]),
    previousStep ? `WCZORAJSZY ZAPLANOWANY KROK: ${previousStep}` : null,
    "",
    `DZIŚ (${ctx.date}):`,
    `- Czy dzień przybliżył do celu: ${ANSWER_LABEL[ctx.answer]}`,
    `- Co zrobiłem: ${ctx.note.trim() || "(brak notatki)"}`,
    `- Co przeszkodziło: ${ctx.obstacle.trim() || "(nic nie wpisano)"}`,
    "",
    "Zwróć sam JSON.",
  ];
  return lines.filter((l): l is string => l !== null).join("\n");
}

const reflectionSchema = z.object({
  summary: z.string().min(1),
  nextStep: z.string().min(1),
  motivation: z.string().min(1),
});

const completionSchema = z.object({
  choices: z
    .array(z.object({ message: z.object({ content: z.string().nullable().optional() }) }))
    .min(1),
  model: z.string().optional(),
});

function clip(text: string, max: number): string {
  const t = text.trim().replace(/\s+/g, " ");
  return t.length <= max ? t : `${t.slice(0, max - 1).trimEnd()}…`;
}

/**
 * Wyciąga JSON z odpowiedzi modelu: usuwa bloki <think>…</think> (modele
 * rozumujące), ogrodzenia ```json i tekst przed/po obiekcie.
 */
export function parseReflection(
  content: string,
): Pick<AiReflection, "summary" | "nextStep" | "motivation"> {
  const cleaned = content
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/```(?:json)?/gi, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end <= start) throw new AiError("Model nie zwrócił JSON-a z podsumowaniem.");

  let raw: unknown;
  try {
    raw = JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    throw new AiError("Model zwrócił uszkodzony JSON. Spróbuj ponownie.");
  }
  const parsed = reflectionSchema.safeParse(raw);
  if (!parsed.success)
    throw new AiError("W odpowiedzi modelu brakuje pól summary / nextStep / motivation.");

  return {
    summary: clip(parsed.data.summary, 600),
    nextStep: clip(parsed.data.nextStep, 160),
    motivation: clip(parsed.data.motivation, 110),
  };
}

/** POST /chat/completions — podsumowanie dnia i następny krok. */
export async function generateReflection(
  ai: AiSettings,
  ctx: ReflectionContext,
): Promise<AiReflection> {
  if (!isAiConfigured(ai)) throw new AiError("Skonfiguruj AI Gateway w Ustawieniach.");
  const base = normalizeBaseUrl(ai.baseUrl);

  const json = await request(`${base}/chat/completions`, {
    method: "POST",
    headers: headers(ai),
    body: JSON.stringify({
      model: ai.model.trim(),
      temperature: 0.5,
      max_tokens: 1024,
      stream: false,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildReflectionPrompt(ctx) },
      ],
    }),
  });

  const completion = completionSchema.safeParse(json);
  if (!completion.success) throw new AiError("Nieoczekiwany format odpowiedzi gatewaya.");
  const content = completion.data.choices[0]?.message.content ?? "";

  return {
    ...parseReflection(content),
    model: completion.data.model ?? ai.model.trim(),
    generatedAt: new Date().toISOString(),
  };
}
