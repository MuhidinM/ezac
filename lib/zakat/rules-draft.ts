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
  return JSON.stringify(draft) !== JSON.stringify(source ?? null);
}
