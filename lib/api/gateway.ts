import { getApiBaseUrl } from "@/lib/api/config";
import { ApiError } from "@/lib/api/errors";
import type { ApiEnvelope } from "@/lib/api/types";

type GatewayRequestOptions = RequestInit & {
  accessToken?: string;
};

/**
 * The gateway answers with the success envelope on happy paths, but framework
 * level failures (auth filters, unhandled exceptions) come back as
 * `{ status, error, path, requestId }`. Pull a usable message out of both.
 */
function errorMessageFrom(body: unknown, fallback: string): string {
  if (!body || typeof body !== "object") return fallback;

  const record = body as Record<string, unknown>;
  const message =
    typeof record.message === "string" && record.message.trim()
      ? record.message.trim()
      : typeof record.error === "string" && record.error.trim()
        ? record.error.trim()
        : fallback;

  return typeof record.requestId === "string" && record.requestId
    ? `${message} (request ${record.requestId})`
    : message;
}

export async function gatewayRequest<T>(
  path: string,
  options: GatewayRequestOptions = {},
): Promise<T> {
  const { accessToken, ...init } = options;
  const headers = new Headers(init.headers);

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  let envelope: ApiEnvelope<T> | null = null;

  try {
    envelope = (await response.json()) as ApiEnvelope<T>;
  } catch {
    throw new ApiError("Invalid response from API gateway", response.status || 502);
  }

  if (!response.ok || !envelope.success) {
    const status = response.status || 400;
    const message = errorMessageFrom(
      envelope,
      status >= 500 ? "Upstream service error" : "Request failed",
    );

    if (status >= 500) {
      console.error(`[gateway] ${status} ${path}: ${message}`);
    }

    throw new ApiError(message, status);
  }

  return envelope.data;
}
