import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ACCESS_TOKEN_COOKIE, PASSWORD_CHANGE_COOKIE, REFRESH_TOKEN_COOKIE } from "@/lib/auth/constants";
import { decodeJwtPayload, getAppRolesFromPayload } from "@/lib/auth/jwt";
import {
  AuthUnavailableError,
  getAccessToken,
  hasPortalAccess,
  sessionFlags,
  sessionFromAccessToken,
  sessionFromMeProfile,
  shouldUseSecureCookies,
} from "@/lib/auth/session";
import { readTokens } from "@/lib/auth/tokens";

import { accessToken, epoch, fakeCookies, jsonResponse, makeJwt, type FakeCookieStore } from "./fixtures/tokens";

vi.mock("server-only", () => ({}));

const cookieStore: { current: FakeCookieStore } = { current: fakeCookies() };

vi.mock("next/headers", () => ({
  cookies: async () => cookieStore.current,
  headers: async () => new Headers(),
}));

const saved = {
  API_BASE_URL: process.env.API_BASE_URL,
  TRUST_ROLELESS_ACCOUNTS: process.env.TRUST_ROLELESS_ACCOUNTS,
  NODE_ENV: process.env.NODE_ENV,
  ALLOW_INSECURE_AUTH_COOKIES: process.env.ALLOW_INSECURE_AUTH_COOKIES,
};

function restore(name: keyof typeof saved) {
  const value = saved[name];
  if (value === undefined) delete (process.env as Record<string, string | undefined>)[name];
  else (process.env as Record<string, string | undefined>)[name] = value;
}

beforeEach(() => {
  process.env.API_BASE_URL = "https://gateway.test";
});

afterEach(() => {
  for (const name of Object.keys(saved) as (keyof typeof saved)[]) restore(name);
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("roles and access flags", () => {
  it("reads roles from the realm, the gateway client and a roles claim, ignoring other roles", () => {
    const payload = decodeJwtPayload(
      makeJwt({
        realm_access: { roles: ["offline_access", "admin"] },
        resource_access: { "gateway-client": { roles: ["BRANCH"] }, other: { roles: ["FIELD_OFFICER"] } },
      }),
    );
    expect(payload && getAppRolesFromPayload(payload)).toEqual(["ADMIN", "BRANCH"]);
  });

  it("decodes nothing from a token that isn't a JWT", () => {
    expect(decodeJwtPayload("not-a-token")).toBeNull();
    expect(decodeJwtPayload("a.%%%.c")).toBeNull();
  });

  it("gives branch access only to branch officers without a head-office role", () => {
    expect(sessionFlags(["BRANCH"])).toEqual({ isAdmin: false, isBranch: true, isStaff: false });
    expect(sessionFlags(["BRANCH", "FIELD_OFFICER"])).toEqual({ isAdmin: false, isBranch: false, isStaff: true });
    expect(sessionFlags(["admin"])).toEqual({ isAdmin: true, isBranch: false, isStaff: true });
  });

  it("gives role-less accounts nothing unless TRUST_ROLELESS_ACCOUNTS is set", () => {
    delete process.env.TRUST_ROLELESS_ACCOUNTS;
    expect(sessionFlags(["offline_access"]).isStaff).toBe(false);
    process.env.TRUST_ROLELESS_ACCOUNTS = "true";
    expect(sessionFlags(["offline_access"]).isStaff).toBe(true);
  });

  it("builds a session from a token, and none from an expired or unreadable one", () => {
    const session = sessionFromAccessToken(accessToken(["FIELD_OFFICER"]));
    expect(session).toMatchObject({ username: "staff.user", roles: ["FIELD_OFFICER"], isStaff: true, isAdmin: false });
    expect(hasPortalAccess(session)).toBe(true);

    expect(sessionFromAccessToken(makeJwt({ exp: epoch(-1), realm_access: { roles: ["ADMIN"] } }))).toBeNull();
    expect(sessionFromAccessToken("garbage")).toBeNull();
    expect(hasPortalAccess(sessionFromAccessToken(accessToken([])))).toBe(false);
  });

  it("names a /me profile by display name, then phone, email or subject", () => {
    const profile = { sub: "u-1", roles: [], email: null, phone: null, displayName: null };
    expect(sessionFromMeProfile({ ...profile, roles: ["ADMIN"], displayName: " Amina ", phone: "+251911000000" }).username).toBe("Amina");
    expect(sessionFromMeProfile({ ...profile, email: "a@example.com" }).username).toBe("a@example.com");
    expect(sessionFromMeProfile(profile).username).toBe("u-1");
  });
});

describe("readTokens", () => {
  it("reads the envelope or a raw OAuth answer", () => {
    expect(readTokens({ success: true, data: { accessToken: "a", refreshToken: "r", expiresIn: 120 } })).toMatchObject({
      accessToken: "a",
      refreshToken: "r",
      expiresIn: 120,
      passwordChangeRequired: false,
    });
    expect(readTokens({ access_token: "a", refresh_token: "r", expires_in: 60, refresh_expires_in: 1800, mustChangePassword: true })).toEqual({
      accessToken: "a",
      refreshToken: "r",
      expiresIn: 60,
      refreshExpiresIn: 1800,
      passwordChangeRequired: true,
    });
  });

  it("takes the refresh lifetime from a JWT refresh token's exp when not stated", () => {
    const tokens = readTokens({ accessToken: "a", refreshToken: makeJwt({ exp: epoch(3600) }) });
    expect(tokens?.refreshExpiresIn).toBeGreaterThan(3590);
    expect(tokens?.expiresIn).toBe(300);
  });

  it("refuses failures and answers without both tokens", () => {
    expect(readTokens({ success: false, message: "Bad credentials" })).toBeNull();
    expect(readTokens({ accessToken: "a" })).toBeNull();
    expect(readTokens("nope")).toBeNull();
  });
});

describe("shouldUseSecureCookies", () => {
  it("is always on in production, and follows the request's scheme elsewhere", () => {
    const env = process.env as Record<string, string | undefined>;
    env.NODE_ENV = "production";
    delete env.ALLOW_INSECURE_AUTH_COOKIES;
    expect(shouldUseSecureCookies(new Request("http://localhost/bff/auth/login"))).toBe(true);

    env.NODE_ENV = "development";
    expect(shouldUseSecureCookies(new Request("http://localhost/bff/auth/login"))).toBe(false);
    expect(
      shouldUseSecureCookies(new Request("http://localhost/bff/auth/login", { headers: { "x-forwarded-proto": "https" } })),
    ).toBe(true);
  });
});

describe("getAccessToken", () => {
  function refreshAnswer(token: string) {
    return jsonResponse({ success: true, data: { accessToken: token, refreshToken: `${token}-refresh`, expiresIn: 300 } });
  }

  it("returns a token that is still fresh without calling the auth service", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const token = accessToken(["ADMIN"]);
    cookieStore.current = fakeCookies({ [ACCESS_TOKEN_COOKIE]: token, [REFRESH_TOKEN_COOKIE]: "r-fresh" });

    await expect(getAccessToken()).resolves.toBe(token);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("redeems the refresh token once for parallel requests and rotates both cookies", async () => {
    const renewed = accessToken(["ADMIN"]);
    const fetchMock = vi.fn(async () => refreshAnswer(renewed));
    vi.stubGlobal("fetch", fetchMock);
    const expiring = makeJwt({ exp: epoch(10), realm_access: { roles: ["ADMIN"] } });
    cookieStore.current = fakeCookies({ [ACCESS_TOKEN_COOKIE]: expiring, [REFRESH_TOKEN_COOKIE]: "r-parallel" });

    const results = await Promise.all([getAccessToken(), getAccessToken(), getAccessToken()]);
    expect(results).toEqual([renewed, renewed, renewed]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String((fetchMock.mock.calls[0] as unknown as [string])[0])).toBe("https://gateway.test/api/auth/v1/refresh");
    expect(cookieStore.current.values.get(ACCESS_TOKEN_COOKIE)).toBe(renewed);
    expect(cookieStore.current.values.get(REFRESH_TOKEN_COOKIE)).toBe(`${renewed}-refresh`);
  });

  it("renews the password-change gate with the session instead of dropping it", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => refreshAnswer(accessToken(["ADMIN"]))));
    cookieStore.current = fakeCookies({ [REFRESH_TOKEN_COOKIE]: "r-gated", [PASSWORD_CHANGE_COOKIE]: "1" });
    await getAccessToken();
    expect(cookieStore.current.values.get(PASSWORD_CHANGE_COOKIE)).toBe("1");
  });

  it("ends the session when the auth service refuses the refresh token", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ success: false, message: "Token is not active" }, 400)));
    cookieStore.current = fakeCookies({ [REFRESH_TOKEN_COOKIE]: "r-rejected", [PASSWORD_CHANGE_COOKIE]: "1" });

    await expect(getAccessToken()).resolves.toBeNull();
    expect([...cookieStore.current.values.keys()]).toEqual([]);
  });

  it("keeps using a still-valid token while the auth service is down", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 503 })));
    const expiring = makeJwt({ exp: epoch(10), realm_access: { roles: ["ADMIN"] } });
    cookieStore.current = fakeCookies({ [ACCESS_TOKEN_COOKIE]: expiring, [REFRESH_TOKEN_COOKIE]: "r-down-valid" });

    await expect(getAccessToken()).resolves.toBe(expiring);
    expect(cookieStore.current.values.has(REFRESH_TOKEN_COOKIE)).toBe(true);
  });

  it("asks for a retry (AuthUnavailableError), keeping the cookies, once the token has expired", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new TypeError("fetch failed"))));
    cookieStore.current = fakeCookies({ [REFRESH_TOKEN_COOKIE]: "r-down-expired" });

    await expect(getAccessToken()).rejects.toBeInstanceOf(AuthUnavailableError);
    expect(cookieStore.current.values.has(REFRESH_TOKEN_COOKIE)).toBe(true);
  });

  it("is null without any cookie", async () => {
    vi.stubGlobal("fetch", vi.fn());
    cookieStore.current = fakeCookies();
    await expect(getAccessToken()).resolves.toBeNull();
  });
});
