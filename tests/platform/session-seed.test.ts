import { afterEach, describe, expect, it, vi } from "vitest";

import { ACCESS_TOKEN_COOKIE, PASSWORD_CHANGE_COOKIE, REFRESH_TOKEN_COOKIE } from "@/lib/auth/constants";

import { accessToken, epoch, fakeCookies, makeJwt, type FakeCookieStore } from "./fixtures/tokens";

vi.mock("server-only", () => ({}));

const cookieStore: { current: FakeCookieStore } = { current: fakeCookies() };
const fetchSpy = vi.fn();

vi.mock("next/headers", () => ({
  cookies: async () => cookieStore.current,
  headers: async () => new Headers(),
}));

const { getSessionSeed, sessionSeedFromAccessToken } = await import("@/lib/auth/session");

afterEach(() => {
  cookieStore.current = fakeCookies();
  vi.unstubAllGlobals();
  fetchSpy.mockReset();
});

describe("sessionSeedFromAccessToken (perf-9)", () => {
  it("seeds from a valid token with an EZAC role, naming the user from `name`", () => {
    const seed = sessionSeedFromAccessToken(accessToken(["ADMIN"], { name: " Amina K " }));
    expect(seed).toMatchObject({ username: "staff.user", displayName: "Amina K", roles: ["ADMIN"], isAdmin: true });
  });

  it("gives no seed for a role-less, expired, unreadable or missing token", () => {
    expect(sessionSeedFromAccessToken(accessToken([]))).toBeNull();
    expect(sessionSeedFromAccessToken(accessToken(["offline_access"]))).toBeNull();
    expect(sessionSeedFromAccessToken(makeJwt({ exp: epoch(-1), realm_access: { roles: ["ADMIN"] } }))).toBeNull();
    expect(sessionSeedFromAccessToken("garbage")).toBeNull();
    expect(sessionSeedFromAccessToken(undefined)).toBeNull();
  });
});

describe("getSessionSeed", () => {
  it("reads the access cookie only, never refreshing", async () => {
    vi.stubGlobal("fetch", fetchSpy);
    cookieStore.current = fakeCookies({ [ACCESS_TOKEN_COOKIE]: accessToken(["FIELD_OFFICER"]) });
    await expect(getSessionSeed()).resolves.toMatchObject({ roles: ["FIELD_OFFICER"], isStaff: true });

    // Expired access token with a refresh token: no seed, and no call to redeem it.
    cookieStore.current = fakeCookies({
      [ACCESS_TOKEN_COOKIE]: makeJwt({ exp: epoch(-1), realm_access: { roles: ["ADMIN"] } }),
      [REFRESH_TOKEN_COOKIE]: "refresh",
    });
    await expect(getSessionSeed()).resolves.toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("gives no seed while a password change is pending", async () => {
    cookieStore.current = fakeCookies({
      [ACCESS_TOKEN_COOKIE]: accessToken(["ADMIN"]),
      [PASSWORD_CHANGE_COOKIE]: "1",
    });
    await expect(getSessionSeed()).resolves.toBeNull();
  });
});
