/**
 * The shape a translation must have: the same keys as the English source, with
 * strings (and arrays of the same shape). Array lengths are not checked, so a
 * translated FAQ may not drop or add items: keep them aligned by position.
 */
export type Messages<T> = T extends string
  ? string
  : T extends readonly (infer U)[]
    ? readonly Messages<U>[]
    : { readonly [K in keyof T]: Messages<T[K]> };

/**
 * Fills {name} placeholders: format("Wait {n} minutes", { n: 5 }). Strings in
 * the dictionaries stay plain data (no functions) so they can be passed to
 * client components.
 */
export function format(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : match,
  );
}
