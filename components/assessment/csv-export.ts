import { ApiError } from "@/lib/api/errors";
import { formatCount } from "@/lib/backoffice/format";

/** The file name from a Content-Disposition header, or the fallback. */
export function downloadName(header: string | null, fallback: string): string {
  const match = header?.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
  if (!match) return fallback;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

/**
 * What to tell the user when the export holds only the first rows
 * (`X-Export-Truncated: true`, at most 10,000), or null when it is complete.
 */
export function truncationNote(headers: Pick<Headers, "get">, noun: string): string | null {
  if (headers.get("X-Export-Truncated") !== "true") return null;
  const total = Number(headers.get("X-Total-Count"));
  const of = Number.isFinite(total) && total > 0 ? ` of ${formatCount(total)}` : "";
  return `The file has the first 10,000 ${noun} only${of}. Narrow the filters to export the rest.`;
}

/** Save a downloaded file in the browser. */
export function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

/** An ApiError from a failed export answer (the BFF's JSON error), so ErrorAlert can show it. */
export async function exportError(response: Response, fallback: string): Promise<ApiError> {
  const body = (await response.json().catch(() => null)) as {
    message?: unknown;
    code?: unknown;
    requestId?: unknown;
  } | null;
  const text = (value: unknown) => (typeof value === "string" && value ? value : null);
  return new ApiError(
    text(body?.message) ?? fallback,
    response.status,
    [],
    null,
    text(body?.code),
    text(body?.requestId) ?? response.headers.get("X-Request-Id"),
  );
}
