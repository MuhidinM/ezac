"use client";

import { useState } from "react";

import { signOut } from "@/lib/auth/client-session";

/**
 * A text-style sign-out control for screens outside the dashboard (the forced
 * password change), so someone who signed in on the wrong account can leave.
 */
export function SignOutLink({ className }: { className?: string }) {
  const [isLeaving, setIsLeaving] = useState(false);

  return (
    <button
      type="button"
      disabled={isLeaving}
      onClick={() => {
        setIsLeaving(true);
        void signOut();
      }}
      className={
        className ??
        "font-medium text-brand underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none disabled:opacity-60"
      }
    >
      {isLeaving ? "Signing out..." : "Sign out"}
    </button>
  );
}
