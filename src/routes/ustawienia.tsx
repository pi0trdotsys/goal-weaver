import { createFileRoute } from "@tanstack/react-router";
import { AlarmClock, Bell, Check, LayoutPanelTop, Moon, Server, Sun } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { ConfirmAction } from "@/components/ConfirmAction";
import { CardLabel, GlassCard } from "@/components/GlassCard";
import { WidgetPreview } from "@/components/WidgetPreview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useAppState } from "@/context/app-state";
import { AiError, listModels, normalizeBaseUrl } from "@/lib/ai";
import { widgetPayload } from "@/lib/motivation";
import {
  getReminderPermissions,
  isNative,
  openExactAlarmSettings,
  requestNotificationPermission,
  sendTestNotification,
  syncNative,
  type ReminderPermissions,
} from "@/lib/native";

export const Route = createFileRoute("/ustawienia")({
  head: () => ({
    meta: [
      { title: "Ustawienia — Kierunek" },
      {
        name: "description",
        content: "Godziny przypomnień, powiadomienia, widżet, AI Gateway i wybór głównego celu.",
      },
      { property: "og:title", content: "Ustawienia — Kierunek" },
      {
        property: "og:description",
        content: "Godziny przypomnień, powiadomienia, widżet, AI Gateway i wybór głównego celu.",
      },
    ],
  }),
  component: SettingsPage,
});

type ConnectionState =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "ok"; models: string[] }
  | { status: "error"; message: string };

function SettingsPage() {
  const { data, setPrimaryGoal, updateSettings, updateAiSettings, loadDemoData, resetData } =
    useAppState();
  const { settings } = data;
  const [permissions, setPermissions] = useState<ReminderPermissions | null>(null);
  const [testSent, setTestSent] = useState(false);
  const [connection, setConnection] = useState<ConnectionState>({ status: "idle" });

  const refreshPermissions = useCallback(() => {
    void getReminderPermissions().then(setPermissions);
  }, []);

  // Link „Skonfiguruj AI Gateway” z refleksji prowadzi do #ai.
  useEffect(() => {
    if (window.location.hash === "#ai") {
      document.getElementById("ai")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  // Po powrocie z ekranu ustawień systemowych odśwież stan uprawnień.
  useEffect(() => {
    refreshPermissions();
    const onVisible = () => {
      if (document.visibilityState === "visible") refreshPermissions();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refreshPermissions]);

  const toggleNotifications = async (checked: boolean) => {
    updateSettings({ notificationsEnabled: checked });
    if (checked && isNative() && permissions?.notifications !== "granted") {
      await requestNotificationPermission();
      refreshPermissions();
      void syncNative({ ...data, settings: { ...settings, notificationsEnabled: true } });
    }
  };

  const testConnection = async () => {
    setConnection({ status: "checking" });
    try {
      const models = await listModels(settings.ai);
      setConnection({ status: "ok", models });
      if (!settings.ai.model && models[0]) updateAiSettings({ model: models[0] });
    } catch (e) {
      setConnection({
        status: "error",
        message: e instanceof AiError ? e.message : "Nie udało się połączyć.",
      });
    }
  };

  let normalizedUrl = "";
  try {
    normalizedUrl = normalizeBaseUrl(settings.ai.baseUrl);
  } catch {
    normalizedUrl = "";
  }

  return (
    <AppShell title="Ustawienia">
      <GlassCard className="rounded-[28px] p-6">
        <CardLabel>Rytm dnia</CardLabel>
        <h1 className="font-display mt-3 text-4xl leading-tight">Dwa krótkie momenty skupienia.</h1>
        <p className="mt-3 text-sm leading-relaxed text-foreground/50">
          Rano „Cel na dziś”. Wieczorem chwila na refleksję.
        </p>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center gap-3">
          <Bell className="size-4 text-primary" />
          <div className="flex-1">
            <p className="text-sm font-medium">Powiadomienia</p>
            <p className="text-xs text-foreground/45">„Cel na dziś” i „Wieczorna refleksja”</p>
          </div>
          <Switch
            checked={settings.notificationsEnabled}
            onCheckedChange={(checked) => void toggleNotifications(checked)}
            aria-label="Włącz powiadomienia"
          />
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <label className="rounded-xl bg-glass-soft p-3 text-xs text-foreground/50">
            <span className="mb-2 flex items-center gap-2">
              <Sun className="size-4 text-primary" />
              Rano
            </span>
            <Input
              type="time"
              value={settings.morningTime}
              disabled={!settings.notificationsEnabled}
              onChange={(event) =>
                event.target.value && updateSettings({ morningTime: event.target.value })
              }
              className="h-9 rounded-lg"
            />
          </label>
          <label className="rounded-xl bg-glass-soft p-3 text-xs text-foreground/50">
            <span className="mb-2 flex items-center gap-2">
              <Moon className="size-4 text-primary" />
              Wieczór
            </span>
            <Input
              type="time"
              value={settings.eveningTime}
              disabled={!settings.notificationsEnabled}
              onChange={(event) =>
                event.target.value && updateSettings({ eveningTime: event.target.value })
              }
              className="h-9 rounded-lg"
            />
          </label>
        </div>

        {permissions && settings.notificationsEnabled ? (
          <div className="mt-4 space-y-2">
            {permissions.notifications !== "granted" ? (
              <div className="rounded-xl bg-destructive/10 p-3 text-xs leading-relaxed text-foreground/75 ring-1 ring-destructive/30">
                Android blokuje powiadomienia tej aplikacji.
                <Button
                  type="button"
                  variant="ghost"
                  className="mt-2 h-8 w-full rounded-lg bg-glass-soft text-xs"
                  onClick={() =>
                    void requestNotificationPermission().then(() => {
                      refreshPermissions();
                      void syncNative(data);
                    })
                  }
                >
                  Zezwól na powiadomienia
                </Button>
              </div>
            ) : null}
            {permissions.notifications === "granted" && !permissions.exactAlarms ? (
              <div className="rounded-xl bg-glass-soft p-3 text-xs leading-relaxed text-foreground/60 ring-1 ring-hairline">
                <p className="flex items-center gap-2 font-medium text-foreground/80">
                  <AlarmClock className="size-4 text-primary" /> Dokładne godziny
                </p>
                <p className="mt-1">
                  Bez zgody na „Alarmy i przypomnienia” Android może opóźnić powiadomienie o
                  kilka–kilkanaście minut.
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  className="mt-2 h-8 w-full rounded-lg bg-glass text-xs"
                  onClick={() => void openExactAlarmSettings().then(refreshPermissions)}
                >
                  Otwórz ustawienia alarmów
                </Button>
              </div>
            ) : null}
            {permissions.notifications === "granted" ? (
              <Button
                type="button"
                variant="ghost"
                className="h-9 w-full rounded-xl bg-glass-soft text-xs"
                onClick={() =>
                  void sendTestNotification(data).then(() => {
                    setTestSent(true);
                    setTimeout(() => setTestSent(false), 6000);
                  })
                }
              >
                {testSent ? "Powiadomienie za 5 sekund…" : "Wyślij testowe powiadomienie"}
              </Button>
            ) : null}
          </div>
        ) : null}
      </GlassCard>

      <GlassCard>
        <div className="flex items-center gap-3">
          <LayoutPanelTop className="size-4 text-primary" />
          <div className="flex-1">
            <p className="text-sm font-medium">Widżet 4×1</p>
            <p className="text-xs text-foreground/45">Motywujący tekst o celu na ekranie głównym</p>
          </div>
        </div>
        <div className="mt-4">
          <WidgetPreview payload={widgetPayload(data)} />
        </div>
        <p className="mt-3 text-xs leading-relaxed text-foreground/45">
          Przytrzymaj palec na pustym miejscu ekranu głównego → Widżety → Kierunek. Tekst zmienia
          się codziennie; po wieczornej refleksji z AI widżet pokazuje motywację wygenerowaną dla
          Ciebie.
        </p>
      </GlassCard>

      <GlassCard>
        <CardLabel>Główny cel</CardLabel>
        <p className="mt-2 text-xs leading-relaxed text-foreground/45">
          Ten cel zobaczysz codziennie na pierwszym ekranie, w powiadomieniach i na widżecie.
        </p>
        <div className="mt-4 space-y-2">
          {data.goals.length === 0 ? (
            <p className="text-sm text-foreground/50">Nie masz jeszcze celów.</p>
          ) : null}
          {data.goals.map((goal) => {
            const active = settings.primaryGoalId === goal.id;
            return (
              <label
                key={goal.id}
                className={`flex cursor-pointer items-center gap-3 rounded-xl p-3 ring-1 ${active ? "bg-primary/15 ring-primary/40" : "bg-glass-soft ring-hairline"}`}
              >
                <input
                  type="radio"
                  name="primaryGoal"
                  checked={active}
                  onChange={() => setPrimaryGoal(goal.id)}
                  className="accent-primary"
                />
                <span className="min-w-0 flex-1 truncate text-sm">{goal.title}</span>
                {active ? (
                  <span className="text-[10px] font-semibold uppercase text-primary">Główny</span>
                ) : null}
              </label>
            );
          })}
        </div>
      </GlassCard>

      <GlassCard>
        <div id="ai" className="flex scroll-mt-6 items-center gap-3">
          <Server className="size-4 text-primary" />
          <div className="flex-1">
            <p className="text-sm font-medium">AI Gateway</p>
            <p className="text-xs text-foreground/45">Model na ThinkCentre, przez Tailscale</p>
          </div>
          <Switch
            checked={settings.ai.enabled}
            onCheckedChange={(checked) => updateAiSettings({ enabled: checked })}
            aria-label="Włącz podsumowania AI"
          />
        </div>

        <label htmlFor="ai-url" className="mt-5 block text-xs font-medium text-foreground/65">
          Adres (API zgodne z OpenAI)
        </label>
        <Input
          id="ai-url"
          inputMode="url"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          value={settings.ai.baseUrl}
          onChange={(e) => {
            updateAiSettings({ baseUrl: e.target.value });
            setConnection({ status: "idle" });
          }}
          placeholder="http://thinkcentre:4000/v1"
          className="mt-2 h-11 rounded-xl bg-glass-soft"
        />
        {normalizedUrl && normalizedUrl !== settings.ai.baseUrl.trim() ? (
          <p className="mt-1 truncate text-[11px] text-foreground/35">→ {normalizedUrl}</p>
        ) : null}

        <label htmlFor="ai-model" className="mt-4 block text-xs font-medium text-foreground/65">
          Model
        </label>
        <Input
          id="ai-model"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          value={settings.ai.model}
          onChange={(e) => updateAiSettings({ model: e.target.value })}
          placeholder="np. qwen3:8b"
          className="mt-2 h-11 rounded-xl bg-glass-soft"
        />

        <label htmlFor="ai-key" className="mt-4 block text-xs font-medium text-foreground/65">
          Klucz API <span className="text-foreground/35">(opcjonalnie)</span>
        </label>
        <Input
          id="ai-key"
          type="password"
          autoComplete="off"
          value={settings.ai.apiKey}
          onChange={(e) => updateAiSettings({ apiKey: e.target.value })}
          placeholder="sk-…"
          className="mt-2 h-11 rounded-xl bg-glass-soft"
        />

        <Button
          type="button"
          variant="ghost"
          disabled={!settings.ai.baseUrl.trim() || connection.status === "checking"}
          onClick={() => void testConnection()}
          className="mt-4 w-full rounded-xl bg-glass-soft"
        >
          {connection.status === "checking" ? "Łączę…" : "Testuj połączenie i pobierz modele"}
        </Button>

        {connection.status === "error" ? (
          <p className="mt-3 rounded-xl bg-destructive/10 p-3 text-xs leading-relaxed text-foreground/75 ring-1 ring-destructive/30">
            {connection.message}
          </p>
        ) : null}
        {connection.status === "ok" ? (
          <div className="mt-3">
            <p className="flex items-center gap-1.5 text-xs text-primary">
              <Check className="size-3.5" /> Połączono · {connection.models.length} modeli
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {connection.models.map((model) => (
                <button
                  key={model}
                  type="button"
                  onClick={() => updateAiSettings({ model })}
                  className={`press rounded-full px-3 py-1.5 text-[11px] ring-1 ${settings.ai.model === model ? "bg-primary text-primary-foreground ring-primary" : "bg-glass-soft ring-hairline"}`}
                >
                  {model}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </GlassCard>

      <GlassCard>
        <CardLabel>Dane</CardLabel>
        <p className="mt-2 text-xs leading-relaxed text-foreground/45">
          Wszystko jest zapisane tylko na tym telefonie.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {data.goals.length === 0 ? (
            <Button
              type="button"
              variant="ghost"
              className="rounded-xl bg-glass-soft text-xs"
              onClick={loadDemoData}
            >
              Przykładowe dane
            </Button>
          ) : (
            <ConfirmAction
              trigger={
                <Button type="button" variant="ghost" className="rounded-xl bg-glass-soft text-xs">
                  Przykładowe dane
                </Button>
              }
              title="Zastąpić dane przykładowymi?"
              description="Twoje cele i wpisy zostaną zastąpione danymi demonstracyjnymi. Ustawienia AI zostaną zachowane."
              confirmLabel="Zastąp"
              onConfirm={loadDemoData}
            />
          )}
          <ConfirmAction
            trigger={
              <Button
                type="button"
                variant="ghost"
                className="rounded-xl bg-glass-soft text-xs text-destructive-foreground"
              >
                Wyczyść wszystko
              </Button>
            }
            title="Usunąć wszystkie dane?"
            description="Cele, wpisy i ustawienia zostaną trwale usunięte z tego telefonu."
            confirmLabel="Usuń"
            onConfirm={resetData}
          />
        </div>
      </GlassCard>

      <p className="px-2 text-center text-[11px] leading-relaxed text-foreground/30">
        Kierunek · wersja 1.0
      </p>
    </AppShell>
  );
}
