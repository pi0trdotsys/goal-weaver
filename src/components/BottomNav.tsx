import { Link } from "@tanstack/react-router";

const ITEMS = [
  { to: "/", label: "Dziś", exact: true },
  { to: "/cele", label: "Cele", exact: false },
  { to: "/historia", label: "Historia", exact: false },
  { to: "/ustawienia", label: "Ustawienia", exact: false },
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
            className="press flex-1 rounded-full px-2 py-2 text-center text-[12px] font-medium"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
