"use client";

import { useSyncExternalStore } from "react";

type ConnectionTarget = Pick<EventTarget, "addEventListener" | "removeEventListener">;

/**
 * Calls `onChange(true)` when the browser says it is back online and
 * `onChange(false)` when it goes offline. Returns the unsubscribe function.
 * The browser only knows about its own network link: a gateway that is down
 * still looks "online", so callers keep showing the request's own error.
 */
export function subscribeToConnection(
  onChange: (online: boolean) => void,
  target: ConnectionTarget = window,
): () => void {
  const handleOnline = () => onChange(true);
  const handleOffline = () => onChange(false);
  target.addEventListener("online", handleOnline);
  target.addEventListener("offline", handleOffline);
  return () => {
    target.removeEventListener("online", handleOnline);
    target.removeEventListener("offline", handleOffline);
  };
}

/** True unless the browser says it has no network (and on the server). */
export function isBrowserOnline(): boolean {
  return typeof navigator === "undefined" || navigator.onLine !== false;
}

const subscribe = (listener: () => void) => subscribeToConnection(listener);

/** The browser's online state, re-rendering when it changes. Server render: online. */
export function useOnline(): boolean {
  return useSyncExternalStore(subscribe, isBrowserOnline, () => true);
}
