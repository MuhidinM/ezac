/**
 * Average livestock prices left the calculator rules on 11 November: they are
 * set on Prices & nisab (PUT /admin/livestock-prices). Older versions still
 * carry the field; zakat-engine ignores it, so a new draft leaves it out.
 */
const OLD_LIVESTOCK_PRICES = "livestockAverageUnitPriceEtb";

/** A copy of a version's rules to start a new draft from. */
export function draftRules(rules: Record<string, unknown>): Record<string, unknown> {
  const copy = structuredClone(rules);
  delete copy[OLD_LIVESTOCK_PRICES];
  return copy;
}

/**
 * Whether an open calculator-rules draft has anything to lose: a name, or
 * rules that differ from the version it started from. Clicking another
 * version asks first only when this is true (forms-errors-8).
 */
export function draftHasChanges(
  draft: Record<string, unknown> | null,
  name: string,
  source: Record<string, unknown> | null | undefined,
): boolean {
  if (!draft) return false;
  if (name.trim()) return true;
  return JSON.stringify(draft) !== JSON.stringify(source ? draftRules(source) : null);
}
