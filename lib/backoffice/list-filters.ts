/**
 * Checks for list filters that the backend would accept but that can never
 * match anything (a reversed range). The list shows the problem next to the
 * field and leaves the range out of the request until it is fixed, instead
 * of silently showing "Nothing matches".
 */

function wholeNumber(value: string): number | null {
  const text = value.trim();
  if (!text) return null;
  const number = Number(text);
  return Number.isFinite(number) ? number : NaN;
}

/** Why a min/max score pair can't be used, or null when it can (blank sides are fine). */
export function scoreRangeProblem(min: string, max: string, scoreMax?: number | null): string | null {
  const low = wholeNumber(min);
  const high = wholeNumber(max);
  if (Number.isNaN(low) || Number.isNaN(high)) return "Enter the scores as numbers.";
  if ((low !== null && low < 0) || (high !== null && high < 0)) return "Scores can't be below 0.";
  if (scoreMax != null && ((low !== null && low > scoreMax) || (high !== null && high > scoreMax))) {
    return `Scores go up to ${scoreMax}.`;
  }
  if (low !== null && high !== null && low > high) return "The minimum is higher than the maximum.";
  return null;
}

/** Why a from/to date pair (yyyy-mm-dd) can't be used, or null when it can. */
export function dateRangeProblem(from: string, to: string): string | null {
  if (from && to && from > to) return "The start date is after the end date.";
  return null;
}
