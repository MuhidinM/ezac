import { describe, expect, it } from "vitest";

import { dateRangeProblem, scoreRangeProblem } from "@/lib/backoffice/list-filters";

describe("scoreRangeProblem", () => {
  it("accepts open-ended and ordered ranges", () => {
    expect(scoreRangeProblem("", "")).toBeNull();
    expect(scoreRangeProblem("100", "")).toBeNull();
    expect(scoreRangeProblem("", "150")).toBeNull();
    expect(scoreRangeProblem("100", "100")).toBeNull();
    expect(scoreRangeProblem(" 90 ", "200", 270)).toBeNull();
  });

  it("flags a minimum above the maximum (UAT: 200 / 100 showed 'Nothing matches')", () => {
    expect(scoreRangeProblem("200", "100")).toBe("The minimum is higher than the maximum.");
  });

  it("flags values outside 0..max", () => {
    expect(scoreRangeProblem("-5", "")).toBe("Scores can't be below 0.");
    expect(scoreRangeProblem("", "300", 270)).toBe("Scores go up to 270.");
  });

  it("flags text that isn't a number", () => {
    expect(scoreRangeProblem("abc", "")).toBe("Enter the scores as numbers.");
  });
});

describe("dateRangeProblem", () => {
  it("accepts empty, open and ordered ranges", () => {
    expect(dateRangeProblem("", "")).toBeNull();
    expect(dateRangeProblem("2026-10-01", "")).toBeNull();
    expect(dateRangeProblem("2026-10-01", "2026-10-01")).toBeNull();
    expect(dateRangeProblem("2026-10-01", "2026-11-05")).toBeNull();
  });

  it("flags a start after the end (UAT: 2026-11-05 to 2026-10-01)", () => {
    expect(dateRangeProblem("2026-11-05", "2026-10-01")).toBe("The start date is after the end date.");
  });
});
