import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Outside Next there is no data cache: run the cached reader straight through.
vi.mock("next/cache", () => ({
  unstable_cache: <T>(fn: T) => fn,
  revalidateTag: vi.fn(),
}));
// The real guard throws outside a React Server Components build.
vi.mock("server-only", () => ({}));

const {
  PublicDataUnavailableError,
  collectedEtb,
  fetchPublic,
  getCause,
  getCauses,
  getImpactRegions,
  getImpactReports,
  getScoringBands,
  getStories,
  householdFigures,
  needBands,
  readPublicAnswer,
} = await import("@/lib/zakat/impact");

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

describe("Amharic content", () => {
  afterEach(() => vi.restoreAllMocks());

  const urlOf = async (load: () => Promise<unknown>) => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(json({ success: true, data: [] }));
    await load();
    const url = String(fetchMock.mock.calls[0][0]);
    fetchMock.mockRestore();
    return url;
  };

  it("asks for Amharic text on Amharic pages only", async () => {
    expect(await urlOf(() => getCauses({ page: 1, limit: 6, locale: "am" }))).toMatch(/\/causes\?status=active&page=1&limit=6&lang=am$/);
    expect(await urlOf(() => getCause("12", "am"))).toMatch(/\/causes\/12\?lang=am$/);
    expect(await urlOf(() => getStories(2, 12, "am"))).toMatch(/\/impact\/stories\?page=2&limit=12&lang=am$/);
    expect(await urlOf(() => getImpactRegions("am"))).toMatch(/\/impact\/regions\?lang=am$/);
  });

  it("reads English for the other languages", async () => {
    expect(await urlOf(() => getCause("12", "om"))).toMatch(/\/causes\/12$/);
    expect(await urlOf(() => getImpactRegions("ar"))).toMatch(/\/impact\/regions$/);
  });
});

describe("scoring bands", () => {
  afterEach(() => vi.restoreAllMocks());

  const answer = {
    version: 3,
    activeSince: "2026-11-01T07:00:00Z",
    maxTotal: 270,
    bands: [
      { risk: "MEDIUM", min: 120, max: 179 },
      { risk: "LOW", min: 0, max: 119 },
      { risk: "HIGH", min: 180, max: 270 },
    ],
  };

  it("reads them from beneficiary-service's public path", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(json({ success: true, data: answer }));
    await expect(getScoringBands()).resolves.toEqual(answer);
    expect(String(fetchMock.mock.calls[0][0])).toMatch(/\/api\/beneficiaries\/v1\/public\/scoring-bands$/);
  });

  it("orders the bands low to high, each up to where the next starts", () => {
    expect(needBands(answer)).toEqual({
      maxTotal: 270,
      bands: [
        { key: "low", min: 0, max: 119, from: 0, to: 120 },
        { key: "medium", min: 120, max: 179, from: 120, to: 180 },
        { key: "high", min: 180, max: 270, from: 180, to: 270 },
      ],
    });
  });

  it.each([
    ["nothing", null],
    ["two bands", { ...answer, bands: answer.bands.slice(0, 2) }],
    ["an unknown risk", { ...answer, bands: [...answer.bands.slice(0, 2), { risk: "SEVERE", min: 180, max: 270 }] }],
    ["no maximum", { ...answer, maxTotal: 0 }],
  ])("is null for %s, so the page keeps its example", (_, data) => {
    expect(needBands(data)).toBeNull();
  });
});

describe("home figures", () => {
  const home = {
    totalCollectedEtb: 70,
    totalBeneficiariesSupported: 2,
    liveCollectedEtb: 70,
    offlineCollectedEtb: 0,
    asOf: null,
  };

  it("shows the total, never the total plus its parts", () => {
    expect(collectedEtb(home)).toBe(70);
    expect(collectedEtb({ ...home, totalCollectedEtb: 1500, liveCollectedEtb: 1000, offlineCollectedEtb: 500 })).toBe(1500);
  });

  it("adds the parts only when there is no total", () => {
    expect(collectedEtb({ ...home, totalCollectedEtb: null, liveCollectedEtb: 1000, offlineCollectedEtb: 500 })).toBe(1500);
    expect(collectedEtb({ ...home, totalCollectedEtb: null, liveCollectedEtb: null, offlineCollectedEtb: null })).toBeNull();
    expect(collectedEtb(null)).toBeNull();
  });

  const impact = { livesTouched: 2 } as Parameters<typeof householdFigures>[1];

  it("shows families and lives once when they are the same households", () => {
    expect(householdFigures(home, impact)).toEqual({ families: 2, lives: null });
  });

  it("keeps lives touched when an admin entered a different figure", () => {
    expect(householdFigures(home, { ...impact!, livesTouched: 42 })).toEqual({ families: 2, lives: 42 });
    expect(householdFigures(null, impact)).toEqual({ families: null, lives: 2 });
  });
});
