import type { NextRequest } from "next/server";

import { createProxy } from "@/lib/api/proxy";
import { expirePublicZakatData } from "@/lib/zakat/public-cache";

/**
 * ADMIN back office on zakat-engine (WEB-ADMIN-ZAKAT-GUIDE.md).
 *
 * Who may call each prefix (mirrors the UI; the gateway still decides):
 *
 * | Prefix             | Access | UI callers                                                   |
 * | ------------------ | ------ | ------------------------------------------------------------ |
 * | prices             | admin  | Prices & nisab: status, refresh, history (RequireRole admin) |
 * | calculator-configs | admin  | Calculator rules; livestock prices on Prices & nisab (admin) |
 * | media              | admin  | image upload on Causes and Stories; report PDFs (admin)      |
 * | causes             | admin  | Causes (admin)                                               |
 * | zakat-al-fitr      | admin  | Zakat settings (admin)                                       |
 * | home               | admin  | Zakat settings, home adjustment (admin)                      |
 * | impact             | admin  | Impact regions, stories and reports (admin)                  |
 *
 * After a successful change the public pages and the public calculator config
 * are expired, so they show it on the next visit instead of up to 5 minutes
 * later (and a story or cause taken down disappears). Uploads alone change
 * nothing public until the cause, story or report that uses them is saved.
 */
const proxy = createProxy({
  label: "zakat-admin",
  upstreamPrefix: "/api/zakat/v1/admin",
  allowedPrefixes: {
    prices: "admin",
    "calculator-configs": "admin",
    media: "admin",
    causes: "admin",
    "zakat-al-fitr": "admin",
    home: "admin",
    impact: "admin",
  },
});

type Handler = typeof proxy.POST;
type ProxyContext = Parameters<Handler>[1];

function expiringPublicData(handler: Handler): Handler {
  return async (request: NextRequest, context: ProxyContext) => {
    const response = await handler(request, context);
    if (response.ok) {
      const { path } = await context.params;
      if (path[0] !== "media") expirePublicZakatData();
    }
    return response;
  };
}

export const GET = proxy.GET;
export const POST = expiringPublicData(proxy.POST);
export const PATCH = expiringPublicData(proxy.PATCH);
export const PUT = expiringPublicData(proxy.PUT);
export const DELETE = expiringPublicData(proxy.DELETE);
