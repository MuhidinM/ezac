"use client";

import { createContext, createElement, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from "react";

import { apiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import type { SessionInfo } from "@/lib/api/types";

// The sidebar, topbar, and several pages all need the session on every
// navigation. Cache it so one dashboard view costs a single upstream /me call,
// but only for a minute, so a role an administrator changes shows up without
// a reload.
const SESSION_TTL_MS = 60_000;

type SessionSnapshot = {
  session: SessionInfo | null;
  isLoading: boolean;
  /** The server said 401: the session is over and the user must sign in again. */
  signedOut: boolean;
  /**
   * The session couldn't be read (offline, sign-in service down) and there is
   * no earlier copy to show. Not the same as "no access": the page should
   * offer a retry. Reads are retried in the background meanwhile.
   */
  unavailable: boolean;
  /**
   * The session is the server's first guess from the access token (roles from
   * the token only), not yet confirmed by /bff/auth/session. Fine for menus
   * and names; don't show "no access" on it.
   */
  provisional: boolean;
};

const LOADING: SessionSnapshot = { session: null, isLoading: true, signedOut: false, unavailable: false, provisional: false };

/** Background retries while the session can't be read: 5 s, 15 s, then every 30 s. */
const RETRY_DELAYS_MS = [5_000, 15_000, 30_000];
let retryAttempt = 0;
let retryTimer: ReturnType<typeof setTimeout> | null = null;

function cancelRetry() {
  if (retryTimer) clearTimeout(retryTimer);
  retryTimer = null;
  retryAttempt = 0;
}

function scheduleRetry() {
  if (retryTimer || listeners.size === 0) return;
  const delay = RETRY_DELAYS_MS[Math.min(retryAttempt, RETRY_DELAYS_MS.length - 1)];
  retryAttempt += 1;
  retryTimer = setTimeout(() => {
    retryTimer = null;
    void fetchSession({ force: true });
  }, delay);
}

let snapshot: SessionSnapshot = LOADING;
let fetchedAt = 0;
let inFlight: Promise<SessionInfo | null> | null = null;
const listeners = new Set<() => void>();

function publish(next: SessionSnapshot) {
  snapshot = next;
  fetchedAt = Date.now();
  for (const listener of listeners) listener();
}

function isFresh() {
  return !snapshot.isLoading && Date.now() - fetchedAt < SESSION_TTL_MS;
}

/**
 * Forget the cached session so the next read asks the server again. Pages
 * already on screen keep what they show until that answer arrives.
 */
export function clearSessionCache(): void {
  fetchedAt = 0;
  inFlight = null;
}

/** Forget everything, including what is on screen (sign-out). */
export function resetSessionCache(): void {
  cancelRetry();
  snapshot = LOADING;
  fetchedAt = 0;
  inFlight = null;
}

export function fetchSession(options?: {
  force?: boolean;
}): Promise<SessionInfo | null> {
  if (!options?.force) {
    if (isFresh()) return Promise.resolve(snapshot.session);
    if (inFlight) return inFlight;
  }

  const request: Promise<SessionInfo | null> = apiClient<SessionInfo>("/bff/auth/session")
    .then((session) => {
      if (inFlight === request) {
        cancelRetry();
        publish({ session, isLoading: false, signedOut: false, unavailable: false, provisional: false });
      }
      return session;
    })
    .catch((error: unknown) => {
      if (inFlight !== request) return null;
      if (error instanceof ApiError && error.status === 401) {
        cancelRetry();
        publish({ session: null, isLoading: false, signedOut: true, unavailable: false, provisional: false });
        return null;
      }
      if (error instanceof ApiError && error.status === 403) {
        // Signed in, but the account may not use the portal.
        cancelRetry();
        publish({ session: null, isLoading: false, signedOut: false, unavailable: false, provisional: false });
        return null;
      }
      // Network trouble or a 503: keep the last good session rather than
      // hiding every menu, and try again in the background.
      publish({
        session: snapshot.session,
        isLoading: false,
        signedOut: false,
        unavailable: snapshot.session === null,
        provisional: false,
      });
      fetchedAt = 0;
      if (snapshot.session === null) scheduleRetry();
      return snapshot.session;
    })
    .finally(() => {
      if (inFlight === request) inFlight = null;
    });

  inFlight = request;
  return request;
}

function onVisible() {
  if (document.visibilityState === "visible" && !isFresh()) void fetchSession();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) document.addEventListener("visibilitychange", onVisible);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      document.removeEventListener("visibilitychange", onVisible);
      if (retryTimer) clearTimeout(retryTimer);
      retryTimer = null;
    }
  };
}

/**
 * The session the dashboard layout read from the access token, for this
 * render only. A React context, never module state: on the server, module
 * state is shared by every request (every user).
 */
const SessionSeedContext = createContext<SessionSnapshot | null>(null);

export function SessionSeedProvider({ session, children }: { session: SessionInfo | null; children: ReactNode }) {
  const seed = useMemo<SessionSnapshot | null>(
    () => (session ? { session, isLoading: false, signedOut: false, unavailable: false, provisional: true } : null),
    [session],
  );
  return createElement(SessionSeedContext.Provider, { value: seed }, children);
}

export function useSession(): SessionSnapshot {
  const seed = useContext(SessionSeedContext);
  // Until the server's answer arrives, show the seed instead of "loading".
  // The same object on the server, during hydration and after, so nothing
  // mismatches; once /bff/auth/session answers, the seed is never used again.
  const current = useSyncExternalStore(
    subscribe,
    () => (snapshot.isLoading && seed ? seed : snapshot),
    () => seed ?? LOADING,
  );

  // Each mount re-reads when the cached copy is older than the TTL; the answer
  // reaches every component using the hook, the sidebar included.
  useEffect(() => {
    if (!isFresh()) void fetchSession();
  }, []);

  return current;
}
