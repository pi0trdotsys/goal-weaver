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
    <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-[390px] px-5 pb-5">
      <div className="glass-card flex items-center justify-between rounded-full px-2 py-2">
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
