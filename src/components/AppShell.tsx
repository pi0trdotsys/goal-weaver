import type { ReactNode } from "react";

import { BottomNav } from "@/components/BottomNav";

export function AppShell({
  title,
  meta,
  children,
}: {
  title: string;
  meta?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground selection:bg-primary/30">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-halo blur-3xl" />
      {/* Treść przewijana pod paskiem statusu (edge-to-edge) wygasa, zamiast nachodzić na zegar. */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-20 h-[calc(env(safe-area-inset-top)+1.25rem)] bg-gradient-to-b from-background from-70% to-transparent" />

      <div className="relative mx-auto flex max-w-[440px] flex-col gap-3 px-5 pb-[calc(env(safe-area-inset-bottom)+7rem)] pt-[calc(env(safe-area-inset-top)+1.5rem)]">
        <header className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-foreground/45">
            {title}
          </span>
          {meta ? (
            <span className="text-[11px] tabular-nums tracking-[0.18em] text-foreground/35">
              {meta}
            </span>
          ) : null}
        </header>
        {children}
      </div>

      <BottomNav />
    </div>
  );
}
