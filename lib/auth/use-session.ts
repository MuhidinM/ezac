"use client";

import { useEffect, useState } from "react";

import { apiClient } from "@/lib/api/client";
import type { SessionInfo } from "@/lib/api/types";

// The sidebar, topbar, and several pages all need the session on every
// navigation. Cache it so one dashboard view costs a single upstream /me call.
let cached: SessionInfo | null | undefined;
let inFlight: Promise<SessionInfo | null> | null = null;

export function clearSessionCache(): void {
  cached = undefined;
  inFlight = null;
}

export function fetchSession(options?: {
  force?: boolean;
}): Promise<SessionInfo | null> {
  if (options?.force) {
    cached = undefined;
    inFlight = null;
  } else {
    if (cached !== undefined) return Promise.resolve(cached);
    if (inFlight) return inFlight;
  }

  const request = apiClient<SessionInfo>("/api/auth/session")
    .then((session) => {
      cached = session;
      return session;
    })
    .catch(() => {
      cached = null;
      return null;
    })
    .finally(() => {
      inFlight = null;
    });

  inFlight = request;
  return request;
}

export function useSession(): {
  session: SessionInfo | null;
  isLoading: boolean;
} {
  const [session, setSession] = useState<SessionInfo | null>(cached ?? null);
  const [isLoading, setIsLoading] = useState(cached === undefined);

  useEffect(() => {
    let cancelled = false;

    void fetchSession().then((next) => {
      if (cancelled) return;
      setSession(next);
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return { session, isLoading };
}
