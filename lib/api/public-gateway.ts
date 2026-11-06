import "server-only";

import { gatewayRequest } from "@/lib/api/gateway";
import { UPSTREAM_FILE_TIMEOUT_MS } from "@/lib/api/upstream";

/** A gateway endpoint that needs no access token (registration, set-password). */
export async function publicGatewayRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  return gatewayRequest<T>(path, { ...init, label: "public-gateway" });
}

export async function publicGatewayMultipart<T>(
  path: string,
  formData: FormData,
  extraHeaders?: HeadersInit,
): Promise<T> {
  return gatewayRequest<T>(path, {
    method: "POST",
    body: formData,
    headers: new Headers(extraHeaders),
    label: "public-gateway",
    timeoutMs: UPSTREAM_FILE_TIMEOUT_MS,
  });
}
