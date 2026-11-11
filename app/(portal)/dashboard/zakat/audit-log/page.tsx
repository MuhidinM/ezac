"use client";

import Link from "next/link";
import { type ComponentProps, Suspense, useState } from "react";

import { ErrorAlert } from "@/components/dashboard/error-alert";
import { FormField } from "@/components/dashboard/form-field";
import { InlineAlert } from "@/components/dashboard/inline-alert";
import { ListPagination } from "@/components/dashboard/list-pagination";
import { PageHeader } from "@/components/dashboard/page-header";
import { Panel } from "@/components/dashboard/panel";
import { RequireRole } from "@/components/dashboard/require-role";
import { TableMessageRow, TableSkeletonRows } from "@/components/dashboard/table-states";
import {
  AUDIT_ENTITY_TYPES,
  AUDIT_FILTER_DEFAULTS,
  KNOWN_AUDIT_ACTIONS,
  type ContentAuditRow,
  actionLabel,
  auditQuery,
  auditRangeError,
  entityHref,
  entityTypeLabel,
  metadataSummary,
  roleLabel,
} from "@/components/zakat/content/audit";
import { staffRef } from "@/components/zakat/staff-ref";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PaginatedItems } from "@/lib/api/types";
import { useResource } from "@/lib/api/use-resource";
import { formatDateTime } from "@/lib/beneficiary/format";
import { useListState } from "@/lib/hooks/use-list-state";

const PAGE_SIZE = 50;

export default function ContentAuditLogPage() {
  return (
    <RequireRole audience={["admin"]}>
      {/* useSearchParams needs a Suspense boundary. */}
      <Suspense>
        <ContentAuditLog />
      </Suspense>
    </RequireRole>
  );
}

function ContentAuditLog() {
  const [filters, setFilters, { reset, isDefault }] = useListState("", AUDIT_FILTER_DEFAULTS, {
    allowed: { entityType: ["", ...AUDIT_ENTITY_TYPES.map((item) => item.value)] },
  });
  const rangeError = auditRangeError(filters.from, filters.to);
  const { data, error, isLoading, reload } = useResource<PaginatedItems<ContentAuditRow>>(
    rangeError ? null : `/bff/zakat-admin/audit-log?${auditQuery(filters, PAGE_SIZE)}`,
  );
  const rows = data?.items ?? [];

  return (
    <section className="space-y-6">
      <PageHeader
        title="Content audit log"
        description="Every change to causes, stories, reports, regions, calculator rules, prices, home figures and Zakat al-Fitr seasons. Dates are in Addis Ababa time."
      />

      <Panel flush>
        <div className="grid gap-3 border-b border-black/[0.06] px-5 py-4 sm:grid-cols-2 lg:grid-cols-5">
          <FormField label="Record type" htmlFor="al-type">
            <NativeSelect id="al-type" value={filters.entityType} onChange={(e) => setFilters({ entityType: e.target.value })} className="bg-white">
              <option value="">All</option>
              {AUDIT_ENTITY_TYPES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </NativeSelect>
          </FormField>
          <FormField label="Record id" htmlFor="al-id" hint="Press Enter to search">
            <DraftInput key={filters.entityId} id="al-id" value={filters.entityId} onCommit={(entityId) => setFilters({ entityId })} />
          </FormField>
          <FormField label="Action" htmlFor="al-action" hint="Pick one or type its code, then press Enter">
            <DraftInput key={filters.action} id="al-action" list="al-actions" value={filters.action} onCommit={(action) => setFilters({ action })} />
          </FormField>
          <datalist id="al-actions">
            {KNOWN_AUDIT_ACTIONS.map((action) => (
              <option key={action} value={action}>
                {actionLabel(action)}
              </option>
            ))}
          </datalist>
          <FormField label="Between" htmlFor="al-from" className="lg:col-span-2" error={rangeError ?? undefined}>
            <div className="flex items-center gap-2">
              <Input id="al-from" type="date" value={filters.from} onChange={(e) => setFilters({ from: e.target.value })} className="bg-white" />
              <span className="text-black/60">–</span>
              <Input type="date" aria-label="To" value={filters.to} onChange={(e) => setFilters({ to: e.target.value })} className="bg-white" />
            </div>
          </FormField>
          {!isDefault ? (
            <div className="sm:col-span-2 lg:col-span-5">
              <Button type="button" variant="ghost" size="sm" onClick={reset}>
                Clear filters
              </Button>
            </div>
          ) : null}
        </div>

        {error ? (
          <div className="px-5 pt-4">
            <ErrorAlert error={error} onRetry={reload} />
          </div>
        ) : null}
        {rangeError ? (
          <div className="px-5 pt-4">
            <InlineAlert tone="info">{rangeError}</InlineAlert>
          </div>
        ) : null}

        <Table>
          <TableHeader>
            <TableRow className="bg-black/[0.015]">
              <TableHead className="pl-5">When</TableHead>
              <TableHead>Who</TableHead>
              <TableHead>What</TableHead>
              <TableHead>Record</TableHead>
              <TableHead className="pr-5">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && rows.length === 0 ? (
              <TableSkeletonRows colSpan={5} />
            ) : rows.length === 0 ? (
              <TableMessageRow colSpan={5}>{isDefault ? "Nothing has been changed yet." : "No changes match these filters."}</TableMessageRow>
            ) : (
              rows.map((row) => {
                const href = entityHref(row.entityType, row.entityId);
                const role = roleLabel(row.actorRole);
                const details = metadataSummary(row.metadata);
                return (
                  <TableRow key={row.id}>
                    <TableCell className="pl-5 text-sm whitespace-nowrap text-black/60">{formatDateTime(row.occurredAt)}</TableCell>
                    <TableCell>
                      <span className="block text-navy">{staffRef(row.actorId, row.actorName) ?? "System (automatic)"}</span>
                      {role ? <span className="block text-xs text-black/60">{role}</span> : null}
                    </TableCell>
                    <TableCell className="text-navy">{actionLabel(row.action)}</TableCell>
                    <TableCell>
                      <span className="block text-navy">{entityTypeLabel(row.entityType)}</span>
                      {row.entityId ? (
                        href ? (
                          <Link href={href} className="block text-xs text-black/60 hover:underline">
                            #{row.entityId}
                          </Link>
                        ) : (
                          <span className="block text-xs text-black/60">#{row.entityId}</span>
                        )
                      ) : null}
                    </TableCell>
                    <TableCell className="max-w-sm pr-5 text-xs break-words text-black/60">{details || "—"}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        <ListPagination
          page={filters.page}
          pageSize={PAGE_SIZE}
          totalItems={data?.pagination?.totalItems ?? rows.length}
          totalPages={Math.max(1, data?.pagination?.totalPages ?? 1)}
          disabled={isLoading}
          onPageChange={(page) => setFilters({ page })}
        />
      </Panel>
    </section>
  );
}

/**
 * A text filter that searches when the admin presses Enter or leaves the
 * field, not on every key (a half-typed id or action code finds nothing).
 * Keyed on `value` by the caller, so clearing the filters empties it.
 */
function DraftInput({
  value,
  onCommit,
  ...props
}: Omit<ComponentProps<typeof Input>, "value" | "onChange" | "onBlur" | "onKeyDown"> & {
  value: string;
  onCommit: (value: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  const commit = () => {
    if (draft.trim() !== value) onCommit(draft.trim());
  };
  return (
    <Input
      {...props}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit();
      }}
      className="bg-white"
    />
  );
}
