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
      <legend className="text-base font-medium text-[#1a3d2b]">{label}</legend>
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
                    ? buttonColor ?? "border-[#1a3d2b] bg-[#1a3d2b] text-white"
                    : "border-[#1a3d2b]/20 bg-white text-[#1a3d2b] hover:border-[#1a3d2b]/40",
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
                  ? "border-[#1a3d2b] bg-[#1a3d2b]/5"
                  : "border-[#1a3d2b]/15 bg-white hover:border-[#1a3d2b]/30",
              )}
            >
              <input
                type="radio"
                id={id}
                name={name}
                value={option.value}
                checked={checked}
                onChange={() => onChange(option.value)}
                className="h-5 w-5 shrink-0 accent-[#1a3d2b]"
              />
              <span className="text-[#1a3d2b]">{option.label}</span>
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
