/**
 * The browser's address, read from the headers our nginx sets.
 *
 * X-Real-IP first, then the LAST X-Forwarded-For entry: the one the nearest
 * proxy added (or Next itself, from the socket, when nothing was sent). The
 * first entry is whatever the client chose to send, so it can't be trusted.
 * nginx must set both headers to $remote_addr (see README, "Reverse proxy").
 *
 * Loopback means the proxy didn't say who the browser is: every visitor would
 * look the same, so that is reported as null.
 */
export function visitorIp(headers: Headers): string | null {
  const real = headers.get("x-real-ip")?.trim();
  const forwarded = headers
    .get("x-forwarded-for")
    ?.split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  const ip = (real || forwarded?.[forwarded.length - 1] || "").replace(/^::ffff:/i, "").slice(0, 64);
  if (!ip || ip === "::1" || ip.startsWith("127.")) return null;
  return ip;
}
