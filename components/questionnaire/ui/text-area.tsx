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
      className={cn("form-input min-h-[120px] resize-y py-3", className)}
    />
  );
}
