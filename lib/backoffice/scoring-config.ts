import { ApiError, errorData } from "@/lib/api/errors";

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
  /** Who last edited the draft; with the creator, they can't activate it. */
  updatedBy?: string | null;
  updatedByName?: string | null;
  /** Sent back on every draft edit; a stale one is refused (409). */
  editVersion?: number | null;
  /** The server's view: the draft was copied from a version that is no longer active. */
  stale?: boolean | null;
  config: Record<string, unknown>;
};

/** One period a version was active (`GET /admin/scoring-configs/activations`, newest first). */
export type ScoringActivation = {
  version: number;
  activatedAt: string | null;
  activatedBy?: string | null;
  activatedByName?: string | null;
  reason?: string | null;
  previousVersion?: number | null;
  /** Null while this is the active period. */
  retiredAt?: string | null;
  retiredBy?: string | null;
  retiredByName?: string | null;
  /** Activated although it was copied from a version that was no longer active. */
  staleConfirmed?: boolean | null;
};

type Actor = { by?: string | null; byName?: string | null; at?: string | null };

/** `GET /admin/scoring-configs/{version}/history`: drafted, every edit, every activation. */
export type ScoringVersionHistory = {
  version: number;
  name?: string | null;
  status?: string | null;
  active?: boolean | null;
  basedOnVersion?: number | null;
  drafted?: Actor | null;
  edits?: Actor[] | null;
  activations?: ScoringActivation[] | null;
};

export type SchemaField = {
  /** Dot path into config, e.g. `sections.income.zero`. */
  path: string;
  type: "integer" | "number" | "bands" | "text";
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

export type DraftBaseline = {
  /** The active version, which activating the draft replaces. */
  live: ScoringConfigVersion | null;
  /** The version the draft was copied from, when it is still listed. */
  base: ScoringConfigVersion | null;
  /** True when the draft is not a copy of the live version: activating it also undoes what the live version changed. */
  stale: boolean;
  /** What the draft's changes are counted and marked against: the live version, else the copied one. */
  compareWith: ScoringConfigVersion | null;
};

/** The versions a draft is checked against before it goes live. */
export function draftBaseline(draft: ScoringConfigVersion, versions: readonly ScoringConfigVersion[]): DraftBaseline {
  const live = versions.find((item) => item.active) ?? null;
  const base = draft.basedOnVersion != null ? (versions.find((item) => item.version === draft.basedOnVersion) ?? null) : null;
  return { live, base, stale: live != null && draft.basedOnVersion !== live.version, compareWith: live ?? base };
}

/**
 * The open draft "Change scoring" returns to instead of making another: the
 * newest copy of the live version, else the newest draft. Null when none is open.
 */
export function draftToContinue(versions: readonly ScoringConfigVersion[]) {
  const live = versions.find((item) => item.active) ?? null;
  const drafts = versions.filter((item) => item.status === "DRAFT").sort((a, b) => b.version - a.version);
  return drafts.find((item) => live != null && item.basedOnVersion === live.version) ?? drafts[0] ?? null;
}

/**
 * Whether the signed-in ADMIN may not activate this version: the one who
 * created it or last edited it must leave that to another ADMIN (403).
 */
export function activationNeedsAnotherAdmin(version: ScoringConfigVersion, myUserId: string | null): boolean {
  if (!myUserId) return false;
  return version.createdBy === myUserId || version.updatedBy === myUserId;
}

/**
 * 409 STALE_DRAFT on activate: the draft was copied from a version that is no
 * longer active. Returns both versions (null when unknown), or null for any other error.
 */
export function staleDraftConflict(error: unknown): { basedOnVersion: number | null; activeVersion: number | null } | null {
  if (!(error instanceof ApiError) || error.status !== 409 || error.code !== "STALE_DRAFT") return null;
  const details = errorData(error);
  const number = (value: unknown) => (typeof value === "number" && Number.isFinite(value) ? value : null);
  return { basedOnVersion: number(details.basedOnVersion), activeVersion: number(details.activeVersion) };
}

export type HistoryStep = { title: string; byName: string | null; at: string | null; note: string | null };

/** One version's history as plain steps, oldest first: drafted, each edit, each activation and retirement. */
export function scoringHistorySteps(history: ScoringVersionHistory): HistoryStep[] {
  const steps: HistoryStep[] = [];
  if (history.drafted) {
    steps.push({
      title: history.basedOnVersion != null ? `Drafted from v${history.basedOnVersion}` : "Drafted",
      byName: history.drafted.byName ?? null,
      at: history.drafted.at ?? null,
      note: null,
    });
  }
  for (const edit of history.edits ?? []) {
    steps.push({ title: "Edited", byName: edit.byName ?? null, at: edit.at ?? null, note: null });
  }
  for (const activation of history.activations ?? []) {
    steps.push({
      title: "Activated",
      byName: activation.activatedByName ?? null,
      at: activation.activatedAt,
      note: activation.reason?.trim() || null,
    });
    if (activation.retiredAt) {
      steps.push({ title: "Replaced by another version", byName: activation.retiredByName ?? null, at: activation.retiredAt, note: null });
    }
  }
  // Sorted by time; steps without one keep their place at the start.
  return steps
    .map((step, index) => ({ step, index }))
    .sort((a, b) => (a.step.at ?? "").localeCompare(b.step.at ?? "") || a.index - b.index)
    .map(({ step }) => step);
}
