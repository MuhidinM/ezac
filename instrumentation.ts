import type { Instrumentation } from "next";

import { logEvent } from "./lib/api/log";

/**
 * Server-side observability with no third-party SDK: pm2 keeps stdout/stderr,
 * so every failed request becomes one JSON line there that can be grepped by
 * route, release or digest (the digest is what users see as the error
 * reference). Request headers, cookies and bodies are never logged. Errors in
 * the browser arrive through /bff/client-error (see instrumentation-client.ts).
 */

const MAX_MESSAGE_LENGTH = 300;

/** "/causes?status=closed" → "/causes": query strings can carry personal data. */
function pathWithoutQuery(path: string): string {
  const end = path.search(/[?#]/);
  return (end === -1 ? path : path.slice(0, end)).slice(0, 300);
}

/**
 * Called once when the server starts. A missing or invalid gateway address
 * makes every staff action and public figure fail, so say so loudly at
 * startup instead of only in individual request errors. Never throws: a
 * crashing register() would stop the public site from serving at all.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  if (process.env.NODE_ENV !== "production") return;

  try {
    // Throws in production when API_BASE_URL is missing or not an http(s) URL.
    const { getApiBaseUrl } = await import("./lib/api/config");
    getApiBaseUrl();
  } catch (error) {
    const problem = (error instanceof Error ? error.message : String(error)).replace(/\.?$/, ".");
    logEvent("fatal", "startup_config", {
      message: `${problem} Fix it in the deploy environment or .env.production, then restart the app.`,
    });
  }
}

export const onRequestError: Instrumentation.onRequestError = (error, request, context) => {
  const err = error instanceof Error ? error : null;
  const digest =
    typeof error === "object" && error !== null && "digest" in error
      ? String((error as { digest: unknown }).digest)
      : undefined;

  logEvent("error", "request_error", {
    method: request.method,
    path: pathWithoutQuery(request.path),
    routePath: context.routePath,
    routeType: context.routeType,
    error: err?.name ?? typeof error,
    message: (err?.message ?? String(error)).slice(0, MAX_MESSAGE_LENGTH),
    digest,
  });
};
