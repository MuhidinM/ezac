import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Outside Next there is no data cache: run the cached reader straight through.
vi.mock("next/cache", () => ({
  unstable_cache: <T>(fn: T) => fn,
  revalidateTag: vi.fn(),
}));
// The real guard throws outside a React Server Components build.
vi.mock("server-only", () => ({}));

const { PublicDataUnavailableError, fetchPublic, getImpactReports, getStories, readPublicAnswer } = await import(
  "@/lib/zakat/impact"
);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

describe("readPublicAnswer", () => {
  it("returns the data of a successful answer", async () => {
    await expect(readPublicAnswer(json({ success: true, data: { id: "2" } }), "/impact/stories/2")).resolves.toEqual({
      id: "2",
    });
  });

  // A taken-down story or cause answers 404. That must be an answer (null),
  // which the cache keeps, not an error, which it would skip (UAT #15).
  it.each([404, 410, 400])("reads HTTP %i as not published", async (status) => {
    await expect(readPublicAnswer(json({ message: "Story not found" }, status), "/impact/stories/2")).resolves.toBeNull();
  });

  it("reads the service's own 503 'nothing yet' as not published where that is its meaning", async () => {
    await expect(readPublicAnswer(json({ success: false }, 503), "/calculator/config", true)).resolves.toBeNull();
  });

  it.each([
    ["a gateway 503", () => new Response("<html>Bad gateway</html>", { status: 503 })],
    ["a 500", () => json({ success: false }, 500)],
    ["a body that isn't JSON", () => new Response("<html></html>", { status: 200 })],
    ["success: false", () => json({ success: false, message: "boom" })],
  ])("throws on %s, so the last good copy stays up", async (_, response) => {
    await expect(readPublicAnswer(response(), "/impact/stories/2", true)).rejects.toBeInstanceOf(
      PublicDataUnavailableError,
    );
  });
});

describe("fetchPublic", () => {
  beforeEach(() => vi.spyOn(console, "error").mockImplementation(() => {}));
  afterEach(() => vi.restoreAllMocks());

  it("asks zakat-engine directly, outside Next's fetch cache", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(json({ success: true, data: [] }));
    await fetchPublic("/impact/regions");
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toMatch(/\/api\/zakat\/v1\/impact\/regions$/);
    expect(init?.cache).toBe("no-store");
  });

  it("throws when the gateway can't be reached", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("fetch failed"));
    await expect(fetchPublic("/impact/stories/2")).rejects.toBeInstanceOf(PublicDataUnavailableError);
  });
});

describe("list pages", () => {
  afterEach(() => vi.restoreAllMocks());

  it("passes the page and size through and keeps the pagination", async () => {
    const page = { items: [{ id: "7" }], pagination: { page: 2, limit: 12, totalItems: 13, totalPages: 2 } };
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(json({ success: true, data: page }));
    await expect(getStories(2, 12)).resolves.toEqual(page);
    expect(String(fetchMock.mock.calls[0][0])).toMatch(/\/impact\/stories\?page=2&limit=12$/);
  });

  it("reads a plain list of reports as one page", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(json({ success: true, data: [{ id: "1" }, { id: "2" }] }));
    await expect(getImpactReports(1, 20)).resolves.toEqual({
      items: [{ id: "1" }, { id: "2" }],
      pagination: { page: 1, limit: 20, totalItems: 2, totalPages: 1 },
    });
  });
});
