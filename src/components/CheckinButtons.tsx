import type { DayAnswer } from "@/types/goals";
import { ANSWER_LABEL } from "@/types/goals";

const ANSWERS: DayAnswer[] = ["yes", "partly", "no"];

export function CheckinButtons({
  value,
  onChange,
}: {
  value: DayAnswer | null;
  onChange: (answer: DayAnswer) => void;
}) {
  return (
    <div className="mt-3 grid grid-cols-3 gap-2">
      {ANSWERS.map((answer) => {
        const active = value === answer;
        return (
          <button
            key={answer}
            type="button"
            onClick={() => onChange(answer)}
            aria-pressed={active}
            className={[
              "press rounded-xl py-2.5 text-[13px] ring-1 ring-hairline",
              active
                ? "bg-primary font-semibold text-primary-foreground"
                : "bg-glass font-medium text-foreground",
            ].join(" ")}
          >
            {ANSWER_LABEL[answer]}
          </button>
        );
      })}
    </div>
  );
}
