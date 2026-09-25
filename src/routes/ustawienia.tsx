import { createFileRoute } from "@tanstack/react-router";
import { Bell, Moon, Sun } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { CardLabel, GlassCard } from "@/components/GlassCard";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useAppState } from "@/context/app-state";

export const Route = createFileRoute("/ustawienia")({
  head: () => ({
    meta: [
      { title: "Ustawienia — Kierunek" },
      { name: "description", content: "Godziny przypomnień, powiadomienia i wybór głównego celu." },
      { property: "og:title", content: "Ustawienia — Kierunek" },
      { property: "og:description", content: "Godziny przypomnień, powiadomienia i wybór głównego celu." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { data, setPrimaryGoal, updateSettings } = useAppState();

  return (
    <AppShell title="Ustawienia">
      <GlassCard className="rounded-[28px] p-6">
        <CardLabel>Rytm dnia</CardLabel>
        <h1 className="font-display mt-3 text-4xl leading-tight">Dwa krótkie momenty skupienia.</h1>
        <p className="mt-3 text-sm leading-relaxed text-foreground/50">Rano przypomnienie o kierunku. Wieczorem chwila na podsumowanie.</p>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center gap-3"><Bell className="size-4 text-primary" /><div className="flex-1"><p className="text-sm font-medium">Powiadomienia</p><p className="text-xs text-foreground/45">Poranne i wieczorne przypomnienia</p></div><Switch checked={data.settings.notificationsEnabled} onCheckedChange={(checked) => updateSettings({ notificationsEnabled: checked })} aria-label="Włącz powiadomienia" /></div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <label className="rounded-xl bg-glass-soft p-3 text-xs text-foreground/50"><span className="mb-2 flex items-center gap-2"><Sun className="size-4 text-primary" />Rano</span><Input type="time" value={data.settings.morningTime} disabled={!data.settings.notificationsEnabled} onChange={(event) => updateSettings({ morningTime: event.target.value })} className="h-9 rounded-lg" /></label>
          <label className="rounded-xl bg-glass-soft p-3 text-xs text-foreground/50"><span className="mb-2 flex items-center gap-2"><Moon className="size-4 text-primary" />Wieczór</span><Input type="time" value={data.settings.eveningTime} disabled={!data.settings.notificationsEnabled} onChange={(event) => updateSettings({ eveningTime: event.target.value })} className="h-9 rounded-lg" /></label>
        </div>
      </GlassCard>

      <GlassCard>
        <CardLabel>Główny cel</CardLabel>
        <p className="mt-2 text-xs leading-relaxed text-foreground/45">Ten cel zobaczysz codziennie na pierwszym ekranie.</p>
        <div className="mt-4 space-y-2">
          {data.goals.map((goal) => {
            const active = data.settings.primaryGoalId === goal.id;
            return <label key={goal.id} className={`flex cursor-pointer items-center gap-3 rounded-xl p-3 ring-1 ${active ? "bg-primary/15 ring-primary/40" : "bg-glass-soft ring-hairline"}`}><input type="radio" name="primaryGoal" checked={active} onChange={() => setPrimaryGoal(goal.id)} className="accent-primary" /><span className="min-w-0 flex-1 truncate text-sm">{goal.title}</span>{active ? <span className="text-[10px] font-semibold uppercase text-primary">Główny</span> : null}</label>;
          })}
        </div>
      </GlassCard>

      <p className="px-2 text-center text-[11px] leading-relaxed text-foreground/30">Makieta zapisuje zmiany tylko do czasu odświeżenia strony.</p>
    </AppShell>
  );
}