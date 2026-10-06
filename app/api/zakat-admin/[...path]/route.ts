import { createProxy } from "@/lib/api/proxy";

/** ADMIN back office on zakat-engine: prices, calculator rules, impact content, media. */
export const { GET, POST, PATCH, PUT, DELETE } = createProxy({
  label: "zakat-admin",
  upstreamPrefix: "/api/zakat/v1/admin",
  allowedPrefixes: ["prices", "calculator-configs", "impact", "media"],
});
