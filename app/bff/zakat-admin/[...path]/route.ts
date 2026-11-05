import { createProxy } from "@/lib/api/proxy";

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
 */
export const { GET, POST, PATCH, PUT, DELETE } = createProxy({
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
