"use client";

import { cn } from "@/lib/utils";

import { formatCurrency } from "../utils";

type CurrencyInputProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
};

export function CurrencyInput({
  id,
  value,
  onChange,
  placeholder = "0",
  className,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedby,
}: CurrencyInputProps) {
  return (
    <div className="relative">
      <input
        id={id}
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(formatCurrency(e.target.value))}
        placeholder={placeholder}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedby}
        className={cn(
          "min-h-[48px] w-full rounded-xl border border-[#1a3d2b]/20 bg-white px-4 py-3 pr-14 text-base text-[#1a3d2b] outline-none transition focus:border-[#1a3d2b] focus:ring-2 focus:ring-[#1a3d2b]/20",
          className,
        )}
      />
      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-[#5a6e62]">
        ETB
      </span>
    </div>
  );
}
