import type { ScoringConfigVersion, ScoringSchema } from "@/lib/backoffice/scoring-config";

/** A small schema shaped like the backend's: totals, need levels, recommendations and two capped sections. */
export const schema: ScoringSchema = {
  fields: [
    { path: "max_total", type: "integer", label: "Maximum total", section: "total" },
    { path: "risk_thresholds.high_min", type: "number", label: "High from", section: "risk_thresholds" },
    { path: "risk_thresholds.medium_min", type: "number", label: "Medium from", section: "risk_thresholds" },
    { path: "preliminary_recommendation.HIGH", type: "text", label: "High", section: "preliminary_recommendation" },
    { path: "preliminary_recommendation.MEDIUM", type: "text", label: "Medium", section: "preliminary_recommendation" },
    { path: "preliminary_recommendation.LOW", type: "text", label: "Low", section: "preliminary_recommendation" },
    { path: "sections.income.max", type: "integer", label: "Income max", section: "income" },
    { path: "sections.income.zero", type: "integer", label: "No income", section: "income" },
    { path: "sections.income.per_capita_bands", type: "bands", label: "Income bands", section: "income" },
    { path: "sections.debt.max", type: "integer", label: "Debt max", section: "debt" },
    { path: "sections.debt.ratio_bands", type: "bands", label: "Debt bands", section: "debt" },
  ],
  rules: [],
};

/** Passes every check: caps add up to the total, bands are ordered and within their section's cap. */
export function validConfig(): Record<string, unknown> {
  return {
    max_total: 100,
    risk_thresholds: { high_min: 60, medium_min: 30 },
    preliminary_recommendation: { HIGH: "approve", MEDIUM: "conditional_approval", LOW: "defer" },
    sections: {
      income: {
        max: 60,
        zero: 60,
        per_capita_bands: [
          [500, 50],
          [1000, 30],
          [2000, 10],
        ],
      },
      // Debt-ratio bands go down: the higher the ratio, the more points.
      debt: {
        max: 40,
        ratio_bands: [
          [3, 40],
          [1, 20],
          [0.5, 5],
        ],
      },
    },
  };
}

export function version(overrides: Partial<ScoringConfigVersion> & Pick<ScoringConfigVersion, "version">): ScoringConfigVersion {
  return {
    id: `id-${overrides.version}`,
    name: null,
    status: "PUBLISHED",
    active: false,
    basedOnVersion: null,
    createdAt: null,
    activatedAt: null,
    config: validConfig(),
    ...overrides,
  };
}
