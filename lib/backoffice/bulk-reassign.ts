import type { AssessmentListItem, FieldOfficer } from "@/lib/api/backoffice-types";

/**
 * Reassigning a field officer's open assessments in one go. The backend only
 * reassigns one assessment at a time, to an active officer of the
 * assessment's branch, so the work is grouped by branch and run in order,
 * stopping at the first failure.
 */

/** An assessment list row; its branchId says which officers can take it. */
export type ReassignItem = AssessmentListItem;

export type BranchGroup = {
  /** "" when the backend didn't say which branch. */
  branchId: string;
  branchName: string;
  items: ReassignItem[];
};

/** The assessments split by branch, in first-seen order. */
export function groupByBranch(items: readonly ReassignItem[]): BranchGroup[] {
  const groups = new Map<string, BranchGroup>();
  for (const item of items) {
    const branchId = item.branchId == null ? "" : String(item.branchId);
    const group = groups.get(branchId) ?? {
      branchId,
      branchName: item.branchName?.trim() || (branchId ? `Branch #${branchId}` : "Unknown branch"),
      items: [],
    };
    group.items.push(item);
    groups.set(branchId, group);
  }
  return [...groups.values()];
}

/**
 * Active officers, other than `excludeId`, who work in `branchId` (the
 * backend refuses anyone else). With no branch id, every other active officer.
 */
export function officersForBranch(
  officers: readonly FieldOfficer[],
  branchId: string,
  excludeId: string,
): FieldOfficer[] {
  return officers.filter(
    (officer) =>
      officer.active &&
      officer.id !== excludeId &&
      (!branchId ||
        (officer.assignments ?? []).some((item) => item.active && String(item.branchId ?? "") === branchId)),
  );
}

export type RunResult<T> = {
  /** How many tasks finished. */
  done: number;
  /** The item that failed and its error; the items after it were not tried. */
  failed: { item: T; error: unknown } | null;
};

/**
 * Run `task` for each item, one after another, reporting progress after each.
 * Stops at the first error, so nothing runs past a problem the user should
 * see (a refused officer, an expired session).
 */
export async function runInOrder<T>(
  items: readonly T[],
  task: (item: T) => Promise<unknown>,
  onProgress?: (done: number) => void,
): Promise<RunResult<T>> {
  let done = 0;
  for (const item of items) {
    try {
      await task(item);
    } catch (error) {
      return { done, failed: { item, error } };
    }
    done += 1;
    onProgress?.(done);
  }
  return { done, failed: null };
}
