import { readEnvelope, upstreamFetch } from "@/lib/api/upstream";

export type GatewayRequestOptions = RequestInit & {
  accessToken?: string;
  /** Tag for server logs. */
  label?: string;
  timeoutMs?: number;
  requestId?: string;
};

/**
 * Call a gateway endpoint that answers with the `{ success, data }` envelope
 * and return `data`. Throws ApiError with a user-facing message: 4xx text
 * passes through, 5xx and network failures get a fixed message and are
 * logged with a request id (see lib/api/upstream.ts).
 */
export async function gatewayRequest<T>(
  path: string,
  options: GatewayRequestOptions = {},
): Promise<T> {
  const { accessToken, label = "gateway", timeoutMs, requestId, ...init } = options;
  const headers = new Headers(init.headers);

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  // FormData needs fetch to set the multipart boundary itself.
  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const call = await upstreamFetch(path, { ...init, headers }, { label, timeoutMs, requestId });
  return readEnvelope<T>(call);
}
