"use client"

import * as React from "react"

import { useFieldControl } from "@/components/ui/field-context"
import { cn } from "@/lib/utils"

/** Inside a dashboard FormField it picks up the label, hint/error and required state. */
function Input({ className, type, ...rest }: React.ComponentProps<"input">) {
  const props = useFieldControl(rest)
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Input }
