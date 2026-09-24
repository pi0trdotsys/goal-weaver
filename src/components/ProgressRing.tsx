const RADIUS = 34;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function ProgressRing({ value, caption = "postęp" }: { value: number; caption?: string }) {
  const offset = CIRCUMFERENCE * (1 - Math.min(100, Math.max(0, value)) / 100);

  return (
    <div className="relative size-16 shrink-0">
      <svg viewBox="0 0 80 80" className="size-16 -rotate-90" aria-hidden="true">
        <circle
          cx="40"
          cy="40"
          r={RADIUS}
          fill="none"
          stroke="var(--hairline)"
          strokeWidth="4"
        />
        <circle
          cx="40"
          cy="40"
          r={RADIUS}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          className="arc"
        />
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-base font-semibold leading-none tabular-nums text-foreground">
          {Math.round(value)}%
        </span>
        <span className="text-[9px] uppercase tracking-[0.15em] text-foreground/40">{caption}</span>
      </span>
    </div>
  );
}
