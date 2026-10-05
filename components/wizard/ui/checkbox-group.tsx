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
      <legend className="form-label text-sm font-medium">{label}</legend>
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
                "flex min-h-10 cursor-pointer items-start gap-3 rounded-lg border px-3 py-2 text-sm transition",
                checked
                  ? "border-[#007050] bg-[rgba(0,112,80,0.06)]"
                  : "border-black/10 bg-white hover:border-black/20",
              )}
            >
              <input
                type="checkbox"
                id={id}
                checked={checked}
                onChange={(e) => onChange(option.value, e.target.checked)}
                className="mt-1 h-5 w-5 shrink-0 accent-[#007050]"
              />
              <span className="text-[#001539]">
                {option.label}
                {option.description ? (
                  <span className="block text-sm text-black/55">
                    {option.description}
                  </span>
                ) : null}
              </span>
            </label>
          );
        })}
      </div>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
