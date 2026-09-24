import type { DayEntry } from "@/types/goals";
import { weekStrip } from "@/lib/goals";

export function StreakDots({ entries }: { entries: DayEntry[] }) {
  const week = weekStrip(entries);

  return (
    <div className="mt-4 flex items-end justify-between">
      {week.map((day) => {
        const answered = day.entry && day.entry.answer !== "no";
        return (
          <div key={day.date} className="flex flex-col items-center gap-1.5">
            <span
              className={[
                "h-2 w-2 rounded-full",
                answered ? "bg-primary" : "bg-glass-strong",
                day.isToday ? "ring-2 ring-primary/40 ring-offset-2 ring-offset-background" : "",
              ].join(" ")}
            />
            <span className="text-[9px] text-foreground/40">{day.label}</span>
          </div>
        );
      })}
    </div>
  );
}
