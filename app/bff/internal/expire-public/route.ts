import { expirePublicZakatData } from "@/lib/zakat/public-cache";

/**
 * POST /bff/internal/expire-public: drops this process's cached public zakat
 * data. Blue/green runs two copies of the app, each with its own cache; when an
 * admin changes content on one, it calls this on the other (and deploy.sh calls
 * it on a rollback), so a story or cause taken down is not served again by the
 * standby copy.
 *
 * Loopback only: the app listens on 127.0.0.1 and every request through nginx
 * carries X-Forwarded-For and the public Host, so those are refused.
 */
export function POST(request: Request) {
  const host = (request.headers.get("host") ?? "").toLowerCase().replace(/:\d+$/, "");
  const viaProxy = request.headers.has("x-forwarded-for") || request.headers.has("x-real-ip");
  if (host !== "127.0.0.1" || viaProxy) {
    return new Response(null, { status: 404, headers: { "Cache-Control": "no-store" } });
  }
  expirePublicZakatData();
  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}
