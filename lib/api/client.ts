import { ApiError, parseFieldErrors } from "@/lib/api/errors";

type Envelope = {
  success?: unknown;
  data?: unknown;
  message?: unknown;
  errors?: unknown;
  code?: unknown;
  errorCode?: unknown;
  requestId?: unknown;
};

const OFFLINE_MESSAGE = "No connection. Check your network and try again.";

function fallbackMessage(status: number): string {
  if (status === 401) return "Your session has ended. Sign in again.";
  if (status === 403) return "Your account doesn't have access to this.";
  if (status === 404) return "We couldn't find that. It may have been removed.";
  if (status === 413) return "The files are too large. Send at most 25 MB at a time.";
  if (status === 502 || status === 503 || status === 504) {
    return "The service is not responding. Try again in a moment.";
  }
  if (status >= 500) return "Something went wrong on our side. Try again in a moment.";
  return "The request didn't go through. Try again.";
}

function text(value: unknown): string | null {
  return typeof value === "string" && value ? value : null;
}

/** The parsed body: an object, null for an empty or JSON-null body, undefined when unreadable. */
function parseBody(raw: string): Envelope | null | undefined {
  if (!raw.trim()) return null;
  try {
    const value = JSON.parse(raw) as unknown;
    if (value === null) return null;
    return typeof value === "object" && !Array.isArray(value) ? (value as Envelope) : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Call our BFF and return the envelope's `data`. Throws ApiError:
 * status 0 when there is no connection, otherwise the server's message,
 * field errors, code and request id. A 2xx with no JSON body (e.g. 204)
 * returns null.
 */
export async function apiClient<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  let response: Response;
  let raw: string;
  try {
    response = await fetch(path, {
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
    raw = await response.text();
  } catch (error) {
    // A caller that cancels its own request can tell that apart from offline.
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError(OFFLINE_MESSAGE, 0);
  }

  const envelope = parseBody(raw);
  const requestId = text(envelope?.requestId) ?? response.headers.get("X-Request-Id");

  if (response.ok && (envelope === null || envelope === undefined)) {
    return null as T;
  }

  if (!response.ok || !envelope || envelope.success !== true) {
    const status = response.status || 400;
    const code = text(envelope?.code) ?? text(envelope?.errorCode);
    if (status === 403 && code === "PASSWORD_CHANGE_REQUIRED" && typeof window !== "undefined") {
      // The BFF has set the gate cookie; every page now leads to the change form.
      window.location.assign("/login/change-password");
    }
    throw new ApiError(
      text(envelope?.message) ?? fallbackMessage(status),
      status,
      parseFieldErrors(envelope?.errors),
      envelope?.data ?? null,
      code,
      requestId,
    );
  }

  return envelope.data as T;
}
