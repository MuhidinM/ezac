/**
 * Reading and writing a list page's filters in the URL query (see
 * use-list-state.ts). Pure functions, so they are unit-tested on their own.
 */

export type ListValue = string | number | boolean | readonly string[];
export type ListDefaults = Record<string, ListValue>;

export type ListStateConfig<T extends ListDefaults> = {
  /** Prefix for this list's params ("codes" gives ?codes.page=2); "" for none. */
  prefix: string;
  /** Every field and its default; a field at its default is left out of the URL. */
  defaults: T;
  /** Accepted values per field; anything else in the URL reads as the default. */
  allowed?: { [K in keyof T]?: readonly string[] };
};

function paramName(prefix: string, field: string): string {
  return prefix ? `${prefix}.${field}` : field;
}

function sameValue(a: ListValue, b: ListValue): boolean {
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((item, index) => item === b[index]);
  }
  return a === b;
}

function readField(params: URLSearchParams, name: string, fallback: ListValue, allowed?: readonly string[]): ListValue {
  if (Array.isArray(fallback)) {
    const values = params.getAll(name).filter((value) => value !== "" && (!allowed || allowed.includes(value)));
    return values.length > 0 ? values : fallback;
  }

  const raw = params.get(name);
  if (raw === null) return fallback;

  if (typeof fallback === "number") {
    const number = Number(raw);
    if (raw.trim() === "" || !Number.isFinite(number)) return fallback;
    // Whole-number defaults (page, limit) stay whole.
    return Number.isInteger(fallback) ? Math.trunc(number) : number;
  }
  if (typeof fallback === "boolean") {
    if (raw === "1" || raw === "true") return true;
    if (raw === "0" || raw === "false") return false;
    return fallback;
  }
  if (allowed && !allowed.includes(raw)) return fallback;
  return raw;
}

/** The list state the URL describes; missing or unreadable params read as their defaults. */
export function readListState<T extends ListDefaults>(params: URLSearchParams, config: ListStateConfig<T>): T {
  const state = { ...config.defaults } as Record<string, ListValue>;
  for (const field of Object.keys(config.defaults)) {
    state[field] = readField(
      params,
      paramName(config.prefix, field),
      config.defaults[field],
      config.allowed?.[field as keyof T],
    );
  }
  // Pages count from 1; "page=0" or "page=-3" in a pasted link means the first.
  if (typeof state.page === "number" && state.page < 1) state.page = 1;
  return state as T;
}

/**
 * `params` with this list's fields set to `state`: fields at their default are
 * removed, so a list with no filters has a clean URL. Params that belong to
 * anything else (another list, ?redirect=) are kept.
 */
export function writeListState<T extends ListDefaults>(
  params: URLSearchParams,
  state: T,
  config: ListStateConfig<T>,
): URLSearchParams {
  const next = new URLSearchParams(params);
  for (const field of Object.keys(config.defaults)) {
    const name = paramName(config.prefix, field);
    const value = state[field];
    const fallback = config.defaults[field];
    next.delete(name);
    if (value === undefined || sameValue(value, fallback)) continue;
    if (Array.isArray(value)) {
      for (const item of value) next.append(name, item);
    } else if (typeof value === "boolean") {
      next.set(name, value ? "1" : "0");
    } else {
      next.set(name, String(value));
    }
  }
  return next;
}

/**
 * Apply `changes` to `current`. Changing any filter sends the list back to
 * its first page unless the change sets `page` itself or `keepPage` is on,
 * so "page 4 of the old filter" never shows an empty list.
 */
export function nextListState<T extends ListDefaults>(
  current: T,
  changes: Partial<T>,
  config: ListStateConfig<T>,
  options: { keepPage?: boolean } = {},
): T {
  const next = { ...current, ...changes };
  const changedFilter = Object.keys(changes).some(
    (field) => field !== "page" && !sameValue(changes[field] as ListValue, current[field]),
  );
  if ("page" in config.defaults && !("page" in changes) && changedFilter && !options.keepPage) {
    (next as Record<string, ListValue>).page = config.defaults.page;
  }
  return next;
}

/** True when every field except the page is at its default (nothing to clear). */
export function isDefaultListState<T extends ListDefaults>(state: T, defaults: T): boolean {
  return Object.keys(defaults).every((field) => field === "page" || sameValue(state[field], defaults[field]));
}
