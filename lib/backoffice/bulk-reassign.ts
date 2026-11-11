import { errorData } from "@/lib/api/errors";
import type { FieldOfficer } from "@/lib/api/backoffice-types";

/**
 * Moving all of a field officer's open assessments to another officer in one
 * call: `POST /admin/field-officers/{id}/reassign-assessments`
 * `{toFieldOfficerId, includeSubmitted?, reason}`. It is all or nothing: when
 * one assessment can't move, none move and the answer is 409 REASSIGN_FAILED
 * with `details.failures[]`.
 */

export type ReassignBody = {
  toFieldOfficerId: string;
  includeSubmitted: boolean;
  reason: string;
};

/** The branches the officer works in now (active branch assignments). */
export function activeBranchIds(officer: Pick<FieldOfficer, "assignments">): string[] {
  return [
    ...new Set(
      (officer.assignments ?? [])
        .filter((item) => item.active && item.branchId != null && String(item.branchId) !== "")
        .map((item) => String(item.branchId)),
    ),
  ];
}

/**
 * Active officers, other than `excludeId`, who work in one of `branchIds`
 * (only they can reach those households). With no branch ids, every other
 * active officer.
 */
export function officersForBranches(
  officers: readonly FieldOfficer[],
  branchIds: readonly string[],
  excludeId: string,
): FieldOfficer[] {
  const wanted = new Set(branchIds);
  return officers.filter(
    (officer) =>
      officer.active &&
      officer.id !== excludeId &&
      (wanted.size === 0 ||
        (officer.assignments ?? []).some((item) => item.active && wanted.has(String(item.branchId ?? "")))),
  );
}

export type ReassignFailure = {
  /** The assessment that couldn't move, when the backend named it. */
  assessmentId: string | null;
  message: string;
};

function text(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

/** The assessments that blocked a reassignment (409 REASSIGN_FAILED `details.failures[]`). */
export function reassignFailures(error: unknown): ReassignFailure[] {
  const failures = errorData(error).failures;
  if (!Array.isArray(failures)) return [];
  return failures.flatMap((item): ReassignFailure[] => {
    if (typeof item === "string") return item.trim() ? [{ assessmentId: null, message: item.trim() }] : [];
    if (!item || typeof item !== "object") return [];
    const record = item as Record<string, unknown>;
    const assessmentId = text(record.assessmentId) ?? text(record.id);
    const message = text(record.message) ?? text(record.reason) ?? "It can't be moved.";
    return [{ assessmentId, message }];
  });
}

/**
 * How many assessments moved, from the answer: a count field or a list of
 * moved ids. null when the answer doesn't say.
 */
export function reassignedCount(answer: unknown): number | null {
  if (typeof answer === "number" && Number.isInteger(answer)) return answer;
  if (Array.isArray(answer)) return answer.length;
  if (!answer || typeof answer !== "object") return null;
  const record = answer as Record<string, unknown>;
  for (const key of ["reassigned", "reassignedCount", "count", "moved"]) {
    const value = record[key];
    if (typeof value === "number" && Number.isInteger(value)) return value;
    if (Array.isArray(value)) return value.length;
  }
  for (const key of ["assessmentIds", "assessments"]) {
    const value = record[key];
    if (Array.isArray(value)) return value.length;
  }
  return null;
}
