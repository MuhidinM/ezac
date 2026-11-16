import { beforeEach, describe, expect, it, vi } from "vitest";

const expire = vi.fn();
vi.mock("@/lib/zakat/public-cache", () => ({ expirePublicZakatData: expire }));

const { POST } = await import("@/app/bff/internal/expire-public/route");

function call(headers: Record<string, string>) {
  return POST(new Request("http://127.0.0.1:3001/bff/internal/expire-public", { method: "POST", headers }));
}

describe("POST /bff/internal/expire-public", () => {
  beforeEach(() => expire.mockClear());

  it("expires the cache for a direct loopback call from the other colour", async () => {
    // Next itself sets X-Forwarded-For from the socket on direct calls.
    const response = await call({ host: "127.0.0.1:3001", "x-forwarded-for": "127.0.0.1" });
    expect(response.status).toBe(204);
    expect(expire).toHaveBeenCalledOnce();
  });

  it("refuses anything that came through nginx or names another host", async () => {
    const refused: Record<string, string>[] = [
      { host: "ezaac.com", "x-real-ip": "196.188.1.1", "x-forwarded-for": "196.188.1.1" },
      { host: "ezaac.com" },
      { host: "127.0.0.1:3001", "x-real-ip": "196.188.1.1" },
      { host: "localhost:3001" },
    ];
    for (const headers of refused) {
      expect((await call(headers)).status).toBe(404);
    }
    expect(expire).not.toHaveBeenCalled();
  });
});
