import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { LoaderCircle } from "lucide-react"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 data-loading:pointer-events-none data-loading:opacity-80 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        outline:
          "border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        /** Solid red: the confirm button of an action that can't be undone. */
        destructive:
          "bg-rose-600 text-white hover:bg-rose-700 focus-visible:border-rose-600 focus-visible:ring-rose-600/30",
        /** Outline button with red text: opens a destructive action (Reject, Revoke…). */
        "destructive-outline":
          "border-border bg-background text-rose-700 hover:bg-rose-50 hover:text-rose-800 aria-expanded:bg-rose-50 focus-visible:border-rose-600 focus-visible:ring-rose-600/20",
        /** Borderless red text, for row actions (Remove, Decline…). */
        "destructive-ghost":
          "text-rose-700 hover:bg-rose-50 hover:text-rose-800 aria-expanded:bg-rose-50 focus-visible:ring-rose-600/20",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        icon: "size-8",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    /**
     * Work in progress (saving, sending…): shows a spinner in place of the
     * leading icon, sets aria-busy and ignores clicks and form submits. The
     * button stays focusable (aria-disabled, not disabled), so keyboard focus
     * isn't lost while it works.
     */
    loading?: boolean
    /** Label while `loading` ("Saving…"); the normal label stays when omitted. */
    loadingText?: React.ReactNode
  }

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  loading = false,
  loadingText,
  children,
  onClick,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      data-loading={loading || undefined}
      className={cn(
        buttonVariants({ variant, size, className }),
        // The spinner takes the leading icon's place, so the width barely moves.
        loading && "[&>[data-spinner]+svg]:hidden"
      )}
      aria-busy={loading || undefined}
      aria-disabled={loading || undefined}
      onClick={
        loading
          ? (event: React.MouseEvent<HTMLButtonElement>) => {
              // Also cancels the submit of a type="submit" button (Enter in a field clicks it).
              event.preventDefault()
            }
          : onClick
      }
      {...props}
    >
      {loading && !asChild ? (
        <>
          <LoaderCircle data-spinner="" aria-hidden="true" className="animate-spin" />
          {loadingText ?? children}
        </>
      ) : (
        children
      )}
    </Comp>
  )
}

export { Button, buttonVariants }
export type { ButtonProps }
