import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { previousRangeDates, rangeDates } from "@/lib/backoffice/date-range";

describe("previousRangeDates", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-06T10:00:00"));
  });
  afterEach(() => vi.useRealTimers());

  it("is the 30 days just before the last 30 days", () => {
    expect(rangeDates("30d")).toEqual({ from: "2026-10-08", to: "2026-11-06" });
    expect(previousRangeDates("30d")).toEqual({ from: "2026-09-08", to: "2026-10-07" });
  });

  it("is the 90 days just before the last 90 days", () => {
    expect(rangeDates("90d")).toEqual({ from: "2026-08-09", to: "2026-11-06" });
    expect(previousRangeDates("90d")).toEqual({ from: "2026-05-11", to: "2026-08-08" });
  });

  it("is the 12 months just before the last 12 months", () => {
    expect(rangeDates("1y")).toEqual({ from: "2025-11-06", to: "2026-11-06" });
    expect(previousRangeDates("1y")).toEqual({ from: "2024-11-06", to: "2025-11-05" });
  });
});
