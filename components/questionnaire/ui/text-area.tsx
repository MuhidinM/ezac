"use client";

import { cn } from "@/lib/utils";

type TextAreaProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
};

export function TextArea({
  id,
  value,
  onChange,
  placeholder,
  rows = 4,
  className,
}: TextAreaProps) {
  return (
    <textarea
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className={cn(
        "w-full rounded-xl border border-[#1a3d2b]/20 bg-white px-4 py-3 text-base text-[#1a3d2b] outline-none transition focus:border-[#1a3d2b] focus:ring-2 focus:ring-[#1a3d2b]/20",
        className,
      )}
    />
  );
}
