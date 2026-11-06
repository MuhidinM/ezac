import "server-only";

import { STATUS_CODES } from "node:http";

import { getApiBaseUrl } from "@/lib/api/config";
import { ApiError, parseFieldErrors } from "@/lib/api/errors";
import { logEvent, oneLine } from "@/lib/api/log";
import { logGatewayUnreachable } from "@/lib/api/network-error";

/**
 * The one way the server talks to the gateway: every BFF route goes through
 * upstreamFetch, so timeouts, request ids, error messages and logs behave the
 * same on every screen.
 */

/**
 * JSON calls give up after this long (undici's own default is 5 minutes).
 * Report and analytics queries can take several seconds on a busy day, so
 * this leaves room for them while still freeing the request when the gateway hangs.
 */
export const UPSTREAM_TIMEOUT_MS = 30_000;
/** Uploads and files get longer: the body itself takes time to send. */
export const UPSTREAM_FILE_TIMEOUT_MS = 60_000;

export const UPSTREAM_MESSAGES = {
  unreachable: "The service is not responding. Try again in a moment.",
  timeout: "The service did not answer in time. Try again.",
  serverError: "Something went wrong on our side. Try again in a moment.",
  unreadable: "The service sent an answer we couldn't read. Try again in a moment.",
} as const;

export function newRequestId(): string {
  return crypto.randomUUID();
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

export type UpstreamCall = {
  response: Response;
  requestId: string;
  /** Tag for server logs. */
  label: string;
  method: string;
  /** Upstream path without the query string: queries carry search terms, which are personal data. */
  path: string;
  /**
   * Stops the timeout clock. Call it once the body has been read, or right
   * before handing the body to the browser as a stream (a slow download must
   * not be cut off).
   */
  settle: () => void;
  timedOut: () => boolean;
};

type UpstreamOptions = {
  label: string;
  requestId?: string;
  timeoutMs?: number;
};

function isTimeoutError(error: unknown): boolean {
  return (error as { name?: string } | null)?.name === "TimeoutError";
}

function failure(call: Omit<UpstreamCall, "response">, error: unknown, timedOut: boolean): ApiError {
  if (timedOut || isTimeoutError(error)) {
    logEvent("error", "gateway_timeout", {
      label: call.label,
      requestId: call.requestId,
      method: call.method,
      path: call.path,
    });
    return new ApiError(UPSTREAM_MESSAGES.timeout, 504, [], null, null, call.requestId);
  }
  logGatewayUnreachable(call.label, error, call.requestId);
  return new ApiError(UPSTREAM_MESSAGES.unreachable, 502, [], null, null, call.requestId);
}

/**
 * fetch() against the gateway with a timeout and an X-Request-Id header.
 * `path` is the gateway path, with its query string if any.
 *
 * Throws ApiError 502 (unreachable) or 504 (timed out), already logged.
 * Upstream HTTP errors are returned as a normal response.
 */
export async function upstreamFetch(
  path: string,
  init: RequestInit = {},
  options: UpstreamOptions,
): Promise<UpstreamCall> {
  const requestId = options.requestId ?? newRequestId();
  const timeoutMs =
    options.timeoutMs ?? (init.body instanceof FormData ? UPSTREAM_FILE_TIMEOUT_MS : UPSTREAM_TIMEOUT_MS);
  const url = new URL(`${getApiBaseUrl()}${path}`);
  const method = (init.method ?? "GET").toUpperCase();

  const headers = new Headers(init.headers);
  // A fetch cached by Next (next.revalidate) keys on its headers, so a unique
  // id there would make every call a cache miss.
  const cached = !!init.next;
  if (!cached) headers.set("X-Request-Id", requestId);

  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort(new DOMException(`No answer within ${timeoutMs} ms`, "TimeoutError"));
  }, timeoutMs);

  const call = {
    requestId,
    label: options.label,
    method,
    path: url.pathname,
    settle: () => clearTimeout(timer),
    timedOut: () => timedOut,
  };

  try {
    const response = await fetch(url, {
      ...init,
      method,
      headers,
      signal: controller.signal,
      // Data for one user must never land in Next's shared data cache.
      ...(cached || init.cache ? {} : { cache: "no-store" as const }),
    });
    return { ...call, response };
  } catch (error) {
    call.settle();
    throw failure(call, error, timedOut);
  }
}

export type UpstreamBody =
  | { kind: "empty" }
  | { kind: "json"; value: unknown }
  | { kind: "invalid" };

/** Reads the whole upstream body (within the timeout) and parses it as JSON. */
export async function readUpstreamJson(call: UpstreamCall): Promise<UpstreamBody> {
  let text: string;
  try {
    text = await call.response.text();
  } catch (error) {
    throw failure(call, error, call.timedOut());
  } finally {
    call.settle();
  }

  if (!text.trim()) return { kind: "empty" };
  try {
    return { kind: "json", value: JSON.parse(text) as unknown };
  } catch {
    return { kind: "invalid" };
  }
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/** Machine-readable codes like BANK_UNAVAILABLE are safe to show; free text from a 5xx is not. */
function safeCode(value: unknown): string | null {
  return typeof value === "string" && /^[A-Z][A-Z0-9_]{1,63}$/.test(value) ? value : null;
}

/**
 * Logs an upstream failure: method, path without the query, status, request
 * ids and the upstream message cut to 200 characters. Never the bodies.
 */
export function logUpstreamFailure(call: UpstreamCall, body: unknown, note?: string) {
  const record = isRecord(body) ? body : {};
  const upstreamId = text(record.requestId);
  const message = text(record.message) ?? text(record.error) ?? note ?? "(no message)";
  logEvent("error", "gateway_error", {
    label: call.label,
    requestId: call.requestId,
    upstreamRequestId: upstreamId ? oneLine(upstreamId, 100) : undefined,
    method: call.method,
    path: call.path,
    status: call.response.status,
    message: oneLine(message, 200),
  });
}

export function fallbackMessage(status: number): string {
  switch (status) {
    case 400:
    case 422:
      return "Some details weren't accepted. Check what you entered and try again.";
    case 401:
      return "Your session has ended. Sign in again.";
    case 403:
      return "Your account doesn't have access to this.";
    case 404:
      return "We couldn't find that. It may have been removed.";
    case 409:
      return "This was changed by someone else. Reload and try again.";
    case 413:
      return "The files are too large. Send at most 25 MB at a time.";
    case 429:
      return "Too many requests. Wait a moment and try again.";
    default:
      return status >= 500 ? UPSTREAM_MESSAGES.serverError : "The request didn't go through. Try again.";
  }
}

/** A user-facing message from a 4xx body; HTTP reason phrases ("Forbidden") don't count. */
function clientMessage(record: Record<string, unknown>, status: number): string {
  const message = text(record.message);
  if (message && message !== "No message available") return message;
  const error = text(record.error);
  if (error && error !== STATUS_CODES[status]) return error;
  return fallbackMessage(status);
}

/**
 * Turns an upstream error answer into an ApiError for the browser.
 * 4xx: the upstream message, field errors, data and code pass through (they
 * are validation feedback). 5xx: a fixed message plus the request id; the
 * upstream text only goes to the server log.
 */
export function upstreamError(call: UpstreamCall, body: unknown, status = call.response.status): ApiError {
  const record = isRecord(body) ? body : {};

  if (status >= 500) {
    logUpstreamFailure(call, body);
    const code = safeCode(record.code) ?? safeCode(record.errorCode) ?? safeCode(record.message);
    return new ApiError(UPSTREAM_MESSAGES.serverError, status, [], null, code, call.requestId);
  }

  const code = text(record.code) ?? text(record.errorCode);
  return new ApiError(
    clientMessage(record, status),
    status,
    parseFieldErrors(record.errors),
    record.data ?? null,
    code,
    call.requestId,
  );
}

/** A 2xx answer we can't use (not JSON, or not our envelope). Logged, then 502. */
export function unreadableAnswer(call: UpstreamCall): ApiError {
  logUpstreamFailure(call, null, "unreadable answer");
  return new ApiError(UPSTREAM_MESSAGES.unreadable, 502, [], null, null, call.requestId);
}

/**
 * Reads the gateway's `{ success, data }` envelope and returns `data`.
 * An empty 2xx body (e.g. 204) gives null. Throws ApiError otherwise.
 */
export async function readEnvelope<T>(call: UpstreamCall): Promise<T> {
  const body = await readUpstreamJson(call);
  const value = body.kind === "json" ? body.value : null;

  if (!call.response.ok) throw upstreamError(call, value);
  if (body.kind === "empty") return null as T;
  if (!isRecord(value)) throw unreadableAnswer(call);
  // A 2xx that says success: false carries a user-facing message, like a 4xx.
  if (value.success !== true) throw upstreamError(call, value);
  return value.data as T;
}
