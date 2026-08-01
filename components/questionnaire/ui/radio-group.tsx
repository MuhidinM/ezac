"use client";

import { cn } from "@/lib/utils";

type RadioOption = {
  value: string;
  label: string;
};

type RadioGroupProps = {
  name: string;
  label: string;
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
  variant?: "default" | "button";
  buttonColors?: Record<string, string>;
};

export function RadioGroup({
  name,
  label,
  options,
  value,
  onChange,
  error,
  variant = "default",
  buttonColors,
}: RadioGroupProps) {
  return (
    <fieldset className="space-y-2">
      <legend className="form-label text-base font-medium">{label}</legend>
      <div
        role="radiogroup"
        aria-label={label}
        aria-invalid={!!error}
        className={cn(
          variant === "button" ? "grid gap-2 sm:grid-cols-2" : "space-y-2",
        )}
      >
        {options.map((option) => {
          const id = `${name}-${option.value}`;
          const checked = value === option.value;
          const buttonColor = buttonColors?.[option.value];

          if (variant === "button") {
            return (
              <label
                key={option.value}
                htmlFor={id}
                className={cn(
                  "flex min-h-[48px] cursor-pointer items-center justify-center rounded-xl border-2 px-4 py-3 text-base font-medium transition",
                  checked
                    ? buttonColor ?? "border-[#007050] bg-[#007050] text-white"
                    : "border-black/10 bg-white text-[#001539] hover:border-black/25",
                )}
              >
                <input
                  type="radio"
                  id={id}
                  name={name}
                  value={option.value}
                  checked={checked}
                  onChange={() => onChange(option.value)}
                  className="sr-only"
                />
                {option.label}
              </label>
            );
          }

          return (
            <label
              key={option.value}
              htmlFor={id}
              className={cn(
                "flex min-h-[48px] cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-base transition",
                checked
                  ? "border-[#007050] bg-[rgba(0,112,80,0.06)]"
                  : "border-black/10 bg-white hover:border-black/20",
              )}
            >
              <input
                type="radio"
                id={id}
                name={name}
                value={option.value}
                checked={checked}
                onChange={() => onChange(option.value)}
                className="h-5 w-5 shrink-0 accent-[#007050]"
              />
              <span className="text-[#001539]">{option.label}</span>
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
