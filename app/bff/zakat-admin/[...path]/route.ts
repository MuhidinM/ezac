import { createProxy } from "@/lib/api/proxy";

/** ADMIN back office on zakat-engine (WEB-ADMIN-ZAKAT-GUIDE.md). */
export const { GET, POST, PATCH, PUT, DELETE } = createProxy({
  label: "zakat-admin",
  upstreamPrefix: "/api/zakat/v1/admin",
  allowedPrefixes: ["prices", "calculator-configs", "media", "causes", "zakat-al-fitr", "home", "impact"],
});
