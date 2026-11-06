"use client";

import { useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";

import {
  type ListDefaults,
  type ListStateConfig,
  isDefaultListState,
  nextListState,
  readListState,
  writeListState,
} from "@/lib/hooks/list-state";

export type { ListDefaults, ListValue } from "@/lib/hooks/list-state";

export type SetListState<T extends ListDefaults> = (
  changes: Partial<T> | ((current: T) => Partial<T>),
  options?: { keepPage?: boolean },
) => void;

/**
 * A list page's filters, search, sort, tab and page, kept in the URL query.
 * Reload, Back from a record, and a copied link all show the same list.
 *
 *   const [list, setList, { reset, isDefault }] = useListState("", {
 *     q: "", status: "OPEN", sort: "updatedAt:desc", page: 1,
 *   });
 *   setList({ status: "SUBMITTED" }); // also goes back to page 1
 *   setList({ page: 3 });
 *
 * `key` prefixes the params ("codes" → ?codes.page=2) for a page with two
 * lists; use "" for a page's main list. Fields at their default are left
 * out of the URL. Updates replace the history entry (no Back step per
 * click). Field types follow the defaults: string, number, boolean or
 * string[] (repeated params). `options.allowed` limits a field to known
 * values, so a hand-edited URL can't select a tab that doesn't exist.
 *
 * Uses useSearchParams: render the component inside <Suspense>.
 */
export function useListState<T extends ListDefaults>(
  key: string,
  defaults: T,
  options: { allowed?: ListStateConfig<T>["allowed"] } = {},
): [T, SetListState<T>, { reset: () => void; isDefault: boolean }] {
  const searchParams = useSearchParams();
  const query = searchParams.toString();

  // Callers pass object literals; key the config on their content, not identity.
  const defaultsKey = JSON.stringify(defaults);
  const allowedKey = JSON.stringify(options.allowed ?? null);
  const config = useMemo<ListStateConfig<T>>(
    () => ({
      prefix: key,
      defaults: JSON.parse(defaultsKey) as T,
      allowed: (JSON.parse(allowedKey) as ListStateConfig<T>["allowed"] | null) ?? undefined,
    }),
    [key, defaultsKey, allowedKey],
  );

  const state = useMemo(() => readListState(new URLSearchParams(query), config), [query, config]);

  const setState = useCallback<SetListState<T>>(
    (changes, setOptions) => {
      // The address bar, not the last render: two updates in one handler both count.
      const params = new URLSearchParams(window.location.search);
      const current = readListState(params, config);
      const patch = typeof changes === "function" ? changes(current) : changes;
      const next = nextListState(current, patch, config, setOptions);
      const search = writeListState(params, next, config).toString();
      if (search === params.toString()) return;
      // Next.js syncs useSearchParams with native history calls; state must be null.
      window.history.replaceState(null, "", `${window.location.pathname}${search ? `?${search}` : ""}${window.location.hash}`);
    },
    [config],
  );

  const reset = useCallback(() => setState(config.defaults), [setState, config]);

  return [state, setState, { reset, isDefault: isDefaultListState(state, config.defaults) }];
}
