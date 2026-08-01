"use client";

import { cn } from "@/lib/utils";

import { formatCurrency } from "../utils";

type CurrencyInputProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  formatOnBlur?: boolean;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
};

export function CurrencyInput({
  id,
  value,
  onChange,
  placeholder = "0",
  className,
  formatOnBlur = false,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedby,
}: CurrencyInputProps) {
  function handleChange(raw: string) {
    if (formatOnBlur) {
      onChange(raw.replace(/[^\d.]/g, ""));
    } else {
      onChange(formatCurrency(raw));
    }
  }

  function handleBlur() {
    if (formatOnBlur && value) {
      onChange(formatCurrency(value));
    }
  }

  return (
    <div className="relative">
      <input
        id={id}
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleBlur}
        placeholder={placeholder}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedby}
        className={cn("form-input pr-14", className)}
      />
      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-black/50">
        ETB
      </span>
    </div>
  );
}
