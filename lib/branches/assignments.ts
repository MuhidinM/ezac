import type { StaffAssignment } from "@/lib/api/backoffice-types";

function time(value: string | null | undefined): number {
  const parsed = value ? Date.parse(value) : Number.NaN;
  return Number.isNaN(parsed) ? 0 : parsed;
}

/**
 * An officer's ended assignments, newest first. Moving an officer back to a
 * former branch creates a new row, so the same branch can appear several
 * times, each with its own dates; every row is kept.
 */
export function assignmentHistory(assignments: readonly StaffAssignment[]): StaffAssignment[] {
  return assignments
    .filter((assignment) => !assignment.active)
    .sort(
      (a, b) =>
        time(b.deactivatedAt ?? b.createdAt) - time(a.deactivatedAt ?? a.createdAt) ||
        time(b.createdAt) - time(a.createdAt),
    );
}
