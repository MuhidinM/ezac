import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { NO_ACCESS_MESSAGE, SESSION_ENDED_MESSAGE, authorizeCaller, withStaffAccessPublic } from "@/lib/api/bff";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "@/lib/auth/constants";

import { accessToken, fakeCookies, jsonResponse, type FakeCookieStore } from "./fixtures/tokens";

vi.mock("server-only", () => ({}));

const cookieStore: { current: FakeCookieStore } = { current: fakeCookies() };

vi.mock("next/headers", () => ({
  cookies: async () => cookieStore.current,
  headers: async () => new Headers(),
}));

const API_BASE_URL = process.env.API_BASE_URL;
let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  process.env.API_BASE_URL = "https://gateway.test";
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  if (API_BASE_URL === undefined) delete process.env.API_BASE_URL;
  else process.env.API_BASE_URL = API_BASE_URL;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function signedInWith(token: string) {
  cookieStore.current = fakeCookies({ [ACCESS_TOKEN_COOKIE]: token, [REFRESH_TOKEN_COOKIE]: `refresh-for-${token.slice(-20)}` });
}

function meAnswers(response: Response | Error) {
  fetchMock.mockImplementation(async (url: URL) => {
    expect(String(url)).toBe("https://gateway.test/api/auth/v1/me");
    if (response instanceof Error) throw response;
    return response;
  });
}

async function bodyOf(response: Response) {
  return (await response.json()) as { success: boolean; message?: string; data?: unknown };
}

describe("authorizeCaller", () => {
  it("lets a token with the role through without asking the gateway", async () => {
    signedInWith(accessToken(["ADMIN"]));
    const auth = await authorizeCaller("admin");
    expect(auth.ok).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("asks /me before refusing a token without the role (Keycloak may keep the roles there)", async () => {
    signedInWith(accessToken([]));
    meAnswers(jsonResponse({ success: true, data: { sub: "u", roles: ["FIELD_OFFICER"] } }));
    const auth = await authorizeCaller("staff");
    expect(auth.ok && auth.caller.session.isStaff).toBe(true);
  });

  it("refuses with 403 when neither the token nor /me has the role", async () => {
    signedInWith(accessToken(["BRANCH"]));
    meAnswers(jsonResponse({ success: true, data: { sub: "u", roles: ["BRANCH"] } }));
    const auth = await authorizeCaller("staff");
    expect(auth.ok).toBe(false);
    if (!auth.ok) {
      expect(auth.response.status).toBe(403);
      expect((await bodyOf(auth.response)).message).toBe(NO_ACCESS_MESSAGE);
    }
  });

  it("answers 401 with no session at all", async () => {
    cookieStore.current = fakeCookies();
    const auth = await authorizeCaller("portal");
    expect(!auth.ok && auth.response.status).toBe(401);
  });
});

describe("authorizeCaller with verify (registration routes)", () => {
  it("refuses a hand-made ADMIN token: the gateway doesn't accept it, so the session ends", async () => {
    signedInWith(accessToken(["ADMIN"], { iss: "made-up" }));
    meAnswers(jsonResponse({ success: false, message: "Unauthorized" }, 401));

    const auth = await authorizeCaller("staff", { verify: true });
    expect(auth.ok).toBe(false);
    if (!auth.ok) {
      expect(auth.response.status).toBe(401);
      expect((await bodyOf(auth.response)).message).toBe(SESSION_ENDED_MESSAGE);
    }
    expect(cookieStore.current.values.size).toBe(0);
  });

  it("accepts a token the gateway confirms, and remembers the answer for that token", async () => {
    const token = accessToken(["ADMIN"]);
    signedInWith(token);
    meAnswers(jsonResponse({ success: true, data: { sub: "u", roles: ["ADMIN"] } }));

    expect((await authorizeCaller("staff", { verify: true })).ok).toBe(true);
    expect((await authorizeCaller("staff", { verify: true })).ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("refuses a blocked account even though its token claims the role", async () => {
    signedInWith(accessToken(["ADMIN"]));
    meAnswers(jsonResponse({ success: false, message: "Account disabled" }, 403));
    const auth = await authorizeCaller("staff", { verify: true });
    expect(!auth.ok && auth.response.status).toBe(403);
  });

  it("asks to retry (503) when the gateway can't be reached, keeping the session", async () => {
    signedInWith(accessToken(["ADMIN"]));
    meAnswers(new TypeError("fetch failed"));
    const auth = await authorizeCaller("staff", { verify: true });
    expect(!auth.ok && auth.response.status).toBe(503);
    expect(cookieStore.current.values.has(ACCESS_TOKEN_COOKIE)).toBe(true);
  });
});

describe("withStaffAccessPublic", () => {
  it("never runs the handler for a token the gateway rejects", async () => {
    signedInWith(accessToken(["ADMIN"]));
    meAnswers(jsonResponse({ success: false }, 401));
    const handler = vi.fn(async () => "registered");

    const response = await withStaffAccessPublic(handler, { access: "staff", label: "test" });
    expect(response.status).toBe(401);
    expect(handler).not.toHaveBeenCalled();
  });

  it("runs the handler once the gateway confirms the token", async () => {
    signedInWith(accessToken(["FIELD_OFFICER"]));
    meAnswers(jsonResponse({ success: true, data: { sub: "u", roles: ["FIELD_OFFICER"] } }));

    const response = await withStaffAccessPublic(async () => ({ id: 1 }), { access: "staff", label: "test" });
    expect(response.status).toBe(200);
    expect(await bodyOf(response)).toEqual({ success: true, data: { id: 1 } });
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  });
});
