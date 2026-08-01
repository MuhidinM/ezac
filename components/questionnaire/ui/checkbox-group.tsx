"use client";

import { cn } from "@/lib/utils";

type CheckboxOption = {
  value: string;
  label: string;
  description?: string;
};

type CheckboxGroupProps = {
  label: string;
  options: CheckboxOption[];
  values: Record<string, boolean>;
  onChange: (value: string, checked: boolean) => void;
  columns?: 1 | 2;
  error?: string;
};

export function CheckboxGroup({
  label,
  options,
  values,
  onChange,
  columns = 1,
  error,
}: CheckboxGroupProps) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-base font-medium text-[#1a3d2b]">{label}</legend>
      <div
        role="group"
        aria-label={label}
        className={cn(
          "grid gap-2",
          columns === 2 ? "sm:grid-cols-2" : "grid-cols-1",
        )}
      >
        {options.map((option) => {
          const id = `checkbox-${option.value}`;
          const checked = values[option.value] ?? false;

          return (
            <label
              key={option.value}
              htmlFor={id}
              className={cn(
                "flex min-h-[48px] cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-base transition",
                checked
                  ? "border-[#1a3d2b] bg-[#1a3d2b]/5"
                  : "border-[#1a3d2b]/15 bg-white hover:border-[#1a3d2b]/30",
              )}
            >
              <input
                type="checkbox"
                id={id}
                checked={checked}
                onChange={(e) => onChange(option.value, e.target.checked)}
                className="mt-1 h-5 w-5 shrink-0 accent-[#1a3d2b]"
              />
              <span className="text-[#1a3d2b]">
                {option.label}
                {option.description ? (
                  <span className="block text-sm text-[#5a6e62]">
                    {option.description}
                  </span>
                ) : null}
              </span>
            </label>
          );
        })}
      </div>
      {error ? (
        <p className="text-sm text-[#c0392b]" role="alert">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
