/** Scoring config versions (ADMIN). A version is an editable DRAFT or a frozen PUBLISHED one. */

export type ScoringConfigVersion = {
  id: string;
  version: number;
  name: string | null;
  status: "DRAFT" | "PUBLISHED";
  active: boolean;
  basedOnVersion: number | null;
  createdBy?: string | null;
  createdByName?: string | null;
  createdAt: string | null;
  updatedAt?: string | null;
  activatedAt: string | null;
  activatedBy?: string | null;
  activatedByName?: string | null;
  activationReason?: string | null;
  config: Record<string, unknown>;
};

export type SchemaField = {
  /** Dot path into config, e.g. `sections.income.zero`. */
  path: string;
  type: "integer" | "number" | "bands";
  label: string;
  section: string;
  min?: number | null;
};

export type ScoringSchema = {
  fields: SchemaField[];
  rules: (string | { message?: string; description?: string; rule?: string })[];
};

/** `[bound, points]` pairs. */
export type Band = [number, number];

export type ScoringPreview = {
  version: number;
  sampled: number;
  riskChanged: number;
  transitions: Record<string, number>;
  averageOldScore: number | null;
  averageNewScore: number | null;
  items: {
    assessmentId: string;
    assessmentNumber?: string | null;
    beneficiaryName?: string | null;
    oldScore: number;
    oldRisk: string;
    oldConfigVersion?: number | null;
    newScore: number;
    newRisk: string;
    riskChanged: boolean;
  }[];
};

export function getPath(source: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((value, key) => {
    if (value && typeof value === "object") return (value as Record<string, unknown>)[key];
    return undefined;
  }, source);
}

/** Immutable set at a dot path (objects only; paths come from the schema). */
export function setPath<T extends Record<string, unknown>>(source: T, path: string, next: unknown): T {
  const [head, ...rest] = path.split(".");
  const current = (source[head] ?? {}) as Record<string, unknown>;
  return {
    ...source,
    [head]: rest.length === 0 ? next : setPath(current, rest.join("."), next),
  } as T;
}

export function ruleText(rule: ScoringSchema["rules"][number]) {
  if (typeof rule === "string") return rule;
  return rule.message ?? rule.description ?? rule.rule ?? JSON.stringify(rule);
}

/** Paths whose values differ between two configs, for "N changes" summaries. */
export function changedPaths(fields: SchemaField[], before: unknown, after: unknown) {
  return fields
    .filter((field) => JSON.stringify(getPath(before, field.path)) !== JSON.stringify(getPath(after, field.path)))
    .map((field) => field.path);
}
