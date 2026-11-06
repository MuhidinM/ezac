import { apiClient } from "@/lib/api/client";

/**
 * The registration steps' calls to /bff/register/*. They go through the
 * shared apiClient, so they behave like every other portal call: "No
 * connection" when offline (ApiError status 0), the server's own message,
 * field errors and request id on failure, and null for an empty success.
 */

/** apiClient spreads headers into an object, which would drop a Headers instance's entries. */
function plainHeaders(headers?: HeadersInit): Record<string, string> | undefined {
  return headers ? Object.fromEntries(new Headers(headers)) : undefined;
}

export function registerApiJson<T>(path: string, init?: RequestInit): Promise<T> {
  return apiClient<T>(path, { ...init, headers: plainHeaders(init?.headers) });
}

export function registerApiFormData<T>(path: string, formData: FormData, headers?: HeadersInit): Promise<T> {
  return apiClient<T>(path, { method: "POST", body: formData, headers: plainHeaders(headers) });
}
