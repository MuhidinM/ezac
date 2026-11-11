/**
 * Content audit log (`GET /api/zakat/v1/admin/audit-log`, ADMIN): who changed
 * causes, stories, reports, regions, calculator rules, prices, home figures
 * and Zakat al-Fitr seasons. Same filter names and row shape as the household log.
 */

export type ContentAuditRow = {
  id: number;
  occurredAt: string;
  actorId: string | null;
  /** Null on rows written before 11 November. */
  actorName: string | null;
  actorRole: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  requestId: string | null;
  metadata: Record<string, unknown> | null;
};

export const AUDIT_ENTITY_TYPES = [
  { value: "Cause", label: "Cause" },
  { value: "ImpactStory", label: "Impact story" },
  { value: "ImpactReport", label: "Impact report" },
  { value: "ImpactRegion", label: "Impact region" },
  { value: "CalculatorConfig", label: "Calculator rules" },
  { value: "PriceSnapshot", label: "Gold and silver prices" },
  { value: "LivestockPrice", label: "Livestock prices" },
  { value: "HomeAdjustment", label: "Home figures" },
  { value: "ZakatAlFitrSeason", label: "Zakat al-Fitr season" },
  { value: "Media", label: "Image or file" },
] as const;

export function entityTypeLabel(value: string): string {
  return AUDIT_ENTITY_TYPES.find((item) => item.value === value)?.label ?? humanize(value);
}

/** Actions whose plain wording reads badly; the rest are worded from their code. */
const ACTION_WORDS: Record<string, string> = {
  PRICES_REFRESHED: "Prices fetched automatically",
  PRICES_ENTERED_MANUALLY: "Prices entered by hand",
  CALCULATOR_CONFIG_CREATED: "Calculator rules drafted",
  CALCULATOR_CONFIG_ACTIVATED: "Calculator rules activated",
  HOME_ADJUSTMENT_SET: "Home figures changed",
  ZAKAT_AL_FITR_SET: "Zakat al-Fitr season saved",
  IMPACT_REGION_SET: "Impact region saved",
  IMPACT_STORY_ARCHIVED: "Impact story taken down",
  MEDIA_UPLOADED: "File uploaded",
};

/** Actions seen on UAT and in the release notes, offered as suggestions in the action filter. */
export const KNOWN_AUDIT_ACTIONS = [
  "CAUSE_CREATED",
  "CAUSE_UPDATED",
  "CAUSE_PUBLISHED",
  "CAUSE_CLOSED",
  "CAUSE_CLOSED_AUTOMATICALLY",
  "IMPACT_STORY_CREATED",
  "IMPACT_STORY_UPDATED",
  "IMPACT_STORY_PUBLISHED",
  "IMPACT_STORY_ARCHIVED",
  "IMPACT_REPORT_CREATED",
  "IMPACT_REPORT_UPDATED",
  "IMPACT_REPORT_PUBLISHED",
  "IMPACT_REPORT_ARCHIVED",
  "IMPACT_REGION_SET",
  "CALCULATOR_CONFIG_CREATED",
  "CALCULATOR_CONFIG_ACTIVATED",
  "PRICES_REFRESHED",
  "PRICES_ENTERED_MANUALLY",
  "LIVESTOCK_PRICES_UPDATED",
  "HOME_ADJUSTMENT_SET",
  "ZAKAT_AL_FITR_SET",
  "MEDIA_UPLOADED",
] as const;

/** "CAUSE_CLOSED_AUTOMATICALLY" → "Cause closed automatically". */
export function actionLabel(action: string): string {
  return ACTION_WORDS[action] ?? humanize(action);
}

/** "ADMIN" → "Admin", "FIELD_OFFICER" → "Field officer". */
export function roleLabel(role: string | null | undefined): string | null {
  return role ? humanize(role) : null;
}

/** Turns CODE_WORDS, camelCase and PascalCase into a sentence-case phrase. */
export function humanize(value: string): string {
  const words = value
    .replace(/[_-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/\bzakat al fitr\b/g, "zakat al-Fitr")
    .replace(/\betb\b/g, "ETB");
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : "";
}

function shortValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "string") return value.length > 60 ? `${value.slice(0, 57)}…` : value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  const json = JSON.stringify(value);
  return json.length > 60 ? `${json.slice(0, 57)}…` : json;
}

/** A one-line view of a row's metadata, e.g. "Previous version: 4 · Trigger: daily"; empty for none. */
export function metadataSummary(metadata: Record<string, unknown> | null | undefined, maxEntries = 4): string {
  if (!metadata || typeof metadata !== "object") return "";
  const entries = Object.entries(metadata);
  const shown = entries.slice(0, maxEntries).map(([key, value]) => `${humanize(key)}: ${shortValue(value)}`);
  if (entries.length > maxEntries) shown.push(`+${entries.length - maxEntries} more`);
  return shown.join(" · ");
}

/** The editor page for a row's record, where there is one. */
export function entityHref(entityType: string, entityId: string | null): string | null {
  if (!entityId) return null;
  const id = encodeURIComponent(entityId);
  switch (entityType) {
    case "Cause":
      return `/dashboard/zakat/causes/${id}`;
    case "ImpactStory":
      return `/dashboard/zakat/stories/${id}`;
    case "ImpactReport":
      return "/dashboard/zakat/reports";
    case "ImpactRegion":
      return "/dashboard/zakat/regions";
    default:
      return null;
  }
}

export type AuditFilters = {
  entityType: string;
  entityId: string;
  action: string;
  from: string;
  to: string;
  page: number;
};

export const AUDIT_FILTER_DEFAULTS: AuditFilters = { entityType: "", entityId: "", action: "", from: "", to: "", page: 1 };

/** Why the date range can't be used, or null. */
export function auditRangeError(from: string, to: string): string | null {
  return from && to && from > to ? "The start date must be on or before the end date." : null;
}

/** The query for one page of the log; blank filters are left out. */
export function auditQuery(filters: AuditFilters, limit: number): string {
  const params = new URLSearchParams();
  if (filters.entityType) params.set("entityType", filters.entityType);
  if (filters.entityId.trim()) params.set("entityId", filters.entityId.trim());
  if (filters.action.trim()) params.set("action", filters.action.trim().toUpperCase().replace(/\s+/g, "_"));
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  params.set("page", String(Math.max(1, filters.page)));
  params.set("limit", String(limit));
  return params.toString();
}
