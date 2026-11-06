import type { PaginatedItems } from "@/lib/api/types";

/**
 * One page of the admin causes list. The causes API answers with every cause
 * as a plain list and ignores page and limit today (logic-backoffice-14), so
 * that list is paged here; a paged answer is used as the server sent it.
 */
export function pageOfCauses<T>(
  data: PaginatedItems<T> | T[] | null | undefined,
  page: number,
  pageSize: number,
): { items: T[]; totalItems: number; totalPages: number } {
  if (!data) return { items: [], totalItems: 0, totalPages: 1 };
  if (!Array.isArray(data)) {
    return {
      items: data.items ?? [],
      totalItems: data.pagination?.totalItems ?? data.items?.length ?? 0,
      totalPages: Math.max(1, data.pagination?.totalPages ?? 1),
    };
  }
  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  const current = Math.min(Math.max(1, page), totalPages);
  return { items: data.slice((current - 1) * pageSize, current * pageSize), totalItems: data.length, totalPages };
}
