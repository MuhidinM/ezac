import { expirePublicZakatData } from "@/lib/zakat/public-cache";

/**
 * POST /bff/internal/expire-public: drops this process's cached public zakat
 * data. Blue/green runs two copies of the app, each with its own cache; when an
 * admin changes content on one, it calls this on the other (and deploy.sh calls
 * it on a rollback), so a story or cause taken down is not served again by the
 * standby copy.
 *
 * Loopback only: every request through nginx carries the public Host and
 * X-Real-IP, so those are refused. (X-Forwarded-For can't tell them apart: Next
 * fills it in from the socket for direct calls too.)
 */
export function POST(request: Request) {
  const host = (request.headers.get("host") ?? "").toLowerCase().replace(/:\d+$/, "");
  if (host !== "127.0.0.1" || request.headers.has("x-real-ip")) {
    return new Response(null, { status: 404, headers: { "Cache-Control": "no-store" } });
  }
  expirePublicZakatData();
  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}
