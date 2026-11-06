"use client";

import Link from "next/link";
import { Suspense } from "react";
import { Plus } from "lucide-react";

import { ErrorAlert } from "@/components/dashboard/error-alert";
import { InlineAlert } from "@/components/dashboard/inline-alert";
import { ListPagination } from "@/components/dashboard/list-pagination";
import { PageHeader } from "@/components/dashboard/page-header";
import { Panel } from "@/components/dashboard/panel";
import { RequireRole } from "@/components/dashboard/require-role";
import { TableMessageRow, TableSkeletonRows } from "@/components/dashboard/table-states";
import { CauseStatusBadge } from "@/components/zakat/cause-status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PaginatedItems } from "@/lib/api/types";
import { useResource } from "@/lib/api/use-resource";
import { formatDate, formatEtb } from "@/lib/backoffice/format";
import { useListState } from "@/lib/hooks/use-list-state";
import { type AdminCause, categoryLabel, mediaSrc } from "@/lib/zakat/content";
import { pageOfCauses } from "@/lib/zakat/causes-page";

const PAGE_SIZE = 20;

const TABS = [
  { key: "", label: "All" },
  { key: "DRAFT", label: "Drafts" },
  { key: "ACTIVE", label: "Active" },
  { key: "CLOSED", label: "Closed" },
] as const;

export default function CausesAdminPage() {
  return (
    <RequireRole audience={["admin"]}>
      {/* useSearchParams needs a Suspense boundary. */}
      <Suspense>
        <CausesAdmin />
      </Suspense>
    </RequireRole>
  );
}

function CausesAdmin() {
  const [list, setList] = useListState("", { status: "", page: 1 }, { allowed: { status: TABS.map((tab) => tab.key) } });
  const params = new URLSearchParams({ page: String(list.page), limit: String(PAGE_SIZE) });
  if (list.status) params.set("status", list.status);
  const { data, error, isLoading, reload } = useResource<PaginatedItems<AdminCause> | AdminCause[]>(`/bff/zakat-admin/causes?${params}`);
  // The API sends every cause as a plain list today; a paged answer is used as it comes.
  const { items: causes, totalItems, totalPages } = pageOfCauses(data, list.page, PAGE_SIZE);

  return (
    <section className="space-y-6">
      <PageHeader
        title="Causes"
        description="Campaigns shown on the app home screen and in the payment project list. New causes start as drafts."
        actions={
          <Button asChild>
            <Link href="/dashboard/zakat/causes/new">
              <Plus />
              New cause
            </Link>
          </Button>
        }
      />

      <Panel flush>
        <Tabs value={list.status} onValueChange={(status) => setList({ status })} activationMode="manual">
          <TabsList aria-label="Status">
            {TABS.map(({ key, label }) => (
              <TabsTrigger key={key} value={key}>
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value={list.status}>
            {error ? (
              <div className="px-5 pt-4">
                <ErrorAlert error={error} onRetry={reload} />
              </div>
            ) : null}
            {causes.some((cause) => cause.status === "ACTIVE" && cause.ended) ? (
              <div className="px-5 pt-4">
                <InlineAlert tone="info">
                  Causes marked Ended are past their end date: the app and website list them as completed. Close them, or set a later end
                  date to keep them running.
                </InlineAlert>
              </div>
            ) : null}
            <Table>
              <TableHeader>
                <TableRow className="bg-black/[0.015]">
                  <TableHead className="pl-5">Cause</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Raised</TableHead>
                  <TableHead className="w-40">Progress</TableHead>
                  <TableHead className="pr-5">Ends</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && causes.length === 0 ? (
                  <TableSkeletonRows colSpan={6} />
                ) : causes.length === 0 ? (
                  <TableMessageRow colSpan={6}>No causes here yet.</TableMessageRow>
                ) : (
                  causes.map((cause) => (
                    <TableRow key={cause.id} className="relative">
                      <TableCell className="pl-5">
                        <span className="flex items-center gap-3">
                          {cause.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element -- served by the zakat service
                            <img src={mediaSrc(cause.imageUrl) ?? undefined} alt="" className="size-10 shrink-0 rounded-md object-cover" />
                          ) : (
                            <span className="size-10 shrink-0 rounded-md bg-black/[0.05]" />
                          )}
                          <span className="min-w-0">
                            <Link
                              href={`/dashboard/zakat/causes/${encodeURIComponent(cause.id)}`}
                              className="block truncate font-medium text-navy after:absolute after:inset-0 hover:underline"
                            >
                              {cause.title}
                            </Link>
                            <span className="block max-w-sm truncate text-xs text-black/60">{cause.description}</span>
                          </span>
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="flex flex-wrap items-center gap-1.5">
                          {categoryLabel(cause.category)}
                          {cause.badge ? (
                            <Badge tone={cause.badge === "urgent" ? "danger" : "info"}>{cause.badge === "urgent" ? "Urgent" : "Essential"}</Badge>
                          ) : null}
                        </span>
                      </TableCell>
                      <TableCell>
                        <CauseStatusBadge status={cause.status} ended={cause.ended} />
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {cause.raisedEtb != null ? formatEtb(cause.raisedEtb) : "—"}
                        {cause.goalEtb != null ? <span className="block text-xs text-black/60">of {formatEtb(cause.goalEtb)}</span> : null}
                      </TableCell>
                      <TableCell>
                        {cause.progress != null ? (
                          <span className="flex items-center gap-2">
                            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/[0.06]">
                              <span className="block h-full rounded-full bg-brand" style={{ width: `${Math.min(100, Math.round(cause.progress * 100))}%` }} />
                            </span>
                            <span className="w-9 text-right text-xs tabular-nums text-black/60">{Math.round(cause.progress * 100)}%</span>
                          </span>
                        ) : (
                          <span className="text-xs text-black/60">No goal</span>
                        )}
                      </TableCell>
                      <TableCell className="pr-5 text-sm text-black/60">{formatDate(cause.endsOn)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <ListPagination
              page={list.page}
              pageSize={PAGE_SIZE}
              totalItems={totalItems}
              totalPages={totalPages}
              disabled={isLoading}
              onPageChange={(page) => setList({ page })}
            />
          </TabsContent>
        </Tabs>
      </Panel>
    </section>
  );
}
