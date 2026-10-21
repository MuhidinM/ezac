import { createProxy } from "@/lib/api/proxy";

/** ADMIN back office on payment-service: zakat payments, settings, EthQR and payouts. */
export const { GET, POST, PATCH, PUT, DELETE } = createProxy({
  label: "payments-admin",
  upstreamPrefix: "/api/payments/v1/admin",
  allowedPrefixes: ["zakat-payments", "payment-settings", "ethqr", "disbursements"],
});
