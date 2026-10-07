import { NextResponse } from "next/server";

import { getApiBaseUrl } from "@/lib/api/config";

/** Public zakat certificate check: `{ valid, certificateId, payerName, amountEtb, zakatType, paidAt }`. */
export async function GET(_request: Request, { params }: { params: Promise<{ certificateId: string }> }) {
  const { certificateId } = await params;
  if (!/^[A-Za-z0-9-]{1,64}$/.test(certificateId)) {
    return NextResponse.json({ success: false, message: "That doesn't look like a certificate number." }, { status: 400 });
  }
  try {
    const upstream = await fetch(
      `${getApiBaseUrl()}/api/payments/v1/certificates/verify/${encodeURIComponent(certificateId)}`,
      { cache: "no-store" },
    );
    const body = (await upstream.json().catch(() => null)) as unknown;
    if (!body) {
      return NextResponse.json({ success: false, message: "Couldn't check the certificate." }, { status: upstream.status || 502 });
    }
    return NextResponse.json(body, { status: upstream.status });
  } catch {
    return NextResponse.json({ success: false, message: "Couldn't reach the payment service." }, { status: 502 });
  }
}
