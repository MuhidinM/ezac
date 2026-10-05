"use client";

import type { ReactNode } from "react";
import { Check } from "lucide-react";

import { FormField } from "@/components/dashboard/form-field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import type { Option } from "@/lib/backoffice/options";
import { cn } from "@/lib/utils";

type Base = {
  id: string;
  label: ReactNode;
  error?: string;
  hint?: ReactNode;
  required?: boolean;
  disabled?: boolean;
  className?: string;
};

function toNumber(raw: string): number | null {
  if (raw.trim() === "") return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

export function NumberField({
  value,
  onChange,
  min = 0,
  max,
  step,
  suffix,
  ...base
}: Base & {
  value: number | null;
  onChange: (value: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}) {
  return (
    <FormField label={base.label} htmlFor={base.id} error={base.error} hint={base.hint} required={base.required} className={base.className}>
      <div className="relative">
        <Input
          id={base.id}
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          step={step}
          value={value ?? ""}
          disabled={base.disabled}
          aria-invalid={!!base.error || undefined}
          onChange={(event) => onChange(toNumber(event.target.value))}
          className={cn("bg-white tabular-nums", suffix && "pr-12")}
        />
        {suffix ? (
          <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-black/40">
            {suffix}
          </span>
        ) : null}
      </div>
    </FormField>
  );
}

export function MoneyField(props: Omit<Parameters<typeof NumberField>[0], "suffix" | "step">) {
  return <NumberField {...props} step={0.01} suffix="ETB" />;
}

export function TextField({
  value,
  onChange,
  placeholder,
  type = "text",
  ...base
}: Base & {
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <FormField label={base.label} htmlFor={base.id} error={base.error} hint={base.hint} required={base.required} className={base.className}>
      <Input
        id={base.id}
        type={type}
        value={value ?? ""}
        placeholder={placeholder}
        disabled={base.disabled}
        aria-invalid={!!base.error || undefined}
        onChange={(event) => onChange(event.target.value === "" ? null : event.target.value)}
        className="bg-white"
      />
    </FormField>
  );
}

export function TextAreaField({
  value,
  onChange,
  placeholder,
  rows = 3,
  ...base
}: Base & {
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <FormField label={base.label} htmlFor={base.id} error={base.error} hint={base.hint} required={base.required} className={base.className}>
      <Textarea
        id={base.id}
        rows={rows}
        value={value ?? ""}
        placeholder={placeholder}
        disabled={base.disabled}
        aria-invalid={!!base.error || undefined}
        onChange={(event) => onChange(event.target.value === "" ? null : event.target.value)}
      />
    </FormField>
  );
}

export function SelectField({
  value,
  onChange,
  options,
  placeholder = "Select",
  ...base
}: Base & {
  value: string | null;
  onChange: (value: string | null) => void;
  options: Option[];
  placeholder?: string;
}) {
  return (
    <FormField label={base.label} htmlFor={base.id} error={base.error} hint={base.hint} required={base.required} className={base.className}>
      <NativeSelect
        id={base.id}
        value={value ?? ""}
        disabled={base.disabled}
        aria-invalid={!!base.error || undefined}
        onChange={(event) => onChange(event.target.value || null)}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </NativeSelect>
    </FormField>
  );
}

/** Multi-select rendered as toggle chips. */
export function ChipGroup({
  value,
  onChange,
  options,
  ...base
}: Base & {
  value: string[];
  onChange: (value: string[]) => void;
  options: Option[];
}) {
  function toggle(key: string) {
    onChange(value.includes(key) ? value.filter((item) => item !== key) : [...value, key]);
  }

  return (
    <fieldset className={cn("space-y-1.5", base.className)} disabled={base.disabled}>
      <legend className="mb-1.5 text-[13px] font-medium text-[#001539]">
        {base.label}
        {base.required ? <span className="text-rose-600">*</span> : null}
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = value.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              role="checkbox"
              aria-checked={selected}
              onClick={() => toggle(option.value)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition",
                selected
                  ? "border-[#007050] bg-[#007050]/[0.08] text-[#00573e]"
                  : "border-black/10 bg-white text-black/70 hover:border-black/20",
              )}
            >
              {selected ? <Check className="size-3.5" /> : null}
              {option.label}
            </button>
          );
        })}
      </div>
      {base.error ? (
        <p className="text-xs text-rose-700">{base.error}</p>
      ) : base.hint ? (
        <p className="text-xs text-black/50">{base.hint}</p>
      ) : null}
    </fieldset>
  );
}

/**
 * Yes / No segmented control. With `autoLabel`, a third "Auto" choice maps to
 * null so the backend derives the value (e.g. from household members).
 */
export function YesNoField({
  value,
  onChange,
  autoLabel,
  ...base
}: Base & {
  value: boolean | null;
  onChange: (value: boolean | null) => void;
  autoLabel?: string;
}) {
  const choices: { key: string; label: string; value: boolean | null }[] = [
    ...(autoLabel ? [{ key: "auto", label: autoLabel, value: null }] : []),
    { key: "yes", label: "Yes", value: true },
    { key: "no", label: "No", value: false },
  ];

  return (
    <div className={cn("space-y-1.5", base.className)}>
      <p id={`${base.id}-label`} className="text-[13px] font-medium text-[#001539]">
        {base.label}
        {base.required ? <span className="text-rose-600">*</span> : null}
      </p>
      <div
        role="radiogroup"
        aria-labelledby={`${base.id}-label`}
        className={cn(
          "inline-flex rounded-lg border bg-white p-0.5",
          base.error ? "border-rose-300" : "border-black/10",
        )}
      >
        {choices.map((choice) => {
          const selected = value === choice.value;
          return (
            <button
              key={choice.key}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={base.disabled}
              onClick={() => onChange(choice.value)}
              className={cn(
                "rounded-md px-3 py-1 text-sm transition",
                selected ? "bg-[#001539] font-medium text-white shadow-xs" : "text-black/60 hover:text-[#001539]",
              )}
            >
              {choice.label}
            </button>
          );
        })}
      </div>
      {base.error ? (
        <p className="text-xs text-rose-700">{base.error}</p>
      ) : base.hint ? (
        <p className="text-xs text-black/50">{base.hint}</p>
      ) : null}
    </div>
  );
}

/** Titled group of fields within a step. */
export function FieldSection({
  letter,
  title,
  description,
  children,
  aside,
}: {
  letter?: string;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-black/[0.06] bg-white shadow-xs">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-black/[0.06] px-5 py-4">
        <div className="flex items-start gap-3">
          {letter ? (
            <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-[#001539] text-xs font-semibold text-white">
              {letter}
            </span>
          ) : null}
          <div>
            <h3 className="text-sm font-semibold text-[#001539]">{title}</h3>
            {description ? <p className="mt-0.5 text-sm text-black/55">{description}</p> : null}
          </div>
        </div>
        {aside}
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}
