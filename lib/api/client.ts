import type { ApiEnvelope } from "@/lib/api/types";
import { ApiError } from "@/lib/api/errors";

export async function apiClient<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
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
    );
  }

  return envelope.data;
}
