import { getApiBaseUrl } from "@/lib/api/config";

const HINTS: Record<string, string> = {
  ECONNREFUSED: "nothing is listening there: check API_BASE_URL",
  ENOTFOUND: "the host name doesn't resolve: check API_BASE_URL",
  ETIMEDOUT: "the connection timed out: check API_BASE_URL and the firewall",
  UND_ERR_CONNECT_TIMEOUT: "the connection timed out: check API_BASE_URL and the firewall",
  SELF_SIGNED_CERT_IN_CHAIN: "the gateway certificate isn't trusted: start with NODE_EXTRA_CA_CERTS (pnpm start:uat)",
  DEPTH_ZERO_SELF_SIGNED_CERT: "the gateway certificate isn't trusted: start with NODE_EXTRA_CA_CERTS (pnpm start:uat)",
  UNABLE_TO_VERIFY_LEAF_SIGNATURE: "the gateway certificate isn't trusted: start with NODE_EXTRA_CA_CERTS (pnpm start:uat)",
  ERR_TLS_CERT_ALTNAME_INVALID: "the certificate doesn't cover this host name or IP",
};

/**
 * Logs why a server-side call to the gateway failed, with the URL and a hint,
 * so a deployment with a wrong API_BASE_URL or an untrusted certificate is
 * obvious from the server log.
 */
export function logGatewayUnreachable(label: string, error: unknown) {
  const cause = (error as { cause?: { code?: string; message?: string } })?.cause;
  const code = cause?.code ?? (error as { code?: string })?.code ?? "UNKNOWN";
  console.error(
    `[${label}] cannot reach the gateway at ${getApiBaseUrl()} (${code}${HINTS[code] ? `: ${HINTS[code]}` : ""})`,
    cause?.message ?? (error instanceof Error ? error.message : error),
  );
}
