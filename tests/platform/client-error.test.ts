import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest";

import { buildClientErrorReport, isNoise } from "@/components/errors/report-client-error";
import {
  browserFamily,
  sanitizeClientError,
  scrubMessage,
  scrubPath,
  scrubStack,
  scrubText,
} from "@/lib/api/client-error";
import { createRequestLimiter } from "@/lib/auth/rate-limit";

vi.mock("server-only", () => ({}));

describe("scrubText", () => {
  it("drops query strings and fragments but keeps paths and stack positions", () => {
    expect(scrubText("GET /dashboard/beneficiary?q=abebe&page=2 failed")).toBe("GET /dashboard/beneficiary failed");
    expect(scrubText("at f (https://ezac.example/_next/static/chunks/a.js?dpl=7:1:200)")).toBe(
      "at f (https://ezac.example/_next/static/chunks/a.js:1:200)",
    );
    expect(scrubText("f@https://ezac.example/x.js?v=1#top:3:4")).toBe("f@https://ezac.example/x.js:3:4");
    expect(scrubText("see /causes#donate")).toBe("see /causes");
  });

  it("leaves ordinary sentences with question marks alone", () => {
    expect(scrubText("Is the value a/b? Not sure")).toBe("Is the value a/b? Not sure");
  });

  it("masks emails, tokens, long numbers and Ethiopic or Arabic text", () => {
    expect(scrubText("mail abebe.k@example.com now")).toBe("mail [email] now");
    expect(scrubText("token eyJhbGciOi.eyJzdWIiOiIx.c2ln here")).toBe("token [token] here");
    expect(scrubText("Authorization: Bearer abc.def-123")).toBe("Authorization: Bearer [token]");
    expect(scrubText("call 0911234567 or +251 911 234 567")).toBe("call [number] or [number]");
    expect(scrubText("account 1000123456789")).toBe("account [number]");
    expect(scrubText("from 10.20.30.40")).toBe("from [number]");
    expect(scrubText("name አበበ ከበደ end")).toBe("name [text] end");
    expect(scrubText("name محمد علي end")).toBe("name [text] end");
  });

  it("keeps short numbers such as line numbers and counts", () => {
    expect(scrubText("line 12:345, 3 items, 2026")).toBe("line 12:345, 3 items, 2026");
  });

  it("flattens to one line and cuts to the limit", () => {
    expect(scrubText("a\n\nb")).toBe("a b");
    expect(scrubText("x".repeat(20), 5)).toBe("xxxxx…");
  });
});

describe("scrubMessage, scrubStack and scrubPath", () => {
  it("hides double-quoted input that JSON.parse errors echo back", () => {
    expect(scrubMessage('Unexpected token \'A\', "Abebe Kebede" is not valid JSON')).toBe(
      'Unexpected token \'A\', "…" is not valid JSON',
    );
  });

  it("keeps the first ten frames of a stack", () => {
    const stack = ["TypeError: x", ...Array.from({ length: 15 }, (_, i) => `    at f${i} (https://e.example/a.js?v=1:${i}:1)`)].join("\n");
    const lines = scrubStack(stack).split("\n");
    expect(lines).toHaveLength(10);
    expect(lines[1]).toBe("at f0 (https://e.example/a.js:0:1)");
  });

  it("keeps only the path, with long numbers masked", () => {
    expect(scrubPath("/dashboard/beneficiary/12345678?tab=docs#x")).toBe("/dashboard/beneficiary/[number]");
    expect(scrubPath("/am/causes")).toBe("/am/causes");
    expect(scrubPath("https://evil.example/")).toBeUndefined();
  });
});

describe("sanitizeClientError", () => {
  it("keeps the known fields, scrubbed, and drops everything else", () => {
    const report = sanitizeClientError({
      source: "boundary",
      scope: "dashboard",
      name: "TypeError",
      message: "failed for abebe@example.com",
      stack: "TypeError: failed\n    at g (/x.js?token=1:1:2)",
      path: "/dashboard/pool?q=x",
      cookie: "ezac_access_token=secret",
      userAgent: "full UA",
    });
    expect(report).toEqual({
      source: "boundary",
      scope: "dashboard",
      name: "TypeError",
      message: "failed for [email]",
      stack: "TypeError: failed\nat g (/x.js:1:2)",
      path: "/dashboard/pool",
    });
  });

  it("refuses anything that isn't a report", () => {
    expect(sanitizeClientError(null)).toBeNull();
    expect(sanitizeClientError([])).toBeNull();
    expect(sanitizeClientError({ source: "console", message: "x" })).toBeNull();
    expect(sanitizeClientError({ source: "error" })).toBeNull();
  });

  it("drops a scope or name that isn't a short identifier", () => {
    const report = sanitizeClientError({ source: "error", message: "x", scope: "<script>", name: "a b" });
    expect(report?.scope).toBeUndefined();
    expect(report?.name).toBeUndefined();
  });
});

describe("browserFamily", () => {
  it.each([
    [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      "Chrome 131 on Windows",
    ],
    [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0",
      "Edge 131 on Windows",
    ],
    [
      "Mozilla/5.0 (Linux; Android 13; SM-A135F) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/23.0 Chrome/115.0.0.0 Mobile Safari/537.36",
      "Samsung Internet 23 on Android",
    ],
    [
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
      "Safari 17 on iOS",
    ],
    ["Mozilla/5.0 (X11; Linux x86_64; rv:132.0) Gecko/20100101 Firefox/132.0", "Firefox 132 on Linux"],
    ["curl/8.5.0", "other"],
  ])("%s", (userAgent, expected) => {
    expect(browserFamily(userAgent)).toBe(expected);
  });

  it("is undefined without a header", () => {
    expect(browserFamily(null)).toBeUndefined();
  });
});

describe("the browser side", () => {
  it("skips noise: hidden cross-origin errors, extensions, aborts, offline and signed-out API errors", () => {
    expect(isNoise(null, "Script error.", "")).toBe(true);
    expect(isNoise(null, "ResizeObserver loop completed with undelivered notifications.", "")).toBe(true);
    expect(isNoise(new Error("x"), "x", "at chrome-extension://abc/content.js:1:1")).toBe(true);
    expect(isNoise(new DOMException("aborted", "AbortError"), "aborted", "")).toBe(true);
    expect(isNoise({ name: "ApiError", status: 0 }, "No connection", "")).toBe(true);
    expect(isNoise({ name: "ApiError", status: 401 }, "Sign in again", "")).toBe(true);
    expect(isNoise({ name: "ApiError", status: 500 }, "Something went wrong", "")).toBe(false);
    expect(isNoise(new TypeError("x is undefined"), "x is undefined", "at f (/a.js:1:1)")).toBe(false);
  });

  it("builds a scrubbed report from an Error, a string or anything else", () => {
    const error = new TypeError("Cannot read properties of undefined (reading 'fullName') for 0911234567");
    expect(buildClientErrorReport(error, "error", undefined, "/dashboard/beneficiary/12345678?x=1")).toMatchObject({
      source: "error",
      name: "TypeError",
      message: "Cannot read properties of undefined (reading 'fullName') for [number]",
      path: "/dashboard/beneficiary/[number]",
    });
    expect(buildClientErrorReport("boom", "unhandledrejection")).toMatchObject({ message: "boom", name: undefined });
    expect(buildClientErrorReport({ some: "object" }, "unhandledrejection")?.message).toBe("Non-error object thrown");
    expect(buildClientErrorReport("Script error.", "error")).toBeNull();
  });
});

describe("createRequestLimiter", () => {
  it("allows a number of requests per key and in total each minute", () => {
    const limiter = createRequestLimiter({ perKey: 2, total: 3 });
    const now = 1_000_000;
    expect(limiter.allow("a", now)).toBe(true);
    expect(limiter.allow("a", now)).toBe(true);
    expect(limiter.allow("a", now)).toBe(false);
    expect(limiter.allow("b", now)).toBe(true);
    // The total of 3 is used up, for unknown IPs too.
    expect(limiter.allow("c", now)).toBe(false);
    expect(limiter.allow(null, now)).toBe(false);
    // A new minute starts afresh.
    expect(limiter.allow("a", now + 60_000)).toBe(true);
  });
});

describe("POST /bff/client-error", () => {
  let error: MockInstance<typeof console.error>;
  let ipCounter = 0;

  beforeEach(() => {
    error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    ipCounter += 1;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function post(body: string, headers: Record<string, string> = {}) {
    return new Request("http://localhost:3000/bff/client-error", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-real-ip": `198.51.100.${ipCounter}`,
        "user-agent": "Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36",
        ...headers,
      },
      body,
    });
  }

  it("logs one scrubbed JSON line and answers 204", async () => {
    const { POST } = await import("@/app/bff/client-error/route");
    const response = await POST(
      post(JSON.stringify({ source: "error", name: "TypeError", message: "x for abebe@example.com", path: "/causes?q=1" })),
    );
    expect(response.status).toBe(204);
    expect(error).toHaveBeenCalledTimes(1);
    const line = JSON.parse(String(error.mock.calls[0][0]));
    expect(line).toMatchObject({
      level: "error",
      event: "client_error",
      source: "error",
      name: "TypeError",
      message: "x for [email]",
      path: "/causes",
      browser: "Chrome 131 on Windows",
    });
    expect(line.requestId).toMatch(/^[0-9a-f-]{36}$/);
    expect(JSON.stringify(line)).not.toContain("198.51.100");
  });

  it("refuses other content types, bodies that aren't reports, and oversized bodies", async () => {
    const { POST } = await import("@/app/bff/client-error/route");
    expect((await POST(post("a=1", { "content-type": "application/x-www-form-urlencoded" }))).status).toBe(415);
    expect((await POST(post("not json"))).status).toBe(400);
    expect((await POST(post(JSON.stringify({ source: "nope", message: "x" })))).status).toBe(400);
    expect((await POST(post(JSON.stringify({ source: "error", message: "x".repeat(10_000) })))).status).toBe(413);
    expect(error).not.toHaveBeenCalled();
  });

  it("stops logging a browser after 10 reports a minute", async () => {
    const { POST } = await import("@/app/bff/client-error/route");
    const statuses: number[] = [];
    for (let i = 0; i < 12; i++) {
      statuses.push((await POST(post(JSON.stringify({ source: "error", message: `error ${i}` })))).status);
    }
    expect(statuses.slice(0, 10).every((status) => status === 204)).toBe(true);
    expect(statuses.slice(10)).toEqual([429, 429]);
    expect(error).toHaveBeenCalledTimes(10);
  });
});
