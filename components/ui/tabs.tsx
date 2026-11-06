"use client"

import * as React from "react"
import { Tabs as TabsPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * Tabs with the WAI-ARIA keyboard model (Radix): one Tab stop for the tab
 * row, Left/Right arrows move between tabs (mirrored in RTL), Home/End jump
 * to the first/last, and each tab is wired to its panel (aria-selected,
 * aria-controls, aria-labelledby).
 *
 * Filter tabs over one list (status tabs) render a single
 * `<TabsContent value={value}>` around the shared list; see the usage notes
 * in the kit handoff. Tabs that load data on change can pass
 * `activationMode="manual"` so arrowing across them doesn't fetch each one.
 */
function Tabs({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return <TabsPrimitive.Root data-slot="tabs" className={cn("flex flex-col", className)} {...props} />
}

/**
 * The tab row: an underlined strip that scrolls sideways on narrow screens.
 * Its default padding and bottom rule suit the top of a flush Panel; pass
 * className="p-0 shadow-none" to drop them.
 */
function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        // The rule under the tabs is an inset shadow, so the active tab's underline
        // covers it without overflowing (which would add a vertical scrollbar).
        "flex gap-1 overflow-x-auto overflow-y-hidden px-3 pt-2 shadow-[inset_0_-1px_0_rgb(0_0_0/0.06)] [scrollbar-width:thin]",
        className
      )}
      {...props}
    />
  )
}

function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-t-md border-b-2 border-transparent px-3 py-2.5 text-sm whitespace-nowrap text-black/60 transition outline-none hover:text-navy focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset disabled:pointer-events-none disabled:opacity-50 data-[state=active]:border-brand data-[state=active]:font-medium data-[state=active]:text-navy [&_svg]:size-4 [&_svg]:shrink-0",
        className
      )}
      {...props}
    />
  )
}

/** The panel for one tab. Focusable (Tab from the tab row lands here), with a ring only for keyboard focus. */
function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset", className)}
      {...props}
    />
  )
}

/** A count after a tab label ("Open 12"); screen readers read it as part of the tab's name. */
function TabsCount({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="tabs-count"
      className={cn(
        "rounded-full bg-black/[0.05] px-1.5 py-px text-xs font-medium text-black/60 tabular-nums",
        className
      )}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, TabsCount }
