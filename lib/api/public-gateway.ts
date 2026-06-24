import { getApiBaseUrl } from "@/lib/api/config";
import { ApiError } from "@/lib/api/errors";
import type { ApiEnvelope } from "@/lib/api/types";

export async function publicGatewayRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);

  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
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
    throw new ApiError(
      "Invalid response from API gateway",
      response.status || 502,
    );
  }

  if (!response.ok || !envelope.success) {
    throw new ApiError(
      envelope.message ?? "Request failed",
      response.status || 400,
    );
  }

  return envelope.data;
}

export async function publicGatewayMultipart<T>(
  path: string,
  formData: FormData,
  extraHeaders?: HeadersInit,
): Promise<T> {
  const headers = new Headers(extraHeaders);
  return publicGatewayRequest<T>(path, {
    method: "POST",
    body: formData,
    headers,
  });
}
