// No "use client": status-badges (also used outside client pages) reads the
// constant; the hook only runs in client components.
import type { ScoreDistribution } from "@/lib/api/backoffice-types";
import { useResource } from "@/lib/api/use-resource";

/** The maximum score before the active scoring config is known (or if it can't be read). */
export const FALLBACK_SCORE_MAX = 270;

/**
 * The highest score a household can get under the active scoring config,
 * from the analytics score distribution. Falls back to 270 while loading or
 * when the caller can't read analytics.
 */
export function useScoreMax(enabled = true): number {
  const { data } = useResource<ScoreDistribution>(
    enabled ? "/bff/backoffice/analytics/score-distribution?bucket=10" : null,
  );
  const max = data?.max;
  return typeof max === "number" && Number.isFinite(max) && max > 0 ? max : FALLBACK_SCORE_MAX;
}
