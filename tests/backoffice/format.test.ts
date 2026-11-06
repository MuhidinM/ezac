import { afterEach, describe, expect, it, vi } from "vitest";

import { formatBytes, formatDate, formatDays, formatEtb, todayIso } from "@/lib/backoffice/format";

// The portal writes amounts "ETB 1,234"; tests/kit/format.test.ts covers the rest.
describe("formatEtb", () => {
  it("groups thousands and shows cents only when there are any", () => {
    expect(formatEtb(0)).toBe("ETB 0");
    expect(formatEtb(1000)).toBe("ETB 1,000");
    expect(formatEtb(1234567.5)).toBe("ETB 1,234,567.50");
    expect(formatEtb(0.125)).toBe("ETB 0.13");
    expect(formatEtb(-250)).toBe("ETB -250");
  });

  it("shows a dash when there is no amount", () => {
    expect(formatEtb(null)).toBe("—");
    expect(formatEtb(undefined)).toBe("—");
  });
});

// Node applies a change to process.env.TZ straight away, so these tests
// check each zone whatever zone the machine running them is in.
const ZONES = ["Africa/Addis_Ababa", "UTC", "America/Los_Angeles", "Pacific/Kiritimati"];
const machineZone = process.env.TZ;

function useTimeZone(zone: string) {
  process.env.TZ = zone;
}

afterEach(() => {
  if (machineZone === undefined) delete process.env.TZ;
  else process.env.TZ = machineZone;
});

it("switches time zone (or the zone tests below prove nothing)", () => {
  useTimeZone("America/Los_Angeles");
  expect(new Date(Date.UTC(2026, 10, 5)).getDate()).toBe(4);
  useTimeZone("Pacific/Kiritimati");
  expect(new Date(Date.UTC(2026, 10, 5, 12)).getDate()).toBe(6);
});

describe("formatDate", () => {
  // "en-ET" has no locale data of its own and resolves to "en" (Node and Chromium alike).
  it.each(ZONES)("reads a date-only value as that calendar day in %s", (zone) => {
    useTimeZone(zone);
    expect(formatDate("2026-11-05")).toBe("Nov 5, 2026");
    expect(formatDate("2026-01-01")).toBe("Jan 1, 2026");
  });

  it("returns a value it can't read unchanged", () => {
    expect(formatDate("not a date")).toBe("not a date");
  });

  it("shows a dash when there is no date", () => {
    expect(formatDate(null)).toBe("—");
    expect(formatDate(undefined)).toBe("—");
    expect(formatDate("")).toBe("—");
  });
});

describe("formatDays", () => {
  it("shows a day or more in days, to one decimal", () => {
    expect(formatDays(1)).toBe("1.0 d");
    expect(formatDays(2.5)).toBe("2.5 d");
    expect(formatDays(12.345)).toBe("12.3 d");
  });

  it("shows less than a day in whole hours", () => {
    expect(formatDays(0.5)).toBe("12 h");
    expect(formatDays(0.3)).toBe("7 h");
    expect(formatDays(1 / 24)).toBe("1 h");
  });

  it("says under an hour rather than 0 h", () => {
    expect(formatDays(0)).toBe("Under 1 h");
    expect(formatDays(0.01)).toBe("Under 1 h");
  });

  it("shows a dash when there is no number", () => {
    expect(formatDays(null)).toBe("—");
    expect(formatDays(undefined)).toBe("—");
    expect(formatDays(Number.NaN)).toBe("—");
    expect(formatDays(Number.POSITIVE_INFINITY)).toBe("—");
  });
});

describe("formatBytes", () => {
  it("picks B, KB or MB", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(1023)).toBe("1023 B");
    expect(formatBytes(1024)).toBe("1 KB");
    expect(formatBytes(1536)).toBe("2 KB");
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.0 MB");
    expect(formatBytes(20.25 * 1024 * 1024)).toBe("20.3 MB");
  });

  it("is empty for no size", () => {
    expect(formatBytes(0)).toBe("");
    expect(formatBytes(null)).toBe("");
    expect(formatBytes(undefined)).toBe("");
  });
});

describe("todayIso", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  // The local calendar day, not the UTC one: near midnight the two differ
  // in Addis Ababa (UTC+3) and in any zone away from UTC.
  it.each(ZONES)("is the local date in %s, just after midnight and just before", (zone) => {
    useTimeZone(zone);
    vi.useFakeTimers({ toFake: ["Date"] });
    for (const [hour, minute] of [
      [0, 30],
      [12, 0],
      [23, 30],
    ]) {
      vi.setSystemTime(new Date(2026, 10, 5, hour, minute));
      expect(todayIso()).toBe("2026-11-05");
    }
  });
});
