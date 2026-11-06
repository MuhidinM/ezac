import {
  CLIENT_ERROR_PATH,
  scrubMessage,
  scrubPath,
  scrubStack,
  type ClientErrorReport,
  type ClientErrorSource,
} from "@/lib/api/client-error";

/**
 * Sends errors that happen in the browser to our own server log
 * (POST /bff/client-error), so a crash on a staff PC or a visitor's phone is
 * seen by someone. No third-party tracker. Reports are scrubbed here and again
 * on the server (lib/api/client-error.ts), sent without cookies, and capped
 * per page load. Reporting never throws.
 */

/** A page that loops on an error must not send a report per frame. */
const MAX_REPORTS_PER_PAGE = 5;

let sent = 0;
const seen = new Set<string>();

/** Errors that are no bug of ours, or that the page already handled and explained. */
export function isNoise(error: unknown, message: string, stack: string): boolean {
  if (/^Script error\.?$/i.test(message)) return true; // Cross-origin script: the browser hides the details.
  if (/ResizeObserver loop/i.test(message)) return true; // Harmless browser warning.
  if (/(?:chrome|moz|safari(?:-web)?)-extension:\/\//i.test(stack)) return true; // A browser extension.
  if (typeof error === "object" && error !== null) {
    const { name, status } = error as { name?: unknown; status?: unknown };
    if (name === "AbortError") return true;
    // An API answer: offline (0) and "signed out" (401) are expected, and the screen says so.
    if (name === "ApiError" && (status === 0 || status === 401)) return true;
  }
  return false;
}

/** The report for one error, scrubbed, or null when it isn't worth sending. */
export function buildClientErrorReport(
  error: unknown,
  source: ClientErrorSource,
  scope?: string,
  path?: string,
): ClientErrorReport | null {
  let name: string | undefined;
  let message: string;
  let stack = "";
  if (error instanceof Error) {
    name = error.name;
    message = error.message;
    stack = error.stack ?? "";
  } else if (typeof error === "string") {
    message = error;
  } else {
    // A rejected promise can carry anything; say what kind of thing it was.
    message = error === undefined || error === null ? String(error) : `Non-error ${typeof error} thrown`;
  }

  if (isNoise(error, message, stack)) return null;
  return {
    source,
    scope,
    name: name && /^[\w$.-]{1,60}$/.test(name) ? name : undefined,
    message: scrubMessage(message) || "(no message)",
    stack: stack ? scrubStack(stack) : undefined,
    path: path ? scrubPath(path) : undefined,
  };
}

export function reportClientError(error: unknown, source: ClientErrorSource, scope?: string): void {
  try {
    if (typeof window === "undefined" || sent >= MAX_REPORTS_PER_PAGE) return;
    const report = buildClientErrorReport(error, source, scope, window.location.pathname);
    if (!report) return;

    const key = `${report.source}|${report.name ?? ""}|${report.message}`;
    if (seen.has(key)) return;
    seen.add(key);
    sent += 1;

    void fetch(CLIENT_ERROR_PATH, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(report),
      // Still sent when the error made the user leave the page.
      keepalive: true,
      credentials: "omit",
      cache: "no-store",
    }).catch(() => undefined);
  } catch {
    // Reporting must never cause an error of its own.
  }
}

let installed = false;

/** Listens for uncaught errors and unhandled promise rejections on this page. */
export function installClientErrorReporting(): void {
  if (installed || typeof window === "undefined") return;
  installed = true;
  window.addEventListener("error", (event) => {
    reportClientError(event.error ?? event.message, "error");
  });
  window.addEventListener("unhandledrejection", (event) => {
    reportClientError(event.reason, "unhandledrejection");
  });
}
