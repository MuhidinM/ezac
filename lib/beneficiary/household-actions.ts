import { ApiError } from "@/lib/api/errors";
import type { LifecycleMove } from "@/lib/beneficiary/types";

export const LIFECYCLE_MOVES: Record<string, { label: string; hint: string; final?: boolean }> = {
  INACTIVE: { label: "Pause (inactive)", hint: "Can't be assessed or pooled until reinstated." },
  REINSTATED: { label: "Reinstate", hint: "Back to where they were before the pause." },
  GRADUATED: { label: "Graduate", hint: "Left the programme self-sufficient.", final: true },
  EXITED: { label: "Exit", hint: "Left the programme for another reason.", final: true },
  REOPENED: { label: "Reopen", hint: "Back to pending assessment after graduating or exiting." },
};

export type LifecycleChoice = { value: string; label: string; hint: string; final: boolean };

/** The lifecycle changes the backend allows now, in our order, with labels. */
export function allowedLifecycleChoices(moves: LifecycleMove[] | null | undefined): LifecycleChoice[] {
  const order = Object.keys(LIFECYCLE_MOVES);
  return (moves ?? [])
    .filter((move) => move.allowed)
    .sort((a, b) => rank(order, a.to) - rank(order, b.to))
    .map((move) => {
      const known = LIFECYCLE_MOVES[move.to];
      return {
        value: move.to,
        label: known?.label ?? move.to.charAt(0) + move.to.slice(1).toLowerCase(),
        hint: known?.hint ?? "",
        final: known?.final ?? false,
      };
    });
}

function rank(order: string[], value: string) {
  const index = order.indexOf(value);
  return index === -1 ? order.length : index;
}

/**
 * One line on why no change is possible: the reason most refused moves share
 * (e.g. "has an open assessment"; REINSTATED and REOPENED carry their own
 * status rule), ties going to the first move in our order. Null when a move
 * is allowed or nothing was sent.
 */
export function lifecycleBlockedReason(moves: LifecycleMove[] | null | undefined): string | null {
  if (!moves || moves.length === 0 || moves.some((move) => move.allowed)) return null;
  const order = Object.keys(LIFECYCLE_MOVES);
  const counts = new Map<string, number>();
  for (const move of [...moves].sort((a, b) => rank(order, a.to) - rank(order, b.to))) {
    if (move.reason) counts.set(move.reason, (counts.get(move.reason) ?? 0) + 1);
  }
  let best: string | null = null;
  for (const [reason, count] of counts) {
    if (best === null || count > (counts.get(best) ?? 0)) best = reason;
  }
  return best;
}

/** Plain words for the household login refusals; null for other errors. */
export function householdLoginErrorMessage(error: unknown): string | null {
  if (!(error instanceof ApiError) || error.status !== 409) return null;
  if (error.code === "LOGIN_EXISTS") return "This household already has a login. Use Reset password instead.";
  if (error.code === "NO_PHONE") return "This household has no phone number. Add one before creating the login.";
  return null;
}
