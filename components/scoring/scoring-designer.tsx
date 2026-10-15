"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Minus, Plus } from "lucide-react";

import { Panel } from "@/components/dashboard/panel";
import { Badge } from "@/components/ui/badge";
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

function humanize(key: string) {
  return key
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^\w/, (char) => char.toUpperCase());
}

function isCap(field: SchemaField) {
  return /(^|\.)max$/.test(field.path) && field.path !== "max_total";
}

type SectionGroup = { key: string; title: string; cap: SchemaField | null; items: SchemaField[] };

export function groupSchema(schema: ScoringSchema) {
  const sections = new Map<string, SectionGroup>();
  let maxTotal: SchemaField | null = null;
  let high: SchemaField | null = null;
  let medium: SchemaField | null = null;
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
    if (THRESHOLD_SECTION.test(field.section) && field.type !== "bands" && !isCap(field)) {
      otherThresholds.push(field);
      continue;
    }
    const group = sections.get(field.section) ?? { key: field.section, title: humanize(field.section), cap: null, items: [] };
    if (isCap(field)) group.cap = field;
    else group.items.push(field);
    sections.set(field.section, group);
  }
  return { sections: [...sections.values()], maxTotal, high, medium, otherThresholds };
}

function num(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
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
  const clamp = (next: number) => Math.max(min, max != null ? Math.min(max, next) : next);
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
          inputMode="numeric"
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

/** The three risk bands as one bar, with the two cut-off points. */
function RiskScale({
  maxTotal,
  medium,
  high,
  onMedium,
  onHigh,
  base,
}: {
  maxTotal: number;
  medium: number;
  high: number;
  onMedium?: (value: number) => void;
  onHigh?: (value: number) => void;
  base?: { medium: number; high: number } | null;
}) {
  const pct = (value: number) => `${Math.min(100, Math.max(0, (value / Math.max(1, maxTotal)) * 100))}%`;
  const bands = [
    { label: "Low need", hint: "Recommendation: defer", from: 0, to: medium, color: "bg-emerald-500" },
    { label: "Medium need", hint: "Recommendation: conditional approval", from: medium, to: high, color: "bg-amber-500" },
    { label: "High need", hint: "Recommendation: approve", from: high, to: maxTotal, color: "bg-rose-500" },
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
            <p className="mt-0.5 text-xs text-black/50">{band.hint}</p>
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
  function set(index: number, position: 0 | 1, next: number) {
    onChange?.(value.map((band, i) => (i === index ? (position === 0 ? [next, band[1]] : [band[0], next]) : band)));
  }
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-[#001539]">{field.label}</p>
      <ul className="space-y-1.5">
        {value.map((band, index) => (
          <li key={index} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-black/[0.02] px-3 py-2 text-sm text-black/65">
            <span className="inline-flex items-center gap-2">
              From
              <Stepper
                label={`${field.label} band ${index + 1} from`}
                value={band[0]}
                unit=""
                step={1}
                onChange={onChange ? (next) => set(index, 0, next) : undefined}
                changedFrom={baseValue?.[index] && baseValue[index][0] !== band[0] ? baseValue[index][0] : null}
              />
            </span>
            <span className="inline-flex items-center gap-2">
              gives
              <Stepper
                label={`${field.label} band ${index + 1} points`}
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
  const over = section.items.filter((field) => field.type !== "bands" && cap != null && num(getPath(config, field.path)) > cap);

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
          <ul className="divide-y divide-black/[0.04]">
            {section.items.map((field) => {
              const value = getPath(config, field.path);
              const baseValue = baseConfig ? getPath(baseConfig, field.path) : null;
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
              const current = num(value);
              return (
                <li key={field.path} className="flex items-center justify-between gap-4 py-2.5">
                  <span className="min-w-0">
                    <span className="block text-sm text-[#001539]">{field.label}</span>
                    {cap ? (
                      <span className="mt-1 block h-1 w-40 max-w-full overflow-hidden rounded-full bg-black/[0.06]">
                        <span className="block h-full rounded-full" style={{ width: `${Math.min(100, (current / cap) * 100)}%`, backgroundColor: color }} />
                      </span>
                    ) : null}
                  </span>
                  <Stepper
                    label={field.label}
                    value={current}
                    step={field.type === "integer" ? 1 : 0.5}
                    onChange={onChange ? (next) => onChange(field.path, next) : undefined}
                    changedFrom={baseValue != null && num(baseValue) !== current ? num(baseValue) : null}
                  />
                </li>
              );
            })}
          </ul>
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
  for (const field of schema.fields) {
    if (field.type === "bands") continue;
    const value = getPath(config, field.path);
    if (typeof value === "number" && value < 0) problems.push(`${field.label} can't be negative.`);
    if (field.type === "integer" && typeof value === "number" && !Number.isInteger(value)) problems.push(`${field.label} must be a whole number.`);
  }
  return problems;
}
