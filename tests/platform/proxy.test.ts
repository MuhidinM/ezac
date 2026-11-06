import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { proxy } from "@/proxy";
import { ACCESS_TOKEN_COOKIE, PASSWORD_CHANGE_COOKIE, REFRESH_TOKEN_COOKIE } from "@/lib/auth/constants";
import { LOCALE_COOKIE } from "@/lib/i18n/config";

import { accessToken } from "./fixtures/tokens";

const SITE_URL = process.env.SITE_URL;

beforeEach(() => {
  delete process.env.SITE_URL;
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
});

afterEach(() => {
  if (SITE_URL === undefined) delete process.env.SITE_URL;
  else process.env.SITE_URL = SITE_URL;
  vi.restoreAllMocks();
});

function request(
  path: string,
  options: { method?: string; cookies?: Record<string, string>; headers?: Record<string, string> } = {},
) {
  const headers = new Headers({ host: "ezac.example", ...options.headers });
  const cookies = Object.entries(options.cookies ?? {});
  if (cookies.length) headers.set("cookie", cookies.map(([name, value]) => `${name}=${value}`).join("; "));
  return new NextRequest(`https://ezac.example${path}`, { method: options.method ?? "GET", headers });
}

function run(path: string, options?: Parameters<typeof request>[1]) {
  return proxy(request(path, options));
}

/** Where a redirect points, as a path and query. */
function location(response: Response): string | null {
  const value = response.headers.get("location");
  if (!value) return null;
  const url = new URL(value);
  return `${url.pathname}${url.search}`;
}

const passesThrough = (response: Response) => response.headers.get("x-middleware-next") === "1";

describe("public pages: language routing", () => {
  it("serves English from the plain URL by rewriting to /en", () => {
    const home = run("/");
    expect(new URL(home.headers.get("x-middleware-rewrite") ?? "").pathname).toBe("/en");
    const about = run("/about");
    expect(new URL(about.headers.get("x-middleware-rewrite") ?? "").pathname).toBe("/en/about");
  });

  it("redirects /en/... to the plain URL, saving English as the choice, uncached", () => {
    const response = run("/en/about?x=1");
    expect(response.status).toBe(308);
    expect(location(response)).toBe("/about?x=1");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.cookies.get(LOCALE_COOKIE)?.value).toBe("en");
  });

  it("sends a visitor who chose another language to that prefix", () => {
    const response = run("/zakat/calculator", { cookies: { [LOCALE_COOKIE]: "am" } });
    expect(response.status).toBe(307);
    expect(location(response)).toBe("/am/zakat/calculator");
    expect(location(run("/", { cookies: { [LOCALE_COOKIE]: "ar" } }))).toBe("/ar");
  });

  it("serves prefixed pages as they are, and ignores an unknown language cookie", () => {
    expect(passesThrough(run("/om/about"))).toBe(true);
    const response = run("/about", { cookies: { [LOCALE_COOKIE]: "xx" } });
    expect(new URL(response.headers.get("x-middleware-rewrite") ?? "").pathname).toBe("/en/about");
  });

  it("leaves files alone", () => {
    expect(passesThrough(run("/robots.txt"))).toBe(true);
    expect(passesThrough(run("/images/logo.webp"))).toBe(true);
  });
});

describe("staff pages: session guards", () => {
  it("sends a visitor without a session from the dashboard to sign-in, remembering the page", () => {
    const response = run("/dashboard/pool");
    expect(response.status).toBe(307);
    expect(location(response)).toBe("/login?redirect=%2Fdashboard%2Fpool");
  });

  it("counts a refresh cookie alone as signed in", () => {
    expect(passesThrough(run("/dashboard", { cookies: { [REFRESH_TOKEN_COOKIE]: "r" } }))).toBe(true);
  });

  it("keeps an account with a temporary password on the change-password page", () => {
    const response = run("/dashboard/branches", {
      cookies: { [ACCESS_TOKEN_COOKIE]: accessToken(["ADMIN"]), [PASSWORD_CHANGE_COOKIE]: "1" },
    });
    expect(location(response)).toBe("/login/change-password?redirect=%2Fdashboard%2Fbranches");
    expect(location(run("/login/change-password"))).toBe("/login");
  });

  it("sends a signed-in user from /login to their home page, or back where they were", () => {
    expect(location(run("/login", { cookies: { [ACCESS_TOKEN_COOKIE]: accessToken(["BRANCH"]) } }))).toBe("/dashboard/branch");
    expect(location(run("/login", { cookies: { [ACCESS_TOKEN_COOKIE]: accessToken(["ADMIN"]) } }))).toBe("/dashboard");
    expect(
      location(run("/login?redirect=/dashboard/pool", { cookies: { [ACCESS_TOKEN_COOKIE]: accessToken(["ADMIN"]) } })),
    ).toBe("/dashboard/pool");
    // Only dashboard pages: anything else could send the user off-site.
    expect(
      location(run("/login?redirect=https://evil.example", { cookies: { [ACCESS_TOKEN_COOKIE]: accessToken(["ADMIN"]) } })),
    ).toBe("/dashboard");
  });
});

describe("/bff guards", () => {
  it("lets reads and same-site writes through", () => {
    expect(passesThrough(run("/bff/backoffice/admin/branches"))).toBe(true);
    expect(passesThrough(run("/bff/auth/login", { method: "POST", headers: { origin: "https://ezac.example" } }))).toBe(true);
  });

  it("blocks a write from another site", async () => {
    const response = run("/bff/auth/me/password", { method: "POST", headers: { origin: "https://evil.example" } });
    expect(response.status).toBe(403);
    expect(((await response.json()) as { message: string }).message).toMatch(/another website/);
  });

  it("checks against SITE_URL when the proxy rewrites Host", () => {
    process.env.SITE_URL = "https://ezac.gov.et";
    const headers = { host: "127.0.0.1:3000" };
    expect(passesThrough(run("/bff/auth/login", { method: "POST", headers: { ...headers, origin: "https://ezac.gov.et" } }))).toBe(true);
    expect(run("/bff/auth/login", { method: "POST", headers: { ...headers, origin: "https://ezac.gov.et.evil.example" } }).status).toBe(403);
  });

  it("never blocks sign-out or CSP reports on Origin, but does block cross-site error reports", () => {
    const evil = { origin: "https://evil.example" };
    expect(passesThrough(run("/bff/auth/logout", { method: "POST", headers: evil }))).toBe(true);
    expect(passesThrough(run("/bff/csp-report", { method: "POST", headers: evil }))).toBe(true);
    expect(run("/bff/client-error", { method: "POST", headers: evil }).status).toBe(403);
  });

  it("allows only the change-password calls (and the report sinks) during a password change", () => {
    const cookies = { [ACCESS_TOKEN_COOKIE]: accessToken(["ADMIN"]), [PASSWORD_CHANGE_COOKIE]: "1" };
    expect(run("/bff/backoffice/admin/branches", { cookies }).status).toBe(403);
    expect(passesThrough(run("/bff/auth/me/password", { method: "POST", cookies }))).toBe(true);
    expect(passesThrough(run("/bff/auth/session", { cookies }))).toBe(true);
    expect(passesThrough(run("/bff/client-error", { method: "POST", cookies }))).toBe(true);
    expect(passesThrough(run("/bff/media/12", { cookies }))).toBe(true);
  });
});
