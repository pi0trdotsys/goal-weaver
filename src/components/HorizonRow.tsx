import { Link } from "@tanstack/react-router";

import type { Goal } from "@/types/goals";
import { HORIZON_SHORT } from "@/types/goals";

export function HorizonRow({ goal }: { goal: Goal }) {
  return (
    <Link
      to="/cele/$id"
      params={{ id: goal.id }}
      className="press glass-row flex items-center gap-4 rounded-2xl px-4 py-3.5"
    >
      <span className="font-display w-9 shrink-0 text-lg font-medium text-foreground/70">
        {HORIZON_SHORT[goal.horizon]}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{goal.title}</p>
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-glass">
          <div className="h-full rounded-full bg-primary" style={{ width: `${goal.progress}%` }} />
        </div>
      </div>
      <span className="shrink-0 text-xs tabular-nums text-foreground/45">{goal.progress}%</span>
    </Link>
  );
}
