"use client";

import * as React from "react";
import { RadioGroup as RadioGroupPrimitive } from "radix-ui";

import { useField } from "@/components/ui/field-context";
import { cn } from "@/lib/utils";

export type ChoiceOption<V extends string = string> = {
  value: V;
  label: React.ReactNode;
  /** Second line under the label (ChoiceCards only). */
  description?: React.ReactNode;
  disabled?: boolean;
  /** "destructive" shows the selected card in red (ChoiceCards only). */
  tone?: "default" | "destructive";
};

type ChoiceGroupProps<V extends string> = {
  /** The selected value; null or undefined selects nothing yet. */
  value: V | null | undefined;
  onValueChange: (value: V) => void;
  options: readonly ChoiceOption<V>[];
  disabled?: boolean;
  /** Marks the group aria-required (and adds a hidden native radio for form validation when `name` is set). */
  required?: boolean;
  /** Form field name, only when a <form> reads the value natively. */
  name?: string;
  className?: string;
  id?: string;
  /** Needed outside a FormField; inside one the field's label names the group. */
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
};

function joinIds(...ids: (string | undefined)[]) {
  const list = ids.filter(Boolean).join(" ").trim();
  return list || undefined;
}

/** Shared radio-group wiring: one Tab stop, arrow keys move and select, label/hint/error from a FormField. */
function useGroupProps<V extends string>(props: ChoiceGroupProps<V>) {
  const field = useField();
  const named = Boolean(props["aria-label"] || props["aria-labelledby"]);
  const required = Boolean(props.required ?? field?.required);
  return {
    id: props.id,
    name: props.name,
    disabled: props.disabled,
    // Radix renders a hidden native radio per item when `required` is set.
    // Unnamed and required, those block the whole form in Firefox (no radio
    // in the unnamed "group" is checked), so only native-validate a named group.
    required: required && Boolean(props.name),
    "aria-required": required || undefined,
    value: props.value ?? null,
    onValueChange: (next: string) => props.onValueChange(next as V),
    "aria-label": props["aria-label"],
    "aria-labelledby": props["aria-labelledby"] ?? (!named && field ? field.labelId : undefined),
    "aria-describedby": joinIds(props["aria-describedby"], field?.describedBy),
    "aria-invalid": props["aria-invalid"] ?? (field?.invalid ? true : undefined),
  };
}

/**
 * Pick one of a few short options ("Branches | Regions", "Auto | Yes | No").
 * A WAI-ARIA radio group: one Tab stop, arrow keys move and select, and the
 * selected option is also shown by weight and fill, not colour alone.
 */
function SegmentedControl<V extends string>({ size = "default", ...props }: ChoiceGroupProps<V> & { size?: "sm" | "default" }) {
  const group = useGroupProps(props);
  return (
    <RadioGroupPrimitive.Root
      data-slot="segmented-control"
      {...group}
      className={cn(
        "inline-flex max-w-full overflow-x-auto rounded-lg border border-black/10 bg-white p-0.5 aria-invalid:border-rose-300 data-disabled:opacity-60",
        props.className
      )}
    >
      {props.options.map((option) => (
        <RadioGroupPrimitive.Item
          key={option.value}
          value={option.value}
          disabled={option.disabled}
          data-slot="segmented-control-item"
          className={cn(
            "shrink-0 rounded-md whitespace-nowrap text-black/60 transition outline-none hover:text-navy focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 data-[state=checked]:bg-navy data-[state=checked]:font-medium data-[state=checked]:text-white data-[state=checked]:shadow-xs",
            size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm"
          )}
        >
          {option.label}
        </RadioGroupPrimitive.Item>
      ))}
    </RadioGroupPrimitive.Root>
  );
}

/**
 * Pick one of a few outcomes that need a sentence each (Resolve: "Different
 * people" / "Same person"; Pay from: Zakat / Waqf). Same keyboard model as
 * SegmentedControl, laid out as cards with a radio dot.
 */
function ChoiceCards<V extends string>({ columns = 2, ...props }: ChoiceGroupProps<V> & { columns?: 1 | 2 | 3 }) {
  const group = useGroupProps(props);
  return (
    <RadioGroupPrimitive.Root
      data-slot="choice-cards"
      {...group}
      className={cn(
        "grid gap-3",
        columns === 2 && "sm:grid-cols-2",
        columns === 3 && "sm:grid-cols-2 lg:grid-cols-3",
        props.className
      )}
    >
      {props.options.map((option) => {
        const destructive = option.tone === "destructive";
        return (
          <RadioGroupPrimitive.Item
            key={option.value}
            value={option.value}
            disabled={option.disabled}
            data-slot="choice-card"
            className={cn(
              "group/choice flex items-start gap-3 rounded-lg border border-black/10 bg-white p-4 text-left transition outline-none hover:border-black/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:border-black/10",
              destructive
                ? "data-[state=checked]:border-rose-500 data-[state=checked]:bg-rose-50/60 data-[state=checked]:ring-1 data-[state=checked]:ring-rose-500"
                : "data-[state=checked]:border-brand data-[state=checked]:bg-brand/[0.05] data-[state=checked]:ring-1 data-[state=checked]:ring-brand"
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "mt-0.5 size-4 shrink-0 rounded-full border border-black/25 bg-white transition-[border-width] group-data-[state=checked]/choice:border-[5px]",
                destructive ? "group-data-[state=checked]/choice:border-rose-600" : "group-data-[state=checked]/choice:border-brand"
              )}
            />
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-navy">{option.label}</span>
              {option.description ? (
                <span className="mt-0.5 block text-sm text-black/60">{option.description}</span>
              ) : null}
            </span>
          </RadioGroupPrimitive.Item>
        );
      })}
    </RadioGroupPrimitive.Root>
  );
}

export { SegmentedControl, ChoiceCards };
export type { ChoiceGroupProps };
