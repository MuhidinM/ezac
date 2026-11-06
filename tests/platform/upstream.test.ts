import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest";

import { ApiError } from "@/lib/api/errors";
import {
  UPSTREAM_MESSAGES,
  fallbackMessage,
  readEnvelope,
  upstreamError,
  upstreamFetch,
  type UpstreamCall,
} from "@/lib/api/upstream";

vi.mock("server-only", () => ({}));

const API_BASE_URL = process.env.API_BASE_URL;

let errorLog: MockInstance<typeof console.error>;

beforeEach(() => {
  process.env.API_BASE_URL = "https://gateway.test";
  errorLog = vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  if (API_BASE_URL === undefined) delete process.env.API_BASE_URL;
  else process.env.API_BASE_URL = API_BASE_URL;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

/** A finished call for the mapping functions, as upstreamFetch would return it. */
function callWith(response: Response): UpstreamCall {
  return {
    response,
    requestId: "req-1",
    label: "test",
    method: "GET",
    path: "/api/x",
    settle: () => undefined,
    timedOut: () => false,
  };
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function loggedLines(): Record<string, unknown>[] {
  return errorLog.mock.calls.map((call) => JSON.parse(String(call[0])) as Record<string, unknown>);
}

describe("upstreamError: 4xx answers", () => {
  it("passes the gateway's message, field errors, data and code through", () => {
    const body = {
      message: "Phone already registered",
      errors: [{ field: "phone", message: "Taken" }, { bad: true }],
      data: { existingId: 7 },
      code: "DUPLICATE",
    };
    const error = upstreamError(callWith(json(body, 409)), body);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 409,
      message: "Phone already registered",
      errors: [{ field: "phone", message: "Taken" }],
      data: { existingId: 7 },
      code: "DUPLICATE",
      requestId: "req-1",
    });
    expect(errorLog).not.toHaveBeenCalled();
  });

  it("falls back to a plain message when the body has none, or only the HTTP reason phrase", () => {
    expect(upstreamError(callWith(new Response(null, { status: 403 })), null).message).toBe(fallbackMessage(403));
    expect(upstreamError(callWith(json({ error: "Not Found" }, 404)), { error: "Not Found" }).message).toBe(
      "We couldn't find that. It may have been removed.",
    );
    expect(upstreamError(callWith(json({ message: "No message available" }, 400)), { message: "No message available" }).message).toBe(
      "Some details weren't accepted. Check what you entered and try again.",
    );
  });
});

describe("upstreamError: 5xx answers", () => {
  it("hides the gateway's text, keeps a safe code and the request id, and logs one JSON line", () => {
    const body = { message: "NullPointerException at com.ezac.Foo", code: "BANK_UNAVAILABLE", requestId: "gw-9" };
    const error = upstreamError(callWith(json(body, 500)), body);
    expect(error).toMatchObject({
      status: 500,
      message: UPSTREAM_MESSAGES.serverError,
      code: "BANK_UNAVAILABLE",
      requestId: "req-1",
      errors: [],
    });
    const [line] = loggedLines();
    expect(line).toMatchObject({
      level: "error",
      event: "gateway_error",
      label: "test",
      requestId: "req-1",
      upstreamRequestId: "gw-9",
      method: "GET",
      path: "/api/x",
      status: 500,
      message: "NullPointerException at com.ezac.Foo",
    });
  });

  it("drops free text that only looks like a code", () => {
    const body = { code: "connection refused to db" };
    expect(upstreamError(callWith(json(body, 503)), body).code).toBeNull();
  });
});

describe("readEnvelope", () => {
  it("returns data from a success envelope, and null for an empty answer", async () => {
    await expect(readEnvelope(callWith(json({ success: true, data: { id: 1 } })))).resolves.toEqual({ id: 1 });
    await expect(readEnvelope(callWith(new Response(null, { status: 204 })))).resolves.toBeNull();
  });

  it("treats success: false on a 2xx like a refusal, with the gateway's message", async () => {
    const error = await readEnvelope(callWith(json({ success: false, message: "Price not set" }))).catch((e: unknown) => e);
    expect(error).toMatchObject({ status: 200, message: "Price not set" });
  });

  it("turns an answer that isn't JSON into a logged 502", async () => {
    const error = await readEnvelope(callWith(new Response("<html>", { status: 200 }))).catch((e: unknown) => e);
    expect(error).toMatchObject({ status: 502, message: UPSTREAM_MESSAGES.unreadable, requestId: "req-1" });
    expect(loggedLines()[0]).toMatchObject({ event: "gateway_error", message: "unreadable answer" });
  });

  it("maps an error status with an envelope body", async () => {
    const error = await readEnvelope(callWith(json({ success: false, message: "Not allowed" }, 403))).catch((e: unknown) => e);
    expect(error).toMatchObject({ status: 403, message: "Not allowed" });
  });
});

describe("upstreamFetch", () => {
  it("calls the gateway with an X-Request-Id and no caching", async () => {
    const fetchMock = vi.fn(async () => json({ success: true, data: null }));
    vi.stubGlobal("fetch", fetchMock);

    const call = await upstreamFetch("/api/x?q=abebe", { method: "post" }, { label: "test", requestId: "req-7" });
    expect(call.requestId).toBe("req-7");
    expect(call.method).toBe("POST");
    // The query (search terms) stays out of what gets logged.
    expect(call.path).toBe("/api/x");

    const [url, init] = fetchMock.mock.calls[0] as unknown as [URL, RequestInit];
    expect(String(url)).toBe("https://gateway.test/api/x?q=abebe");
    expect(new Headers(init.headers).get("X-Request-Id")).toBe("req-7");
    expect(init.cache).toBe("no-store");
    call.settle();
  });

  it("leaves the id out of calls Next caches, so each one isn't a cache miss", async () => {
    const fetchMock = vi.fn(async () => json({ success: true, data: null }));
    vi.stubGlobal("fetch", fetchMock);
    const call = await upstreamFetch("/api/public", { next: { revalidate: 60 } } as RequestInit, { label: "test" });
    const [, init] = fetchMock.mock.calls[0] as unknown as [URL, RequestInit];
    expect(new Headers(init.headers).has("X-Request-Id")).toBe(false);
    expect(init.cache).toBeUndefined();
    call.settle();
  });

  it("turns a network failure into a logged 502 with the request id", async () => {
    const failure = new TypeError("fetch failed", { cause: { code: "ECONNREFUSED", message: "connect ECONNREFUSED" } });
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(failure)));

    const error = await upstreamFetch("/api/x", {}, { label: "test", requestId: "req-2" }).catch((e: unknown) => e);
    expect(error).toMatchObject({ status: 502, message: UPSTREAM_MESSAGES.unreachable, requestId: "req-2" });
    expect(loggedLines()[0]).toMatchObject({
      event: "gateway_unreachable",
      label: "test",
      requestId: "req-2",
      gateway: "https://gateway.test",
      code: "ECONNREFUSED",
      hint: "nothing is listening there: check API_BASE_URL",
    });
  });

  it("gives up after the timeout with a logged 504", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn(
        (_url: URL, init: RequestInit) =>
          new Promise<Response>((_resolve, reject) => {
            init.signal?.addEventListener("abort", () => reject(init.signal?.reason));
          }),
      ),
    );

    const pending = upstreamFetch("/api/slow", {}, { label: "test", requestId: "req-3", timeoutMs: 1_000 }).catch((e: unknown) => e);
    await vi.advanceTimersByTimeAsync(1_000);
    const error = await pending;
    expect(error).toMatchObject({ status: 504, message: UPSTREAM_MESSAGES.timeout, requestId: "req-3" });
    expect(loggedLines()[0]).toMatchObject({ event: "gateway_timeout", requestId: "req-3", path: "/api/slow" });
  });
});
