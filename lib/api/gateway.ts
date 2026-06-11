import { getApiBaseUrl } from "@/lib/api/config";
import { ApiError } from "@/lib/api/errors";
import type { ApiEnvelope } from "@/lib/api/types";

type GatewayRequestOptions = RequestInit & {
  accessToken?: string;
};

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
    throw new ApiError(
      envelope.message ?? "Request failed",
      response.status || 400,
    );
  }

  return envelope.data;
}
