import type { ApiEnvelope } from "@/lib/api/types";
import { ApiError, parseFieldErrors } from "@/lib/api/errors";

export async function apiClient<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      // FormData bodies need the browser to set the multipart boundary.
      ...(init?.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...init?.headers,
    },
    cache: "no-store",
  });

  let envelope: ApiEnvelope<T> | null = null;

  try {
    envelope = (await response.json()) as ApiEnvelope<T>;
  } catch {
    throw new ApiError("Invalid response from server", response.status || 502);
  }

  if (!response.ok || !envelope.success) {
    const fallback =
      response.status === 403
        ? "Insufficient permissions"
        : "Request failed";
    throw new ApiError(
      envelope.message ?? fallback,
      response.status || 400,
      parseFieldErrors(envelope.errors),
    );
  }

  return envelope.data;
}
