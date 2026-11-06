import { logEvent } from "@/lib/api/log";

/**
 * Receives Content-Security-Policy violation reports (see next.config.ts) and
 * writes one short JSON line per violation to the server log. Browsers send
 * these without cookies, so there is no auth. Only the blocked host, the
 * directive and the page path are logged: no query strings, no samples.
 */

const MAX_BODY_BYTES = 16 * 1024;
const MAX_REPORTS_PER_REQUEST = 10;
/** Caps log volume if a page loops or someone floods the endpoint. */
const MAX_LINES_PER_MINUTE = 120;

let windowStart = 0;
let linesInWindow = 0;

function allowLine(now: number): boolean {
  if (now - windowStart >= 60_000) {
    windowStart = now;
    linesInWindow = 0;
  }
  linesInWindow += 1;
  return linesInWindow <= MAX_LINES_PER_MINUTE;
}

/** Reads at most `limit` bytes; null when the body is larger. */
async function readCapped(request: Request, limit: number): Promise<string | null> {
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > limit) return null;
  if (!request.body) return "";

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) {
      await reader.cancel().catch(() => {});
      return null;
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

function text(value: unknown, max = 80): string | undefined {
  return typeof value === "string" && value ? value.slice(0, max) : undefined;
}

/** "https://maps.gstatic.com/x.js?key=…" → "maps.gstatic.com"; keywords like "inline" or "eval" stay as they are. */
function blockedHost(value: unknown): string | undefined {
  const raw = text(value, 2048);
  if (!raw) return undefined;
  try {
    const url = new URL(raw);
    return url.protocol === "http:" || url.protocol === "https:" || url.protocol === "ws:" || url.protocol === "wss:"
      ? url.host
      : url.protocol.replace(/:$/, "");
  } catch {
    return /^[a-z-]{1,40}$/i.test(raw) ? raw : "other";
  }
}

/** The page's path, without query string or fragment. */
function pagePath(value: unknown): string | undefined {
  const raw = text(value, 2048);
  if (!raw) return undefined;
  try {
    return new URL(raw).pathname.slice(0, 200);
  } catch {
    return undefined;
  }
}

type Violation = { directive?: string; blocked?: string; page?: string; disposition?: string };

/** Old format (report-uri): { "csp-report": { "document-uri", "blocked-uri", ... } }. */
function fromLegacy(body: unknown): Violation[] {
  const report = (body as { "csp-report"?: Record<string, unknown> } | null)?.["csp-report"];
  if (!report || typeof report !== "object") return [];
  return [
    {
      directive: text(report["effective-directive"]) ?? text(report["violated-directive"]),
      blocked: blockedHost(report["blocked-uri"]),
      page: pagePath(report["document-uri"]),
      disposition: text(report.disposition, 20),
    },
  ];
}

/** Reporting API (report-to): [{ type: "csp-violation", body: { documentURL, blockedURL, ... } }]. */
function fromReportingApi(body: unknown): Violation[] {
  if (!Array.isArray(body)) return [];
  return body
    .filter((item) => item && typeof item === "object" && item.type === "csp-violation" && item.body)
    .map((item) => {
      const report = item.body as Record<string, unknown>;
      return {
        directive: text(report.effectiveDirective),
        blocked: blockedHost(report.blockedURL),
        page: pagePath(report.documentURL ?? item.url),
        disposition: text(report.disposition, 20),
      };
    });
}

export async function POST(request: Request) {
  const type = (request.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
  const legacy = type === "application/csp-report";
  if (!legacy && type !== "application/reports+json") {
    return new Response(null, { status: 415 });
  }

  const raw = await readCapped(request, MAX_BODY_BYTES).catch(() => null);
  if (raw === null) return new Response(null, { status: 413 });

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return new Response(null, { status: 400 });
  }

  const violations = (legacy ? fromLegacy(body) : fromReportingApi(body)).slice(0, MAX_REPORTS_PER_REQUEST);
  const now = Date.now();
  for (const violation of violations) {
    if (!allowLine(now)) break;
    logEvent("warn", "csp_violation", violation);
  }

  return new Response(null, { status: 204 });
}
