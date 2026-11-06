/**
 * Unsigned JWTs for tests. The app only decodes tokens (the gateway checks the
 * signature), so a fake signature is enough, which is also exactly what a
 * hand-made token looks like.
 */

let serial = 0;

function base64Url(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

export function makeJwt(payload: Record<string, unknown>): string {
  serial += 1;
  // `jti` makes every token unique, so per-token caches never carry over between tests.
  return `${base64Url({ alg: "RS256", typ: "JWT" })}.${base64Url({ jti: `test-${serial}`, ...payload })}.signature`;
}

/** Seconds since the epoch, `offset` seconds from now. */
export function epoch(offset: number): number {
  return Math.floor(Date.now() / 1000) + offset;
}

/** An access token with these realm roles, valid for five minutes. */
export function accessToken(roles: string[], extra: Record<string, unknown> = {}): string {
  return makeJwt({ preferred_username: "staff.user", exp: epoch(300), realm_access: { roles }, ...extra });
}

export type FakeCookieStore = {
  values: Map<string, string>;
  get(name: string): { name: string; value: string } | undefined;
  set(name: string, value: string, options?: unknown): void;
  delete(name: string): void;
};

/** Enough of next/headers' cookie store for lib/auth/session.ts. */
export function fakeCookies(initial: Record<string, string> = {}): FakeCookieStore {
  const values = new Map(Object.entries(initial));
  return {
    values,
    get: (name) => (values.has(name) ? { name, value: values.get(name) as string } : undefined),
    set: (name, value) => {
      values.set(name, value);
    },
    delete: (name) => {
      values.delete(name);
    },
  };
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}
