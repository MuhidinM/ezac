const DEV_FALLBACK_URL = "http://localhost:8090";
const EXAMPLE = "e.g. https://gateway.example";

let warnedAboutFallback = false;
let warnedAboutPlainHttp = false;

/** `next build` runs in CI and on the server, often without API_BASE_URL. */
function isBuildPhase(): boolean {
  return process.env.NEXT_PHASE === "phase-production-build";
}

function isLoopback(hostname: string): boolean {
  const host = hostname.replace(/^\[|\]$/g, "").toLowerCase();
  return (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host === "::1" ||
    /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)
  );
}

function configuredUrl(): string | null {
  const value = process.env.API_BASE_URL?.trim().replace(/\/+$/, "");
  return value ? value : null;
}

/**
 * The gateway origin for server-side calls.
 *
 * - Production runtime: API_BASE_URL is required. A missing or malformed value
 *   throws, so a bad deploy fails loudly instead of calling localhost.
 * - `next build` and development: falls back to localhost with a one-time
 *   warning, so the build never needs the gateway.
 */
export function getApiBaseUrl(): string {
  const configured = configuredUrl();
  const production = process.env.NODE_ENV === "production";

  if (!configured) {
    if (production && !isBuildPhase()) {
      throw new Error(`API_BASE_URL is not set. Set it to the gateway URL, ${EXAMPLE}`);
    }
    if (!warnedAboutFallback) {
      warnedAboutFallback = true;
      console.warn(
        `[config] API_BASE_URL is not set; using ${DEV_FALLBACK_URL}. Set it to the gateway URL, ${EXAMPLE}`,
      );
    }
    return DEV_FALLBACK_URL;
  }

  let url: URL | null = null;
  try {
    url = new URL(configured);
  } catch {
    // handled below
  }
  if (!url || (url.protocol !== "https:" && url.protocol !== "http:")) {
    const message = `API_BASE_URL must be a full http(s) URL, ${EXAMPLE} (it is "${configured}")`;
    if (isBuildPhase()) {
      console.warn(`[config] ${message}; using ${DEV_FALLBACK_URL} for the build.`);
      return DEV_FALLBACK_URL;
    }
    throw new Error(message);
  }

  // Tokens and personal data travel on this connection.
  if (production && !warnedAboutPlainHttp && url.protocol === "http:" && !isLoopback(url.hostname)) {
    warnedAboutPlainHttp = true;
    console.warn(
      `[config] API_BASE_URL uses plain http:// to ${url.host}. Access tokens and personal data cross that link unencrypted; use https://.`,
    );
  }

  return configured;
}

/** The gateway URL for log lines. Never throws, unlike getApiBaseUrl(). */
export function describeApiBaseUrl(): string {
  return configuredUrl() ?? "(API_BASE_URL is not set)";
}
