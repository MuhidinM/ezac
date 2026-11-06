import { describe, expect, it } from "vitest";

import { needLevels, validateScoring } from "@/components/scoring/scoring-schema";
import { setPath, type ScoringSchema } from "@/lib/backoffice/scoring-config";

import { schema, validConfig } from "./fixtures/scoring";

function problemsWith(path: string, value: unknown, withSchema: ScoringSchema = schema) {
  return validateScoring(withSchema, setPath(validConfig(), path, value));
}

/** The schema with one field's `min` set. */
function withMin(path: string, min: number): ScoringSchema {
  return { ...schema, fields: schema.fields.map((field) => (field.path === path ? { ...field, min } : field)) };
}

describe("validateScoring", () => {
  it("accepts a valid config, with bands rising or falling", () => {
    expect(validateScoring(schema, validConfig())).toEqual([]);
  });

  it("refuses an empty band list", () => {
    expect(problemsWith("sections.income.per_capita_bands", [])).toEqual([
      "Income per person (ETB) (Income): needs at least one band.",
    ]);
  });

  it("refuses a band that gives more than its section maximum", () => {
    expect(
      problemsWith("sections.debt.ratio_bands", [
        [3, 41],
        [1, 20],
      ]),
    ).toEqual(["Debt compared with income (Debt): a band can't give more than the section maximum (40 points)."]);
    // Exactly the maximum is fine.
    expect(
      problemsWith("sections.debt.ratio_bands", [
        [3, 40],
        [1, 20],
      ]),
    ).toEqual([]);
  });

  it("checks bands against the cap being edited, not the saved one", () => {
    const config = setPath(setPath(validConfig(), "sections.income.max", 40), "sections.debt.max", 60);
    expect(validateScoring(schema, config)).toEqual([
      "Income per person (ETB) (Income): a band can't give more than the section maximum (40 points).",
    ]);
  });

  it("keeps band limits at or above the schema minimum", () => {
    const minSchema = withMin("sections.income.per_capita_bands", 100);
    const low = [
      [50, 50],
      [1000, 30],
    ];
    expect(problemsWith("sections.income.per_capita_bands", low, minSchema)).toEqual([
      "Income per person (ETB) (Income): the band limits can't be below 100.",
    ]);
    // Without a minimum, limits only have to be 0 or more.
    expect(problemsWith("sections.income.per_capita_bands", low)).toEqual([]);
    expect(
      problemsWith("sections.income.per_capita_bands", [
        [-1, 50],
        [1000, 30],
      ]),
    ).toEqual(["Income per person (ETB) (Income): the band limits can't be negative."]);
  });

  it("keeps a single value at or above the schema minimum", () => {
    expect(problemsWith("sections.income.zero", 5, withMin("sections.income.zero", 10))).toEqual([
      "No income (Income) can't be below 10.",
    ]);
    expect(problemsWith("sections.income.zero", -1)).toEqual(["No income (Income) can't be negative."]);
  });

  it("still refuses negative or fractional points and unordered or repeated limits", () => {
    expect(
      problemsWith("sections.income.per_capita_bands", [
        [500, -5],
        [1000, 2.5],
      ]),
    ).toEqual([
      "Income per person (ETB) (Income): the points can't be negative.",
      "Income per person (ETB) (Income): points must be whole numbers.",
    ]);
    expect(
      problemsWith("sections.income.per_capita_bands", [
        [1000, 30],
        [500, 50],
        [2000, 10],
      ]),
    ).toEqual(["Income per person (ETB) (Income): keep the bands in order, each with a different value."]);
    expect(
      problemsWith("sections.income.per_capita_bands", [
        [500, 50],
        [500, 30],
      ]),
    ).toEqual(["Income per person (ETB) (Income): keep the bands in order, each with a different value."]);
  });
});

describe("needLevels", () => {
  it("reads the cut-offs and recommendations at the schema's paths", () => {
    expect(needLevels(schema, validConfig())).toEqual({
      maxTotal: 100,
      medium: 30,
      high: 60,
      recommendations: { HIGH: "approve", MEDIUM: "conditional_approval", LOW: "defer" },
    });
  });

  it("finds need levels stored under other key names, as the designer does", () => {
    const renamed: ScoringSchema = {
      fields: [
        { path: "max_total", type: "integer", label: "Total", section: "total" },
        { path: "need.high_min", type: "number", label: "High", section: "need" },
        { path: "need.medium_min", type: "number", label: "Medium", section: "need" },
      ],
      rules: [],
    };
    const levels = needLevels(renamed, { max_total: 200, need: { high_min: 150.5, medium_min: 80 } });
    expect(levels).toMatchObject({ maxTotal: 200, medium: 80, high: 150.5 });
  });

  it("gives null, never a made-up number, when a value is missing or not a number", () => {
    expect(needLevels(schema, {})).toEqual({
      maxTotal: null,
      medium: null,
      high: null,
      recommendations: { HIGH: null, MEDIUM: null, LOW: null },
    });
    const levels = needLevels(schema, setPath(validConfig(), "risk_thresholds.high_min", "180"));
    expect(levels.high).toBeNull();
    expect(levels.medium).toBe(30);
  });

  it("gives null for every level when the schema has no need-level fields", () => {
    const noLevels: ScoringSchema = { fields: schema.fields.filter((field) => field.path.startsWith("sections.")), rules: [] };
    expect(needLevels(noLevels, validConfig())).toMatchObject({ maxTotal: null, medium: null, high: null });
  });
});
