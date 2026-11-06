import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({
  unstable_cache: <T>(fn: T) => fn,
  revalidateTag: vi.fn(),
}));
vi.mock("server-only", () => ({}));

const { readPublicAnswer } = await import("@/lib/zakat/impact");

afterEach(() => {
  vi.restoreAllMocks();
});

function loggedLines(spy: { mock: { calls: unknown[][] } }) {
  return spy.mock.calls.map((call) => JSON.parse(String(call[0])) as Record<string, unknown>);
}

describe("public data failures are logged as JSON lines (privacy-obs-11)", () => {
  it("logs the status and path without the query string", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(readPublicAnswer(new Response("<html>", { status: 502 }), "/impact/stories?phone=0911")).rejects.toThrow();
    const [line] = loggedLines(spy);
    expect(line).toMatchObject({ level: "error", event: "public_data_http_error", label: "zakat_public", path: "/impact/stories", status: 502 });
    expect(JSON.stringify(line)).not.toContain("0911");
  });

  it("logs a reported failure with its message on one line", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const response = new Response(JSON.stringify({ success: false, message: "db\n  down" }), { status: 200 });
    await expect(readPublicAnswer(response, "/impact/reports")).rejects.toThrow();
    expect(loggedLines(spy)[0]).toMatchObject({ event: "public_data_failure", message: "db down" });
  });

  it("logs a body that isn't JSON", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(readPublicAnswer(new Response("not json", { status: 200 }), "/impact/reports")).rejects.toThrow();
    expect(loggedLines(spy)[0]).toMatchObject({ event: "public_data_not_json", status: 200 });
  });
});
