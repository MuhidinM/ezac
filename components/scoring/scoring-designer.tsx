"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Minus, Plus } from "lucide-react";

import { Panel } from "@/components/dashboard/panel";
import { Badge } from "@/components/ui/badge";
import { NativeSelect } from "@/components/ui/native-select";
import {
  getPath,
  type Band,
  type SchemaField,
  type ScoringSchema,
} from "@/lib/backoffice/scoring-config";
import { cn } from "@/lib/utils";

/**
 * Plain-language view and editor of a scoring configuration, built from the
 * backend form schema. Technical paths stay hidden; every number is shown as
 * "points" next to what it rewards, with the earlier value when it changed.
 */

const THRESHOLD_SECTION = /risk|threshold|total/i;
const SECTION_COLORS = ["#007050", "#2a78d6", "#eb6834", "#eda100", "#7c5cc4", "#0f9fb0", "#c2417a", "#5b7a1f"];

type Level = "LOW" | "MEDIUM" | "HIGH";
const LEVELS: Level[] = ["LOW", "MEDIUM", "HIGH"];

/** Text values the backend accepts for a need level's preliminary recommendation. */
const RECOMMENDATIONS = [
  { value: "approve", label: "Approve" },
  { value: "conditional_approval", label: "Conditional approval" },
  { value: "defer", label: "Defer" },
];

function humanize(key: string) {
  return key
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^\w/, (char) => char.toUpperCase());
}

function recommendationLabel(value: unknown) {
  if (typeof value !== "string" || !value) return "—";
  return RECOMMENDATIONS.find((item) => item.value === value)?.label ?? humanize(value);
}

/** The schema's TypeScript type predates text fields (preliminary recommendations). */
function isText(field: SchemaField) {
  return (field.type as string) === "text";
}

/** Only `sections.<name>.max` caps a section; deeper `.max` keys (e.g. the asset value cap) are ordinary values. */
function isCap(field: SchemaField) {
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

function sectionTitle(section: string) {
  return SECTION_TITLES[section] ?? humanize(section);
}

/** Label, sub-heading, unit and step for one field, without technical paths. */
function describe(field: SchemaField) {
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

type SectionGroup = { key: string; title: string; cap: SchemaField | null; items: SchemaField[] };

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

function num(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function text(value: unknown) {
  return typeof value === "string" ? value : "";
}

/** Ascending bounds read "up to X"; descending ones read "X or more". */
function bandDirection(bands: Band[]) {
  return bands.length > 1 && num(bands[0]?.[0]) > num(bands[bands.length - 1]?.[0]) ? "down" : "up";
}

/** Ratios move in small steps, money in larger ones. */
function boundStep(bands: Band[]) {
  const largest = Math.max(0, ...bands.map((band) => num(band?.[0])));
  if (largest <= 10) return 0.05;
  if (largest >= 1000) return 100;
  return 1;
}

/** − [value] + with a unit, read-only when no onChange. */
function Stepper({
  value,
  onChange,
  min = 0,
  max,
  step = 1,
  unit = "pts",
  label,
  changedFrom,
}: {
  value: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  label: string;
  changedFrom?: number | null;
}) {
  // Round so decimal steps don't drift (0.1 + 0.05 = 0.15000000000000002).
  const clamp = (next: number) => Math.round(Math.max(min, max != null ? Math.min(max, next) : next) * 100) / 100;
  if (!onChange) {
    return (
      <span className="inline-flex items-baseline gap-1 tabular-nums">
        <span className="text-base font-semibold text-[#001539]">{value}</span>
        <span className="text-xs text-black/45">{unit}</span>
      </span>
    );
  }
  return (
    <span className="inline-flex flex-col items-end gap-0.5">
      <span className="inline-flex items-center rounded-lg border border-black/10 bg-white">
        <button
          type="button"
          aria-label={`Less ${label}`}
          className="flex size-8 items-center justify-center text-black/50 hover:text-[#001539] disabled:opacity-30"
          onClick={() => onChange(clamp(value - step))}
          disabled={value <= min}
        >
          <Minus className="size-3.5" />
        </button>
        <input
          aria-label={label}
          type="number"
          inputMode={step < 1 ? "decimal" : "numeric"}
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(event) => onChange(clamp(Number(event.target.value) || 0))}
          className={cn(
            "h-8 w-14 border-x border-black/10 bg-transparent text-center text-sm font-semibold text-[#001539] tabular-nums outline-none",
            changedFrom != null && "bg-sky-50",
          )}
        />
        <button
          type="button"
          aria-label={`More ${label}`}
          className="flex size-8 items-center justify-center text-black/50 hover:text-[#001539] disabled:opacity-30"
          onClick={() => onChange(clamp(value + step))}
          disabled={max != null && value >= max}
        >
          <Plus className="size-3.5" />
        </button>
      </span>
      {changedFrom != null ? <span className="text-[11px] text-sky-700 tabular-nums">was {changedFrom}</span> : null}
    </span>
  );
}

type LevelRecommendation = {
  value: string;
  /** Value in the compared version, when it differs. */
  changedFrom: string | null;
  onChange?: (value: string) => void;
};

/** The recommendation a need level gives: a picker while editing, plain text otherwise. */
function RecommendationControl({ level, label, recommendation }: { level: Level; label: string; recommendation: LevelRecommendation }) {
  const { value, changedFrom, onChange } = recommendation;
  if (!onChange) {
    return (
      <p className="mt-0.5 text-xs text-black/50">
        Recommendation: {recommendationLabel(value).toLowerCase()}
        {changedFrom != null ? <span className="text-sky-700"> (was {recommendationLabel(changedFrom).toLowerCase()})</span> : null}
      </p>
    );
  }
  const known = RECOMMENDATIONS.some((item) => item.value === value);
  return (
    <div className="mt-2 space-y-1">
      <label htmlFor={`recommendation-${level}`} className="text-xs text-black/50">
        Recommendation
      </label>
      <NativeSelect
        id={`recommendation-${level}`}
        aria-label={`${label} recommendation`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn("h-8 text-xs", changedFrom != null && "bg-sky-50")}
      >
        {!value ? <option value="">Choose</option> : null}
        {!known && value ? <option value={value}>{recommendationLabel(value)}</option> : null}
        {RECOMMENDATIONS.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </NativeSelect>
      {changedFrom != null ? <p className="text-[11px] text-sky-700">was {recommendationLabel(changedFrom).toLowerCase()}</p> : null}
    </div>
  );
}

const DEFAULT_RECOMMENDATION: Record<Level, string> = { LOW: "defer", MEDIUM: "conditional_approval", HIGH: "approve" };

/** The three risk bands as one bar, with the two cut-off points. */
function RiskScale({
  maxTotal,
  medium,
  high,
  onMedium,
  onHigh,
  base,
  recommendations,
}: {
  maxTotal: number;
  medium: number;
  high: number;
  onMedium?: (value: number) => void;
  onHigh?: (value: number) => void;
  base?: { medium: number; high: number } | null;
  /** From the configuration; a level without one shows the usual default. */
  recommendations: Partial<Record<Level, LevelRecommendation>>;
}) {
  const pct = (value: number) => `${Math.min(100, Math.max(0, (value / Math.max(1, maxTotal)) * 100))}%`;
  const bands = [
    { level: "LOW" as const, label: "Low need", from: 0, to: medium, color: "bg-emerald-500" },
    { level: "MEDIUM" as const, label: "Medium need", from: medium, to: high, color: "bg-amber-500" },
    { level: "HIGH" as const, label: "High need", from: high, to: maxTotal, color: "bg-rose-500" },
  ];
  const invalid = !(medium > 0 && medium < high && high <= maxTotal);

  return (
    <div className="space-y-5">
      <div>
        <div className="flex h-9 overflow-hidden rounded-lg">
          {bands.map((band) => (
            <div
              key={band.label}
              className={cn("flex items-center justify-center text-xs font-medium text-white", band.color)}
              style={{ width: `calc(${pct(band.to)} - ${pct(band.from)})` }}
            >
              <span className="truncate px-2">{band.label}</span>
            </div>
          ))}
        </div>
        <div className="relative mt-1 h-5 text-[11px] text-black/50 tabular-nums">
          <span className="absolute left-0">0</span>
          <span className="absolute -translate-x-1/2" style={{ left: pct(medium) }}>
            {medium}
          </span>
          <span className="absolute -translate-x-1/2" style={{ left: pct(high) }}>
            {high}
          </span>
          <span className="absolute right-0">{maxTotal}</span>
        </div>
      </div>
      {invalid ? (
        <p className="text-sm text-rose-700">Medium must start above 0 and below High, and High can&apos;t be above {maxTotal}.</p>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-3">
        {bands.map((band, index) => (
          <div key={band.label} className="rounded-lg border border-black/[0.06] p-3">
            <p className="flex items-center gap-2 text-sm font-medium text-[#001539]">
              <span className={cn("size-2.5 rounded-full", band.color)} />
              {band.label}
            </p>
            <RecommendationControl
              level={band.level}
              label={band.label}
              recommendation={recommendations[band.level] ?? { value: DEFAULT_RECOMMENDATION[band.level], changedFrom: null }}
            />
            <div className="mt-3 flex items-center justify-between gap-2 text-sm text-black/60">
              {index === 0 ? (
                <span>Below {medium} points</span>
              ) : (
                <>
                  <span>From</span>
                  <Stepper
                    label={`${band.label} starts at`}
                    value={index === 1 ? medium : high}
                    onChange={index === 1 ? onMedium : onHigh}
                    min={1}
                    max={maxTotal}
                    changedFrom={base ? ((index === 1 ? base.medium : base.high) !== (index === 1 ? medium : high) ? (index === 1 ? base.medium : base.high) : null) : null}
                  />
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** How the total is shared between sections; must add up to the maximum. */
function Budget({ sections, values, maxTotal }: { sections: SectionGroup[]; values: number[]; maxTotal: number }) {
  const used = values.reduce((sum, value) => sum + value, 0);
  const left = maxTotal - used;
  return (
    <div className="space-y-3">
      <div className="flex h-3 overflow-hidden rounded-full bg-black/[0.06]">
        {sections.map((section, index) => (
          <div
            key={section.key}
            title={`${section.title}: ${values[index]} points`}
            style={{ width: `${(values[index] / Math.max(1, Math.max(maxTotal, used))) * 100}%`, backgroundColor: SECTION_COLORS[index % SECTION_COLORS.length] }}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-black/60">
        {sections.map((section, index) => (
          <span key={section.key} className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full" style={{ backgroundColor: SECTION_COLORS[index % SECTION_COLORS.length] }} />
            {section.title} <span className="tabular-nums text-black/45">{values[index]}</span>
          </span>
        ))}
      </div>
      <p className={cn("text-sm", left === 0 ? "text-emerald-700" : "text-rose-700")}>
        {left === 0
          ? `All ${maxTotal} points are shared out.`
          : left > 0
            ? `${left} point${left === 1 ? "" : "s"} still to share out: the section maximums must add up to ${maxTotal}.`
            : `${-left} point${left === -1 ? "" : "s"} too many: the section maximums must add up to ${maxTotal}.`}
      </p>
    </div>
  );
}

function BandsRows({
  field,
  value,
  baseValue,
  onChange,
}: {
  field: SchemaField;
  value: Band[];
  baseValue: Band[] | null;
  onChange?: (value: Band[]) => void;
}) {
  const { label } = describe(field);
  // Read the direction from the compared version so a half-typed edit doesn't flip the wording.
  const reference = baseValue && baseValue.length > 1 ? baseValue : value;
  const direction = bandDirection(reference);
  const step = boundStep(reference);
  function set(index: number, position: 0 | 1, next: number) {
    onChange?.(value.map((band, i) => (i === index ? (position === 0 ? [next, band[1]] : [band[0], next]) : band)));
  }
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-[#001539]">{label}</p>
      <ul className="space-y-1.5">
        {value.map((band, index) => (
          <li key={index} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-black/[0.02] px-3 py-2 text-sm text-black/65">
            <span className="inline-flex items-center gap-2">
              {direction === "up" ? "Up to" : null}
              <Stepper
                label={`${label} band ${index + 1} ${direction === "up" ? "up to" : "from"}`}
                value={band[0]}
                unit=""
                step={step}
                onChange={onChange ? (next) => set(index, 0, next) : undefined}
                changedFrom={baseValue?.[index] && baseValue[index][0] !== band[0] ? baseValue[index][0] : null}
              />
              {direction === "down" ? "or more" : null}
            </span>
            <span className="inline-flex items-center gap-2">
              gives
              <Stepper
                label={`${label} band ${index + 1} points`}
                value={band[1]}
                onChange={onChange ? (next) => set(index, 1, next) : undefined}
                changedFrom={baseValue?.[index] && baseValue[index][1] !== band[1] ? baseValue[index][1] : null}
              />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SectionCard({
  section,
  color,
  config,
  baseConfig,
  onChange,
}: {
  section: SectionGroup;
  color: string;
  config: Record<string, unknown>;
  baseConfig: Record<string, unknown> | null;
  onChange?: (path: string, value: unknown) => void;
}) {
  const [open, setOpen] = useState(true);
  const cap = section.cap ? num(getPath(config, section.cap.path)) : null;
  const changedCount = baseConfig
    ? [section.cap, ...section.items].filter(
        (field) => field && JSON.stringify(getPath(baseConfig, field.path)) !== JSON.stringify(getPath(config, field.path)),
      ).length
    : 0;
  const over = section.items.filter(
    (field) => field.type !== "bands" && !isText(field) && describe(field).unit === "pts" && cap != null && num(getPath(config, field.path)) > cap,
  );
  // Consecutive fields under the same sub-heading ("Roof", "Meals a day"…) form one block.
  const blocks: { group: string | null; fields: SchemaField[] }[] = [];
  for (const field of section.items) {
    const { group } = describe(field);
    const last = blocks[blocks.length - 1];
    if (last && last.group === group) last.fields.push(field);
    else blocks.push({ group, fields: [field] });
  }

  function renderField(field: SchemaField) {
    const value = getPath(config, field.path);
    const baseValue = baseConfig ? getPath(baseConfig, field.path) : null;
    const { label, unit, step } = describe(field);
    if (field.type === "bands") {
      return (
        <li key={field.path} className="py-3">
          <BandsRows
            field={field}
            value={Array.isArray(value) ? (value as Band[]) : []}
            baseValue={Array.isArray(baseValue) ? (baseValue as Band[]) : null}
            onChange={onChange ? (next) => onChange(field.path, next) : undefined}
          />
        </li>
      );
    }
    if (isText(field)) {
      return (
        <li key={field.path} className="flex items-center justify-between gap-4 py-2.5">
          <span className="text-sm text-[#001539]">{label}</span>
          <span className="text-sm font-medium text-[#001539]">{recommendationLabel(value)}</span>
        </li>
      );
    }
    const current = num(value);
    return (
      <li key={field.path} className="flex items-center justify-between gap-4 py-2.5">
        <span className="min-w-0">
          <span className="block text-sm text-[#001539]">{label}</span>
          {cap && unit === "pts" ? (
            <span className="mt-1 block h-1 w-40 max-w-full overflow-hidden rounded-full bg-black/[0.06]">
              <span className="block h-full rounded-full" style={{ width: `${Math.min(100, (current / cap) * 100)}%`, backgroundColor: color }} />
            </span>
          ) : null}
        </span>
        <Stepper
          label={fieldName(field)}
          value={current}
          unit={unit}
          step={step}
          onChange={onChange ? (next) => onChange(field.path, next) : undefined}
          changedFrom={baseValue != null && num(baseValue) !== current ? num(baseValue) : null}
        />
      </li>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-black/[0.08] bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3" style={{ boxShadow: `inset 3px 0 0 ${color}` }}>
        <button type="button" onClick={() => setOpen((value) => !value)} className="flex items-center gap-2 text-left" aria-expanded={open}>
          <ChevronDown className={cn("size-4 text-black/40 transition", !open && "-rotate-90")} />
          <span className="font-semibold text-[#001539]">{section.title}</span>
          {changedCount > 0 ? <Badge tone="info">{changedCount} changed</Badge> : null}
        </button>
        {section.cap ? (
          <span className="flex items-center gap-2 text-sm text-black/55">
            Up to
            <Stepper
              label={`${section.title} maximum`}
              value={cap ?? 0}
              onChange={onChange ? (next) => onChange(section.cap!.path, next) : undefined}
              changedFrom={
                baseConfig && num(getPath(baseConfig, section.cap.path)) !== cap ? num(getPath(baseConfig, section.cap.path)) : null
              }
            />
          </span>
        ) : null}
      </div>
      {open ? (
        <div className="space-y-3 border-t border-black/[0.05] px-4 py-3">
          {over.length > 0 ? (
            <p className="text-xs text-amber-700">
              Some answers give more than the section maximum ({cap}); the section total is capped at {cap}.
            </p>
          ) : null}
          {blocks.map((block, index) =>
            block.group ? (
              <div key={`${block.group}-${index}`} className="rounded-lg border border-black/[0.05] px-3 pt-2">
                <p className="text-xs font-semibold tracking-wide text-black/50 uppercase">{block.group}</p>
                <ul className="divide-y divide-black/[0.04]">{block.fields.map(renderField)}</ul>
              </div>
            ) : (
              <ul key={`fields-${index}`} className="divide-y divide-black/[0.04]">
                {block.fields.map(renderField)}
              </ul>
            ),
          )}
        </div>
      ) : null}
    </div>
  );
}

export function ScoringDesigner({
  schema,
  config,
  baseConfig,
  onChange,
}: {
  schema: ScoringSchema;
  config: Record<string, unknown>;
  /** The version this one is compared with, to mark changes. */
  baseConfig?: Record<string, unknown> | null;
  /** Omit for a read-only view. */
  onChange?: (path: string, value: unknown) => void;
}) {
  const groups = useMemo(() => groupSchema(schema), [schema]);
  const maxTotal = groups.maxTotal ? num(getPath(config, groups.maxTotal.path)) : 270;
  const medium = groups.medium ? num(getPath(config, groups.medium.path)) : 0;
  const high = groups.high ? num(getPath(config, groups.high.path)) : 0;
  const capValues = groups.sections.map((section) => (section.cap ? num(getPath(config, section.cap.path)) : 0));
  const hasCaps = groups.sections.some((section) => section.cap);
  const base = baseConfig ?? null;
  const recommendations: Partial<Record<Level, LevelRecommendation>> = {};
  for (const level of LEVELS) {
    const field = groups.recommendations[level];
    if (!field) continue;
    const value = text(getPath(config, field.path));
    const before = base ? text(getPath(base, field.path)) : null;
    recommendations[level] = {
      value,
      changedFrom: before != null && before !== value ? before : null,
      onChange: onChange ? (next) => onChange(field.path, next) : undefined,
    };
  }

  return (
    <div className="space-y-6">
      <Panel
        title="1. Need levels"
        description={`Every household gets a score out of ${maxTotal} points. The score decides the need level and the recommendation the branch sees.`}
      >
        {groups.medium && groups.high ? (
          <RiskScale
            maxTotal={maxTotal}
            medium={medium}
            high={high}
            onMedium={onChange ? (value) => onChange(groups.medium!.path, value) : undefined}
            onHigh={onChange ? (value) => onChange(groups.high!.path, value) : undefined}
            base={base && groups.medium && groups.high ? { medium: num(getPath(base, groups.medium.path)), high: num(getPath(base, groups.high.path)) } : null}
            recommendations={recommendations}
          />
        ) : (
          <p className="text-sm text-black/50">This configuration has no need levels.</p>
        )}
      </Panel>

      {hasCaps ? (
        <Panel
          title="2. How the points are shared"
          description="Each part of the assessment can earn up to its maximum. Together they make the full score."
        >
          <Budget sections={groups.sections} values={capValues} maxTotal={maxTotal} />
        </Panel>
      ) : null}

      <div className="space-y-3">
        <div>
          <h3 className="text-base font-semibold text-[#001539]">{hasCaps ? "3." : "2."} Points for each answer</h3>
          <p className="text-sm text-black/55">
            More points means more need. A field officer&apos;s answer earns the points shown; a section never earns more than its maximum.
          </p>
        </div>
        {groups.sections.map((section, index) => (
          <SectionCard
            key={section.key}
            section={section}
            color={SECTION_COLORS[index % SECTION_COLORS.length]}
            config={config}
            baseConfig={base}
            onChange={onChange}
          />
        ))}
        {groups.otherThresholds.length > 0 ? (
          <SectionCard
            section={{ key: "other", title: "Other settings", cap: null, items: groups.otherThresholds }}
            color="#9ca3af"
            config={config}
            baseConfig={base}
            onChange={onChange}
          />
        ) : null}
      </div>
    </div>
  );
}

/** Mirrors the server's checks so problems show before saving. */
export function validateScoring(schema: ScoringSchema, config: Record<string, unknown>) {
  const groups = groupSchema(schema);
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
    if (field.type === "bands") {
      const bands = Array.isArray(value) ? (value as Band[]) : [];
      const bounds = bands.map((band) => num(band?.[0]));
      const points = bands.map((band) => num(band?.[1]));
      if (bounds.some((bound) => bound < 0) || points.some((point) => point < 0)) problems.push(`${name}: values can't be negative.`);
      if (points.some((point) => !Number.isInteger(point))) problems.push(`${name}: points must be whole numbers.`);
      const rising = bounds.every((bound, index) => index === 0 || bound > bounds[index - 1]);
      const falling = bounds.every((bound, index) => index === 0 || bound < bounds[index - 1]);
      if (!rising && !falling) problems.push(`${name}: keep the bands in order, each with a different value.`);
      continue;
    }
    if (typeof value === "number" && value < 0) problems.push(`${name} can't be negative.`);
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
