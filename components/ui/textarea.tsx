"use client";

import * as React from "react";

import { useFieldControl } from "@/components/ui/field-context";
import { cn } from "@/lib/utils";

/** Inside a dashboard FormField it picks up the label, hint/error and required state. */
function Textarea({ className, ...rest }: React.ComponentProps<"textarea">) {
  const props = useFieldControl(rest);
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-20 w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
