"use client"

import * as React from "react"
import { EyeIcon, EyeOffIcon } from "lucide-react"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type PasswordInputProps = Omit<React.ComponentProps<"input">, "type"> & {
  /** Button labels, for pages in another language. */
  showLabel?: string
  hideLabel?: string
}

/**
 * A password field with an eye button that shows or hides what was typed, so
 * people can check a password before they send it. The button never takes
 * focus from the field on click (mouse or touch), so typing carries on, and it
 * stays reachable by keyboard. Inside a dashboard FormField it picks up the
 * label, hint and error like Input.
 */
function PasswordInput({
  className,
  showLabel = "Show password",
  hideLabel = "Hide password",
  disabled,
  ...rest
}: PasswordInputProps) {
  const [visible, setVisible] = React.useState(false)
  const label = visible ? hideLabel : showLabel
  const Icon = visible ? EyeOffIcon : EyeIcon

  return (
    <div className="relative">
      <Input
        {...rest}
        type={visible ? "text" : "password"}
        disabled={disabled}
        // Browsers must not offer to correct or capitalise a visible password.
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        className={cn(className, "pe-11")}
      />
      <button
        type="button"
        onClick={() => setVisible((value) => !value)}
        onMouseDown={(event) => event.preventDefault()}
        disabled={disabled}
        // One signal for screen readers: a fixed name, with pressed on or off.
        aria-label={showLabel}
        aria-pressed={visible}
        title={label}
        className="absolute inset-y-0 end-0 flex w-11 items-center justify-center rounded-e-xl text-black/50 transition-colors hover:text-brand focus-visible:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:pointer-events-none disabled:opacity-50"
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  )
}

export { PasswordInput }
