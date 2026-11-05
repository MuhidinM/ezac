import { ApiError } from "@/lib/api/errors";

/**
 * Request bodies are read into memory before they go to the gateway, so each
 * one is capped: the app runs as a single Node process, and one huge body
 * must not take it down.
 */

/** JSON forms are a few kilobytes. */
export const JSON_BODY_LIMIT = 1024 * 1024;
/**
 * Above the largest client-side limit (report PDFs, 20 MB) plus multipart overhead.
 * experimental.proxyClientMaxBodySize in next.config.ts must stay above this:
 * proxy.ts runs on /bff, and Next cuts bodies longer than that setting.
 */
export const MULTIPART_BODY_LIMIT = 25 * 1024 * 1024;

function tooLarge(limit: number): ApiError {
  return new ApiError(
    limit >= MULTIPART_BODY_LIMIT
      ? "The files are too large. Send at most 25 MB at a time."
      : "The request is too large.",
    413,
  );
}

export function isMultipart(request: Request): boolean {
  return request.headers.get("Content-Type")?.toLowerCase().startsWith("multipart/form-data") ?? false;
}

/**
 * The raw body, up to `limit` bytes. A declared Content-Length over the limit
 * is refused before reading; without one, reading stops at the limit.
 * Throws ApiError 413.
 */
export async function readBodyCapped(request: Request, limit: number): Promise<ArrayBuffer> {
  const declared = request.headers.get("Content-Length");
  if (declared !== null && Number(declared) > limit) throw tooLarge(limit);
  if (!request.body) return new ArrayBuffer(0);

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > limit) {
      await reader.cancel().catch(() => undefined);
      throw tooLarge(limit);
    }
    chunks.push(value);
  }

  // A body shorter than it said it would be was cut somewhere on the way (a
  // dropped connection, or a proxy buffer limit). Forwarding it would send the
  // gateway a broken upload.
  if (declared !== null && Number.isFinite(Number(declared)) && total < Number(declared)) {
    throw new ApiError("The upload didn't arrive in full. Try again.", 400);
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes.buffer;
}

/** A JSON body of at most 1 MB. Throws ApiError 400 or 413. */
export async function readJsonBody<T = unknown>(request: Request): Promise<T> {
  const bytes = await readBodyCapped(request, JSON_BODY_LIMIT);
  try {
    return JSON.parse(new TextDecoder().decode(bytes)) as T;
  } catch {
    throw new ApiError("Invalid request body", 400);
  }
}

/** A multipart body of at most 25 MB. Throws ApiError 400 or 413. */
export async function readFormDataBody(request: Request): Promise<FormData> {
  const bytes = await readBodyCapped(request, MULTIPART_BODY_LIMIT);
  try {
    return await new Response(bytes, {
      headers: { "Content-Type": request.headers.get("Content-Type") ?? "" },
    }).formData();
  } catch {
    throw new ApiError("Invalid multipart request", 400);
  }
}
