"use client";

import type { ReactNode } from "react";
import { RotateCw } from "lucide-react";

import { SignInAgainButton } from "@/components/auth/sign-in-again";
import { InlineAlert } from "@/components/dashboard/inline-alert";
import { Button } from "@/components/ui/button";
import { errorMessage, errorReference, isSessionEnded } from "@/lib/api/errors";

/**
 * The standard way to show a failed load or save. Pass the error itself (an
 * ApiError from apiClient/useResource, or anything thrown):
 * - the message is the server's, or `fallback` for unexpected errors;
 * - an ended session (401) offers "Sign in again" (a new tab, so this page
 *   keeps its unsaved work) and calls `onRetry` once signed in;
 * - otherwise `onRetry` adds a Retry button;
 * - a failure on our side (5xx) shows the request reference for support.
 * Renders nothing when `error` is null/undefined.
 */
export function ErrorAlert({
  error,
  fallback = "Something went wrong. Try again.",
  title,
  onRetry,
  retryLabel = "Retry",
  className,
}: {
  error: unknown;
  fallback?: string;
  title?: ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}) {
  if (error === null || error === undefined) return null;

  const action = isSessionEnded(error) ? (
    <SignInAgainButton onSignedIn={onRetry} />
  ) : onRetry ? (
    <Button type="button" variant="outline" size="sm" onClick={onRetry}>
      <RotateCw />
      {retryLabel}
    </Button>
  ) : undefined;

  return (
    <InlineAlert
      tone="error"
      title={title}
      action={action}
      reference={errorReference(error)}
      className={className}
    >
      {errorMessage(error, fallback)}
    </InlineAlert>
  );
}
