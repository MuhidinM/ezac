"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { apiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";

type ResourceState<T> = {
  key: string | null;
  data?: T;
  error?: ApiError | null;
};

/**
 * Fetch a JSON resource from our BFF. Keeps the previous data while a reload
 * is in flight, and sends the user to login when the session has expired.
 * Pass `null` to skip fetching.
 */
export function useResource<T>(path: string | null) {
  const router = useRouter();
  const pathname = usePathname();
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
          router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
          return;
        }
        const apiError =
          error instanceof ApiError ? error : new ApiError("Something went wrong", 500);
        setState((prev) => ({ key, data: prev.data, error: apiError }));
      });

    return () => {
      cancelled = true;
    };
  }, [key, path, pathname, router]);

  const reload = useCallback(() => setNonce((value) => value + 1), []);
  const mutate = useCallback(
    (data: T) => setState((prev) => ({ ...prev, data })),
    [],
  );

  return {
    data: state.data,
    error: state.key === key ? (state.error ?? null) : null,
    isLoading: key !== null && state.key !== key,
    reload,
    mutate,
  };
}
