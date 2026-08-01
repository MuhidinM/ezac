import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type FormFieldProps = {
  label: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
  className?: string;
};

export function FormField({
  label,
  htmlFor,
  required,
  error,
  children,
  className,
}: FormFieldProps) {
  const errorId = error && htmlFor ? `${htmlFor}-error` : undefined;

  return (
    <div className={cn("space-y-1.5", className)}>
      <label
        htmlFor={htmlFor}
        className="block text-base font-medium text-[#1a3d2b]"
      >
        {label}
        {required ? <span className="text-[#c0392b]"> *</span> : null}
      </label>
      {children}
      {error ? (
        <p id={errorId} className="text-sm text-[#c0392b]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
