import { daysLabelPL, daysLeft } from "@/lib/goals";
import { lineForDay, type WidgetPayload } from "@/lib/motivation";

/**
 * Podgląd widżetu 4x1 — ten sam układ i ta sama reguła wyboru tekstu co
 * android/app/src/main/res/layout/widget_goal.xml + GoalWidgetProvider.java.
 */
export function WidgetPreview({ payload }: { payload: WidgetPayload }) {
  const line = lineForDay(payload);
  const left = payload.hasGoal ? daysLeft(payload.targetDate) : 0;

  return (
    <div className="flex items-center gap-3 rounded-[22px] bg-background px-4 py-3 ring-1 ring-hairline">
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.22em] text-primary">
          <span className="size-1.5 rounded-full bg-primary" />
          <span className="truncate">
            {payload.hasGoal ? `${daysLabelPL(left)} · ${payload.goalTitle}` : "Kierunek"}
          </span>
        </p>
        <p className="mt-1 line-clamp-2 font-serif text-[14px] leading-snug text-foreground">
          {line}
        </p>
      </div>
      {payload.hasGoal ? (
        <div className="shrink-0 text-right">
          <p className="text-lg font-semibold leading-none tabular-nums text-foreground">
            {payload.progress}%
          </p>
          <p className="mt-0.5 text-[8px] uppercase tracking-[0.15em] text-foreground/45">postęp</p>
        </div>
      ) : null}
    </div>
  );
}
