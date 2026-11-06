"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";

import { useFieldControl } from "@/components/ui/field-context";
import { cn } from "@/lib/utils";

/**
 * Styled native <select>; keeps mobile pickers and form semantics. Inside a
 * dashboard FormField it picks up the label, hint/error and required state.
 */
function NativeSelect({ className, ...rest }: React.ComponentProps<"select">) {
  const props = useFieldControl(rest);
  return (
    <div className="relative">
      <select
        data-slot="native-select"
        className={cn(
          "flex h-9 w-full appearance-none rounded-md border border-input bg-white py-1 pr-8 pl-3 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20",
          className,
        )}
        {...props}
      />
      <ChevronDown aria-hidden="true" className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-black/40" />
    </div>
  );
}

export { NativeSelect };
