/**
 * Plain-language names, grouping and checks for a scoring configuration,
 * built from the backend form schema. No React here, so the scoring screens
 * and the tests share one copy of the rules.
 */

import { getPath, type Band, type SchemaField, type ScoringSchema } from "@/lib/backoffice/scoring-config";

const THRESHOLD_SECTION = /risk|threshold|total/i;

export type Level = "LOW" | "MEDIUM" | "HIGH";
export const LEVELS: Level[] = ["LOW", "MEDIUM", "HIGH"];

/** Text values the backend accepts for a need level's preliminary recommendation. */
export const RECOMMENDATIONS = [
  { value: "approve", label: "Approve" },
  { value: "conditional_approval", label: "Conditional approval" },
  { value: "defer", label: "Defer" },
];

/** Shown for a level whose recommendation the schema doesn't list. */
export const DEFAULT_RECOMMENDATION: Record<Level, string> = { LOW: "defer", MEDIUM: "conditional_approval", HIGH: "approve" };

export function humanize(key: string) {
  return key
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^\w/, (char) => char.toUpperCase());
}

export function recommendationLabel(value: unknown) {
  if (typeof value !== "string" || !value) return "—";
  return RECOMMENDATIONS.find((item) => item.value === value)?.label ?? humanize(value);
}

/** Text fields hold the preliminary recommendation for a need level. */
export function isText(field: SchemaField) {
  return field.type === "text";
}

/** Only `sections.<name>.max` caps a section; deeper `.max` keys (e.g. the asset value cap) are ordinary values. */
export function isCap(field: SchemaField) {
  return /^sections\.[^.]+\.max$/.test(field.path);
}

// Plain-language names. Keys are `<section>` or `<section>.<path inside the section>`;
// anything missing falls back to the schema key made readable.
const SECTION_TITLES: Record<string, string> = {
  dependency: "Dependents",
  social_support: "Support received",
  expenditure_gap: "Spending gap",
};

const GROUP_TITLES: Record<string, string> = {
  "debt.purpose": "What the debt was for",
  "food.meals": "Meals a day",
  "assets.value": "Value of assets",
  "assets.productive": "Productive assets",
  "assets.productive.deductions": "Points taken off when the household owns",
  "housing.roof": "Roof",
  "housing.wall": "Walls",
  "housing.floor": "Floor",
  "housing.water": "Water source",
  "housing.tenure": "Home is",
  "housing.toilet": "Toilet",
  "housing.crowding": "Crowding",
  "housing.electricity": "Electricity",
  "housing.cooking_fuel": "Cooking fuel",
  "education.reasons": "Why children miss school",
  "education.attendance": "Children going to school",
  "vulnerability.points": "Household situation",
  "social_support.deductions": "Points taken off for support from",
};

type FieldCopy = { label?: string; unit?: string; step?: number };

const FIELD_COPY: Record<string, FieldCopy> = {
  "debt.ratio_bands": { label: "Debt compared with income" },
  "debt.zero_income_with_debt": { label: "Has debt and no income" },
  "food.skipped": { label: "Skips meals" },
  "food.shortage": { label: "Runs short of food" },
  "assets.value.max": { label: "Most points for asset value" },
  "assets.value.zero": { label: "No assets" },
  "assets.value.above": { label: "Above the last band" },
  "assets.value.per_capita_bands": { label: "Asset value per person (ETB)" },
  "assets.productive.start": { label: "Starting points" },
  "health.chronic": { label: "Chronic illness" },
  "health.no_insurance": { label: "No health insurance" },
  "health.unaffordable": { label: "Can't afford treatment" },
  "income.zero": { label: "No income" },
  "income.above": { label: "Above the last band" },
  "income.per_capita_bands": { label: "Income per person (ETB)" },
  "housing.crowding.bands": { label: "People per room" },
  "housing.crowding.zero_rooms": { label: "No rooms" },
  "housing.electricity.none": { label: "No electricity" },
  "dependency.ratio_bands": { label: "Dependents per working-age adult" },
  "dependency.no_working_age": { label: "No adult of working age" },
  "dependency.large_household_min": { label: "A large household has at least", unit: "people" },
  "dependency.large_household_bonus": { label: "Extra points for a large household" },
  "vulnerability.points.child_headed_household": { label: "Child-headed household" },
  "vulnerability.points.female_headed_household": { label: "Female-headed household" },
  "social_support.start": { label: "Starting points" },
  "social_support.deductions.ngo": { label: "NGO" },
  "social_support.deductions.mosque_community": { label: "Mosque or community" },
  "expenditure_gap.deficit_bands": { label: "Spending above income (share of income)" },
  "expenditure_gap.small_surplus_max": { label: "A small surplus is up to (share of income)", unit: "", step: 0.05 },
  "expenditure_gap.small_surplus_points": { label: "Points for a small surplus" },
  "expenditure_gap.zero_income_with_exp": { label: "Has spending and no income" },
};

export function sectionTitle(section: string) {
  return SECTION_TITLES[section] ?? humanize(section);
}

/** Label, sub-heading, unit and step for one field, without technical paths. */
export function describe(field: SchemaField) {
  const prefix = `sections.${field.section}.`;
  if (!field.path.startsWith(prefix)) {
    return { label: field.label, group: null as string | null, unit: "pts", step: field.type === "number" ? 0.05 : 1 };
  }
  const rel = field.path.slice(prefix.length);
  const parts = rel.split(".");
  const parent = parts.slice(0, -1).join(".");
  const copy = FIELD_COPY[`${field.section}.${rel}`] ?? {};
  return {
    label: copy.label ?? humanize(parts[parts.length - 1]),
    group: parent ? (GROUP_TITLES[`${field.section}.${parent}`] ?? humanize(parts[parts.length - 2])) : null,
    unit: copy.unit ?? "pts",
    step: copy.step ?? (field.type === "number" ? 0.05 : 1),
  };
}

/** The lowest value a field takes: the schema's `min`, else 0 (no field takes negative points). */
export function fieldMin(field: SchemaField) {
  return typeof field.min === "number" && Number.isFinite(field.min) ? field.min : 0;
}

const TOP_LEVEL_NAMES: Record<string, string> = {
  max_total: "Maximum score",
  "risk_thresholds.high_min": "Start of High need",
  "risk_thresholds.medium_min": "Start of Medium need",
  "preliminary_recommendation.HIGH": "Recommendation for High need",
  "preliminary_recommendation.MEDIUM": "Recommendation for Medium need",
  "preliminary_recommendation.LOW": "Recommendation for Low need",
};

/** Full plain-language name of a field, for messages: "Thatch (Housing, roof)". */
export function fieldName(field: SchemaField) {
  const { label, group } = describe(field);
  if (TOP_LEVEL_NAMES[field.path]) return TOP_LEVEL_NAMES[field.path];
  if (isCap(field)) return `${sectionTitle(field.section)} maximum`;
  if (!field.path.startsWith(`sections.${field.section}.`)) return label;
  return `${label} (${sectionTitle(field.section)}${group ? `, ${group.toLowerCase()}` : ""})`;
}

export type SectionGroup = { key: string; title: string; cap: SchemaField | null; items: SchemaField[] };

export function groupSchema(schema: ScoringSchema) {
  const sections = new Map<string, SectionGroup>();
  let maxTotal: SchemaField | null = null;
  let high: SchemaField | null = null;
  let medium: SchemaField | null = null;
  const recommendations: Partial<Record<Level, SchemaField>> = {};
  const otherThresholds: SchemaField[] = [];

  for (const field of schema.fields) {
    if (field.path === "max_total") {
      maxTotal = field;
      continue;
    }
    if (/high_min$/.test(field.path)) {
      high = field;
      continue;
    }
    if (/medium_min$/.test(field.path)) {
      medium = field;
      continue;
    }
    if (isText(field)) {
      // Preliminary recommendations: text, not points, so never part of the budget.
      const level = LEVELS.find((item) => field.path.toUpperCase().endsWith(`.${item}`));
      if (level && !recommendations[level]) recommendations[level] = field;
      else otherThresholds.push(field);
      continue;
    }
    if (THRESHOLD_SECTION.test(field.section) && field.type !== "bands" && !isCap(field)) {
      otherThresholds.push(field);
      continue;
    }
    const group = sections.get(field.section) ?? { key: field.section, title: sectionTitle(field.section), cap: null, items: [] };
    if (isCap(field)) group.cap = field;
    else group.items.push(field);
    sections.set(field.section, group);
  }
  return { sections: [...sections.values()], maxTotal, high, medium, recommendations, otherThresholds };
}

export function num(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export function text(value: unknown) {
  return typeof value === "string" ? value : "";
}

function numberOrNull(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export type NeedLevels = {
  /** Null when the schema has no such field or the config holds no number there. */
  maxTotal: number | null;
  medium: number | null;
  high: number | null;
  /** Recommendation value per level ("approve"…), null when the config has none. */
  recommendations: Record<Level, string | null>;
};

/** A config's need-level cut-offs and recommendations, read at the schema's paths (as the designer does). */
export function needLevels(schema: ScoringSchema, config: Record<string, unknown>): NeedLevels {
  const groups = groupSchema(schema);
  const read = (field: SchemaField | null) => (field ? numberOrNull(getPath(config, field.path)) : null);
  const recommendation = (level: Level) => {
    const field = groups.recommendations[level];
    if (!field) return DEFAULT_RECOMMENDATION[level];
    return text(getPath(config, field.path)).trim() || null;
  };
  return {
    maxTotal: read(groups.maxTotal),
    medium: read(groups.medium),
    high: read(groups.high),
    recommendations: { LOW: recommendation("LOW"), MEDIUM: recommendation("MEDIUM"), HIGH: recommendation("HIGH") },
  };
}

/** Each section's maximum by section key; a section without one is left out. */
export function sectionCaps(schema: ScoringSchema, config: Record<string, unknown>) {
  const caps = new Map<string, number>();
  for (const section of groupSchema(schema).sections) {
    if (section.cap) caps.set(section.key, num(getPath(config, section.cap.path)));
  }
  return caps;
}

function strictlyRising(values: number[]) {
  return values.every((value, index) => index === 0 || value > values[index - 1]);
}

function strictlyFalling(values: number[]) {
  return values.every((value, index) => index === 0 || value < values[index - 1]);
}

/**
 * Mirrors the server's checks so problems show before saving. With
 * `baseConfig` (the version the draft was copied from), band lists must also
 * keep that version's number of bands and direction (rising or falling).
 */
export function validateScoring(
  schema: ScoringSchema,
  config: Record<string, unknown>,
  baseConfig?: Record<string, unknown> | null,
) {
  const groups = groupSchema(schema);
  const caps = sectionCaps(schema, config);
  const problems: string[] = [];
  const maxTotal = groups.maxTotal ? num(getPath(config, groups.maxTotal.path)) : null;
  const medium = groups.medium ? num(getPath(config, groups.medium.path)) : null;
  const high = groups.high ? num(getPath(config, groups.high.path)) : null;
  if (maxTotal != null && medium != null && high != null && !(medium > 0 && medium < high && high <= maxTotal)) {
    problems.push("Need levels: Medium must start above 0 and below High, and High can't be above the maximum score.");
  }
  if (maxTotal != null && groups.sections.some((section) => section.cap)) {
    const sum = groups.sections.reduce((total, section) => total + (section.cap ? num(getPath(config, section.cap.path)) : 0), 0);
    if (sum !== maxTotal) problems.push(`Section maximums add up to ${sum}, but must add up to ${maxTotal}.`);
  }
  if (LEVELS.some((level) => groups.recommendations[level] && !text(getPath(config, groups.recommendations[level]!.path)).trim())) {
    problems.push("Need levels: choose a recommendation for every level.");
  }
  for (const field of schema.fields) {
    const value = getPath(config, field.path);
    const name = fieldName(field);
    const min = fieldMin(field);
    const below = min === 0 ? "negative" : `below ${min}`;
    if (field.type === "bands") {
      const bands = Array.isArray(value) ? (value as Band[]) : [];
      if (bands.length === 0) {
        problems.push(`${name}: needs at least one band.`);
        continue;
      }
      const bounds = bands.map((band) => num(band?.[0]));
      const points = bands.map((band) => num(band?.[1]));
      if (bounds.some((bound) => bound < min)) problems.push(`${name}: the band limits can't be ${below}.`);
      if (points.some((point) => point < 0)) problems.push(`${name}: the points can't be negative.`);
      if (points.some((point) => !Number.isInteger(point))) problems.push(`${name}: points must be whole numbers.`);
      const cap = caps.get(field.section);
      if (cap != null && points.some((point) => point > cap)) {
        problems.push(`${name}: a band can't give more than the section maximum (${cap} points).`);
      }
      const rising = strictlyRising(bounds);
      const falling = strictlyFalling(bounds);
      if (!rising && !falling) problems.push(`${name}: keep the bands in order, each with a different value.`);
      const baseValue = baseConfig ? getPath(baseConfig, field.path) : null;
      const baseBands = Array.isArray(baseValue) ? (baseValue as Band[]) : [];
      if (baseBands.length > 0 && bands.length !== baseBands.length) {
        problems.push(`${name}: keep ${baseBands.length} band${baseBands.length === 1 ? "" : "s"}, as in the version it was copied from.`);
      } else if (baseBands.length > 1 && bands.length > 1) {
        const baseBounds = baseBands.map((band) => num(band?.[0]));
        if (strictlyRising(baseBounds) && falling) {
          problems.push(`${name}: the band limits must go up, as in the version it was copied from.`);
        } else if (strictlyFalling(baseBounds) && rising) {
          problems.push(`${name}: the band limits must go down, as in the version it was copied from.`);
        }
      }
      continue;
    }
    if (typeof value === "number" && value < min) problems.push(`${name} can't be ${below}.`);
    if (field.type === "integer" && typeof value === "number" && !Number.isInteger(value)) problems.push(`${name} must be a whole number.`);
  }
  return problems;
}

/** Field paths in a server message ("sections.food.skipped must be…") replaced by their plain names. */
export function describeScoringPaths(schema: ScoringSchema, message: string) {
  const byPath = new Map(schema.fields.map((field) => [field.path, field]));
  return message.replace(/\b(?:config\.)?((?:sections|risk_thresholds|preliminary_recommendation)\.[\w.]*\w|max_total)\b/g, (match, path: string) => {
    // A band row may be named as "…bands[2]" or "…bands.2"; name the band list.
    const field = byPath.get(path) ?? byPath.get(path.replace(/\.\d+(\.\d+)?$/, ""));
    return field ? fieldName(field) : match;
  });
}
