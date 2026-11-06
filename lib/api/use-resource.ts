"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { apiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { subscribeToConnection, useOnline } from "@/lib/api/online-status";
import { sendToSignIn } from "@/lib/auth/client-session";

type ResourceState<T> = {
  key: string | null;
  data?: T;
  error?: ApiError | null;
};

let redirectingToLogin = false;

/**
 * A full page load, not a client navigation, so the login page and the route
 * proxy start from the cleared session. Several resources can fail at once;
 * only the first one navigates.
 */
function sendToLogin() {
  if (redirectingToLogin) return;
  redirectingToLogin = true;
  // Also clears the cached session, saved drafts and setup tokens (shared
  // branch PCs) and drops any cookie the server left, so /login doesn't bounce back.
  void sendToSignIn(`${window.location.pathname}${window.location.search}`);
}

/**
 * Fetch a JSON resource from our BFF. Keeps the previous data while a reload
 * is in flight, and sends the user to login when the session has expired.
 * Other errors (offline, 503 sign-in service down, 403…) are returned for
 * the page to show. Pass `null` to skip fetching.
 *
 * A failed load is tried again by itself when the browser comes back online.
 * `offline` is true while the browser says it has no network; a load that
 * failed meanwhile is the status-0 "No connection" ApiError, which ErrorAlert
 * shows as is.
 */
export function useResource<T>(path: string | null) {
  const [nonce, setNonce] = useState(0);
  const [state, setState] = useState<ResourceState<T>>({ key: null });

  const key = path ? `${path}#${nonce}` : null;

  useEffect(() => {
    if (!path || !key) return;
    let cancelled = false;

    apiClient<T>(path)
      .then((data) => {
        if (!cancelled) setState({ key, data, error: null });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        if (error instanceof ApiError && error.status === 401) {
          sendToLogin();
          return;
        }
        const apiError =
          error instanceof ApiError
            ? error
            : new ApiError("Something went wrong. Try again.", 500);
        setState((prev) => ({ key, data: prev.data, error: apiError }));
      });

    return () => {
      cancelled = true;
    };
  }, [key, path]);

  const reload = useCallback(() => setNonce((value) => value + 1), []);

  const error = state.key === key ? (state.error ?? null) : null;
  const online = useOnline();

  // Back online: retry a load that failed. Loaded data is left alone, so the
  // page doesn't flash its skeleton on every reconnect.
  const failedRef = useRef(false);
  useEffect(() => {
    failedRef.current = error !== null;
  }, [error]);
  useEffect(() => {
    if (!path) return;
    return subscribeToConnection((isOnline) => {
      if (isOnline && failedRef.current) reload();
    });
  }, [path, reload]);

  const mutate = useCallback(
    (data: T) => setState((prev) => ({ ...prev, data })),
    [],
  );

  return {
    data: state.data,
    error,
    isLoading: key !== null && state.key !== key,
    offline: !online,
    reload,
    mutate,
  };
}
