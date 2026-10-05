import { Check, CircleAlert } from "lucide-react";

import { STEPS, type StepId } from "@/lib/backoffice/assessment-steps";
import { cn } from "@/lib/utils";

export type StepState = "complete" | "issues" | "todo";

export function StepNav({
  current,
  states,
  onSelect,
  disabled,
}: {
  current: StepId;
  states: Record<StepId, StepState>;
  onSelect: (step: StepId) => void;
  disabled?: boolean;
}) {
  const doneCount = STEPS.filter((step) => step.id !== 8 && states[step.id] === "complete").length;

  return (
    <nav aria-label="Assessment steps" className="space-y-3">
      <div className="px-1">
        <div className="flex items-center justify-between text-xs text-black/50">
          <span>Progress</span>
          <span className="tabular-nums">{doneCount} / 7 steps</span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-black/[0.07]">
          <div
            className="h-full rounded-full bg-[#007050] transition-all"
            style={{ width: `${(doneCount / 7) * 100}%` }}
          />
        </div>
      </div>

      <ol className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
        {STEPS.map((step) => {
          const state = states[step.id];
          const active = step.id === current;
          return (
            <li key={step.id} className="shrink-0">
              <button
                type="button"
                disabled={disabled}
                onClick={() => onSelect(step.id)}
                aria-current={active ? "step" : undefined}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition",
                  active ? "bg-white shadow-xs ring-1 ring-black/[0.06]" : "hover:bg-black/[0.03]",
                )}
              >
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums",
                    state === "complete" && "bg-[#007050] text-white",
                    state === "issues" && "bg-amber-100 text-amber-700",
                    state === "todo" && (active ? "bg-[#001539] text-white" : "bg-black/[0.06] text-black/50"),
                  )}
                >
                  {state === "complete" ? (
                    <Check className="size-3.5" />
                  ) : state === "issues" ? (
                    <CircleAlert className="size-3.5" />
                  ) : (
                    step.id
                  )}
                </span>
                <span className="min-w-0">
                  <span className={cn("block text-sm whitespace-nowrap", active ? "font-semibold text-[#001539]" : "text-black/70")}>
                    {step.title}
                  </span>
                  {step.letters ? (
                    <span className="hidden text-xs text-black/40 lg:block">Section {step.letters}</span>
                  ) : null}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
