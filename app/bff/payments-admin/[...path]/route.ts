import type { NextRequest } from "next/server";

import { bffJson } from "@/lib/api/bff";
import { createProxy } from "@/lib/api/proxy";
import { redactPaymentsAdmin, redactsPath } from "@/lib/zakat/redact";

/**
 * ADMIN back office on payment-service: zakat payments, settings, EthQR and payouts.
 *
 * Who may call each prefix (mirrors the UI; the gateway still decides):
 *
 * | Prefix           | Access | UI callers                                                     |
 * | ---------------- | ------ | -------------------------------------------------------------- |
 * | zakat-payments   | admin  | Zakat payments (RequireRole admin)                             |
 * | payment-settings | admin  | Zakat settings (admin); test-mode banners on Payments, Payouts |
 * | ethqr            | admin  | Zakat settings (merchant), Zakat payments (transactions; admin)|
 * | disbursements    | admin  | Payouts (admin); payout dialog on Payouts and Pool (admin)     |
 *
 * payment-service masks bank and EthQR data itself since 11 November. A cheap
 * second check stays here (bank-call bodies as summaries, account numbers by
 * their last 4 digits, EthQR receipts by their known columns, raw bodies out
 * of error answers): see lib/zakat/redact.ts.
 */
const proxy = createProxy({
  label: "payments-admin",
  upstreamPrefix: "/api/payments/v1/admin",
  // Payout confirm, lookups and "Check now" wait on the bank or EthQR. Cutting
  // them off at the default 15 s would leave the admin with an unknown outcome.
  timeoutMs: 90_000,
  allowedPrefixes: {
    "zakat-payments": "admin",
    "payment-settings": "admin",
    ethqr: "admin",
    disbursements: "admin",
  },
});

type Handler = typeof proxy.GET;
type ProxyContext = Parameters<Handler>[1];

function redacting(handler: Handler) {
  return async (request: NextRequest, context: ProxyContext) => {
    const response = await handler(request, context);
    if (!(response.headers.get("Content-Type") ?? "").includes("application/json")) return response;
    const { path } = await context.params;
    // Error answers can carry a raw third-party body on any path; successful ones only on a few.
    if (response.ok && !redactsPath(path)) return response;
    let body: unknown;
    try {
      body = await response.clone().json();
    } catch {
      return response;
    }
    const redacted = redactPaymentsAdmin(path, body);
    return redacted === body ? response : bffJson(redacted, { status: response.status });
  };
}

export const GET = redacting(proxy.GET);
export const POST = redacting(proxy.POST);
export const PATCH = redacting(proxy.PATCH);
export const PUT = redacting(proxy.PUT);
export const DELETE = redacting(proxy.DELETE);
