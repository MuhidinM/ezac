import { afterEach, describe, expect, it, vi } from "vitest";

import { errorFields, formatLogLine, logEvent, oneLine } from "@/lib/api/log";

const GIT_SHA = process.env.GIT_SHA;

afterEach(() => {
  if (GIT_SHA === undefined) delete process.env.GIT_SHA;
  else process.env.GIT_SHA = GIT_SHA;
  vi.restoreAllMocks();
});

describe("formatLogLine", () => {
  it("writes one JSON object with level, event, time and release first", () => {
    process.env.GIT_SHA = "abc123";
    const line = formatLogLine("error", "gateway_error", { requestId: "r-1", status: 502 }, new Date("2026-11-06T09:00:00Z"));
    expect(line).not.toContain("\n");
    expect(JSON.parse(line)).toEqual({
      level: "error",
      event: "gateway_error",
      time: "2026-11-06T09:00:00.000Z",
      release: "abc123",
      requestId: "r-1",
      status: 502,
    });
    expect(Object.keys(JSON.parse(line)).slice(0, 4)).toEqual(["level", "event", "time", "release"]);
  });

  it("leaves out fields that are undefined, and the release when GIT_SHA is unset", () => {
    delete process.env.GIT_SHA;
    const parsed = JSON.parse(formatLogLine("warn", "config", { message: "x", hint: undefined }));
    expect(parsed).not.toHaveProperty("release");
    expect(parsed).not.toHaveProperty("hint");
  });
});

describe("logEvent", () => {
  it("sends errors to stderr, warnings to console.warn and the rest to console.info", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);

    logEvent("fatal", "startup_config");
    logEvent("error", "gateway_error");
    logEvent("warn", "origin_refused");
    logEvent("info", "ready");

    expect(error).toHaveBeenCalledTimes(2);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(info).toHaveBeenCalledTimes(1);
    expect(JSON.parse(String(warn.mock.calls[0][0])).event).toBe("origin_refused");
  });
});

describe("oneLine and errorFields", () => {
  it("flattens whitespace and cuts long text", () => {
    expect(oneLine("a\n   b\tc")).toBe("a b c");
    expect(oneLine("x".repeat(10), 4)).toBe("xxxx…");
  });

  it("names the error, keeps its message and adds the stack only when asked", () => {
    const error = new TypeError("bad\nthing");
    expect(errorFields(error)).toEqual({ error: "TypeError", message: "bad thing", stack: undefined });
    expect(errorFields(error, { stack: true }).stack).toContain("TypeError: bad");
    expect(errorFields("plain")).toEqual({ error: "string", message: "plain" });
  });
});
