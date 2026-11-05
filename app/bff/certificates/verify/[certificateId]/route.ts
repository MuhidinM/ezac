import { NextResponse } from "next/server";

import { ApiError } from "@/lib/api/errors";
import { isRecord, readUpstreamJson, upstreamError, upstreamFetch } from "@/lib/api/upstream";

const NOT_CHECKED = "Couldn't check the certificate. Try again in a moment.";

/** Validity can change (a revoked certificate), so answers are never cached. */
function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function amount(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return null;
}

function optionalText(value: unknown): string | null {
  return typeof value === "string" && value ? value : null;
}

/**
 * Only these fields reach the public, whatever the payment service adds
 * later: the page shows validity, amount, zakat type and date, never who paid.
 * Readers: components/site/certificate-verify.tsx and the admin check on
 * app/dashboard/zakat/payments/page.tsx.
 */
function publicCertificate(data: Record<string, unknown>, requestedId: string) {
  return {
    valid: data.valid === true,
    certificateId: optionalText(data.certificateId) ?? requestedId,
    amountEtb: amount(data.amountEtb),
    zakatType: optionalText(data.zakatType),
    paidAt: optionalText(data.paidAt),
  };
}

/** Public zakat certificate check: `{ valid, certificateId, amountEtb, zakatType, paidAt }`. */
export async function GET(_request: Request, { params }: { params: Promise<{ certificateId: string }> }) {
  const { certificateId } = await params;
  if (!/^[A-Za-z0-9-]{1,64}$/.test(certificateId)) {
    return json({ success: false, message: "That doesn't look like a certificate number." }, 400);
  }

  try {
    const call = await upstreamFetch(
      `/api/payments/v1/certificates/verify/${encodeURIComponent(certificateId)}`,
      {},
      { label: "certificates/verify" },
    );
    const parsed = await readUpstreamJson(call);
    const body = parsed.kind === "json" ? parsed.value : null;
    const status = call.response.status;

    if (call.response.ok && isRecord(body) && body.success === true && isRecord(body.data)) {
      return json({ success: true, data: publicCertificate(body.data, certificateId) });
    }

    if (call.response.ok && !(isRecord(body) && body.success === false)) {
      // A 2xx we can't read.
      return json({ success: false, message: NOT_CHECKED, requestId: call.requestId }, 502);
    }

    // 4xx messages ("not found") are for the visitor; 5xx text stays in the log.
    const error = upstreamError(call, body);
    return json(
      { success: false, message: status >= 500 ? NOT_CHECKED : error.message, requestId: call.requestId },
      status,
    );
  } catch (error) {
    if (error instanceof ApiError) {
      return json({ success: false, message: error.message, requestId: error.requestId }, error.status);
    }
    throw error;
  }
}
