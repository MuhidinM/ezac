"use client";

import * as React from "react";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type SearchInputProps = Omit<React.ComponentProps<typeof Input>, "type"> & {
  /**
   * What the box searches ("Search beneficiaries"). Always the accessible
   * name; shown above the box only with `showLabel`, so the placeholder can
   * keep giving examples ("Name, phone or BIN").
   */
  label: string;
  showLabel?: boolean;
  /** Classes for the wrapper (width, flex); `className` styles the input. */
  wrapperClassName?: string;
};

/**
 * The list-page search box: magnifier icon, a real <label> (visually hidden
 * by default) and type="search", so Enter submits the surrounding form and
 * Esc clears it in most browsers. Put it in a <form role="search">.
 */
function SearchInput({ label, showLabel = false, wrapperClassName, className, id, ...props }: SearchInputProps) {
  const generated = React.useId();
  const inputId = id ?? `${generated}-search`;

  return (
    <div className={cn("min-w-0", wrapperClassName)}>
      <label
        htmlFor={inputId}
        className={showLabel ? "mb-1.5 block text-[13px] font-medium text-navy" : "sr-only"}
      >
        {label}
      </label>
      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-black/35"
        />
        <Input
          id={inputId}
          type="search"
          enterKeyHint="search"
          autoComplete="off"
          className={cn("bg-white pl-9", className)}
          {...props}
        />
      </div>
    </div>
  );
}

export { SearchInput };
export type { SearchInputProps };
