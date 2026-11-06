"use client";

import { useEffect, useState } from "react";
import { LogIn } from "lucide-react";

import { currentPortalPath, onSignedInElsewhere, openResumeSignIn } from "@/components/auth/resume-sign-in";
import { Button, type ButtonProps } from "@/components/ui/button";
import { sendToSignIn } from "@/lib/auth/client-session";
import { clearSessionCache, fetchSession } from "@/lib/auth/use-session";

/**
 * The recovery for "Your session has ended. Sign in again.": signs in again
 * in a new tab that closes itself afterwards, so the form on this page keeps
 * what was typed; then says so and calls `onSignedIn` (e.g. retry). If the
 * browser won't open a tab, it signs in here and comes back to this page.
 */
export function SignInAgainButton({
  onSignedIn,
  size = "sm",
  variant = "outline",
  className,
}: {
  onSignedIn?: () => void;
  size?: ButtonProps["size"];
  variant?: ButtonProps["variant"];
  className?: string;
}) {
  const [opened, setOpened] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  // Any tab signing in counts, whether or not it was opened from here.
  useEffect(
    () =>
      onSignedInElsewhere(() => {
        setSignedIn(true);
        // This tab's cached session is the ended one; read the new one.
        clearSessionCache();
        void fetchSession({ force: true });
        onSignedIn?.();
      }),
    [onSignedIn],
  );

  if (signedIn) {
    return (
      <span role="status" className="shrink-0 self-center text-sm font-medium">
        Signed in again. Try once more.
      </span>
    );
  }

  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      className={className}
      onClick={() => {
        // A second click brings the sign-in tab back if it went behind this one.
        if (openResumeSignIn()) setOpened(true);
        else void sendToSignIn(currentPortalPath(), { reason: "ended" });
      }}
    >
      <LogIn />
      {opened ? "Back to the sign-in tab" : "Sign in again"}
    </Button>
  );
}
