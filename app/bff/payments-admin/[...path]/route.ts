import { createProxy } from "@/lib/api/proxy";

/**
 * ADMIN back office on payment-service: zakat payments, settings, EthQR and payouts.
 *
 * Who may call each prefix (mirrors the UI; the gateway still decides):
 *
 * | Prefix           | Access | UI callers                                                     |
 * | ---------------- | ------ | -------------------------------------------------------------- |
 * | zakat-payments   | admin  | Zakat payments (RequireRole admin)                             |
 * | payment-settings | admin  | Zakat settings (admin)                                         |
 * | ethqr            | admin  | Zakat settings (merchant), Zakat payments (transactions; admin)|
 * | disbursements    | admin  | Payouts (admin); payout dialog on Payouts and Pool (admin)     |
 */
export const { GET, POST, PATCH, PUT, DELETE } = createProxy({
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
