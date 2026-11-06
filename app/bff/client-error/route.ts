import { readBodyCapped } from "@/lib/api/body";
import { CLIENT_ERROR_MAX_BYTES, browserFamily, sanitizeClientError } from "@/lib/api/client-error";
import { ApiError } from "@/lib/api/errors";
import { logEvent } from "@/lib/api/log";
import { newRequestId } from "@/lib/api/upstream";
import { clientIp } from "@/lib/auth/http";
import { UNKNOWN_IP, createRequestLimiter } from "@/lib/auth/rate-limit";

/**
 * Receives errors from the browser (instrumentation-client.ts and the error
 * pages) and writes one JSON line per report to the server log, next to the
 * server's own request_error lines. No third-party tracker.
 *
 * No login (it also serves the public site) and no cookies are read. The
 * report is scrubbed again here (lib/api/client-error.ts): no query strings,
 * emails, long numbers, tokens or Ethiopic/Arabic text, and of the browser
 * only its family ("Chrome 131 on Windows"). The IP is used for the rate
 * limit and never logged.
 */

/** 10 reports per browser and 120 overall per minute: enough to see a bug, too few to flood the log. */
const limiter = createRequestLimiter({ perKey: 10, total: 120 });

const ACCEPTED_TYPES = new Set(["application/json", "text/plain"]);

export async function POST(request: Request) {
  const type = (request.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
  if (!ACCEPTED_TYPES.has(type)) return new Response(null, { status: 415 });

  const ip = clientIp(request);
  if (!limiter.allow(ip === UNKNOWN_IP ? null : ip)) return new Response(null, { status: 429 });

  let body: unknown;
  try {
    const bytes = await readBodyCapped(request, CLIENT_ERROR_MAX_BYTES);
    body = JSON.parse(new TextDecoder().decode(bytes));
  } catch (error) {
    // Too large (413) or not JSON: nothing to log either way.
    return new Response(null, { status: error instanceof ApiError ? error.status : 400 });
  }

  const report = sanitizeClientError(body);
  if (!report) return new Response(null, { status: 400 });

  logEvent("error", "client_error", {
    requestId: newRequestId(),
    ...report,
    browser: browserFamily(request.headers.get("user-agent")),
  });
  return new Response(null, { status: 204 });
}
