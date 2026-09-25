import { Link } from "@tanstack/react-router";
import { CalendarDays, Crosshair, History, Settings } from "lucide-react";

const ITEMS = [
  { to: "/", label: "Dziś", exact: true, icon: CalendarDays },
  { to: "/cele", label: "Cele", exact: false, icon: Crosshair },
  { to: "/historia", label: "Historia", exact: false, icon: History },
  { to: "/ustawienia", label: "Ustawienia", exact: false, icon: Settings },
] as const;

export function BottomNav() {
  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-20 mx-auto max-w-[440px] bg-gradient-to-t from-background via-background/85 to-transparent px-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] pt-8">
      <div className="glass-card pointer-events-auto flex items-center justify-between rounded-full px-2 py-2">
        {ITEMS.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            activeOptions={{ exact: item.exact }}
            activeProps={{ className: "bg-primary text-primary-foreground font-semibold" }}
            inactiveProps={{ className: "text-foreground/55" }}
            className="press flex min-w-0 flex-1 flex-col items-center gap-1 rounded-full px-1 py-2 text-center text-[10px] font-medium"
          >
            <item.icon className="size-4" aria-hidden="true" />
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
