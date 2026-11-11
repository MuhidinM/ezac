import { baseContentType, isInlineSafeType } from "@/lib/api/bff";
import { ApiError } from "@/lib/api/errors";
import { UPSTREAM_FILE_TIMEOUT_MS, logUpstreamFailure, upstreamFetch, type UpstreamCall } from "@/lib/api/upstream";

/**
 * Public zakat media (cause/story images, report PDFs). Served through
 * the site so browsers never talk to the gateway directly (its UAT
 * certificate is self-signed). No login needed.
 *
 * Uploads are only type-checked in the browser, so the response is made
 * safe here: only images and PDFs render inline, anything else downloads,
 * and a sandboxing CSP stops an HTML or SVG file from running script on our
 * origin. Binaries stream through (never Next's data cache, which buffers
 * whole bodies), and browsers keep them for an hour so a take-down applies
 * within the hour.
 */
const MEDIA_CSP = "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox";

function empty(status: number) {
  return new Response(null, { status, headers: { "Cache-Control": "no-store" } });
}

/** The smaller copies zakat-engine keeps of each image (imageVariants). */
const SIZES = new Set(["thumbnail", "medium", "large"]);

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d{1,18}$/.test(id)) return empty(404);
  const size = new URL(request.url).searchParams.get("size");
  const query = size && SIZES.has(size) ? `?size=${size}` : "";

  let call: UpstreamCall;
  try {
    call = await upstreamFetch(`/api/zakat/v1/media/${id}${query}`, { cache: "no-store" }, {
      label: "media",
      timeoutMs: UPSTREAM_FILE_TIMEOUT_MS,
    });
  } catch (error) {
    // Unreachable or timed out; already logged.
    return empty(error instanceof ApiError ? error.status : 502);
  }

  const upstream = call.response;
  if (!upstream.ok || !upstream.body) {
    call.settle();
    if (upstream.status >= 500) logUpstreamFailure(call, null);
    await upstream.body?.cancel().catch(() => undefined);
    return empty(upstream.status === 404 ? 404 : 502);
  }

  // The timeout covered the wait for an answer; the download itself may be slow.
  call.settle();

  const contentType = upstream.headers.get("Content-Type") ?? "application/octet-stream";
  const disposition = upstream.headers.get("Content-Disposition");
  const headers = new Headers({
    "Content-Type": contentType,
    "Cache-Control": "public, max-age=3600",
    "X-Content-Type-Options": "nosniff",
  });

  if (isInlineSafeType(contentType)) {
    if (disposition) headers.set("Content-Disposition", disposition);
  } else {
    headers.set("Content-Disposition", disposition?.replace(/^\s*inline/i, "attachment") ?? "attachment");
  }

  // The CSP sandbox also turns off browsers' built-in PDF viewers, so report
  // PDFs (which can't run script on our origin) go without it.
  if (baseContentType(contentType) !== "application/pdf") {
    headers.set("Content-Security-Policy", MEDIA_CSP);
  }

  const length = upstream.headers.get("Content-Length");
  if (length) headers.set("Content-Length", length);

  return new Response(upstream.body, { status: 200, headers });
}
