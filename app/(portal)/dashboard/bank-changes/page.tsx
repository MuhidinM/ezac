"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";

import { BANK_CHANGE_STATUS, BankChangeCard } from "@/components/bank-changes/bank-change-card";
import { ErrorAlert } from "@/components/dashboard/error-alert";
import { InlineAlert } from "@/components/dashboard/inline-alert";
import { ListPagination } from "@/components/dashboard/list-pagination";
import { PageHeader } from "@/components/dashboard/page-header";
import { Panel } from "@/components/dashboard/panel";
import { RequireRole } from "@/components/dashboard/require-role";
import { PanelSkeleton } from "@/components/dashboard/skeletons";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PaginatedItems } from "@/lib/api/types";
import { useResource } from "@/lib/api/use-resource";
import { formatDateTime } from "@/lib/beneficiary/format";
import type { BankChangeRequest } from "@/lib/beneficiary/types";
import { useListState } from "@/lib/hooks/use-list-state";

const PAGE_SIZE = 20;
const TABS = ["PENDING", "APPROVED", "REJECTED", "ALL"] as const;
const TAB_LABELS: Record<(typeof TABS)[number], string> = {
  PENDING: BANK_CHANGE_STATUS.PENDING.label,
  APPROVED: BANK_CHANGE_STATUS.APPROVED.label,
  REJECTED: BANK_CHANGE_STATUS.REJECTED.label,
  ALL: "All",
};

export default function BankChangesPage() {
  return (
    <RequireRole audience={["admin"]}>
      {/* useListState reads the address through useSearchParams. */}
      <Suspense>
        <BankChanges />
      </Suspense>
    </RequireRole>
  );
}

function BankChanges() {
  const [list, setList] = useListState("", { status: "PENDING", page: 1 }, { allowed: { status: [...TABS] } });
  const { status, page } = list;
  const [notice, setNotice] = useState<string | null>(null);

  const params = new URLSearchParams({ status, page: String(page), limit: String(PAGE_SIZE) });
  const { data, error, isLoading, reload } = useResource<PaginatedItems<BankChangeRequest>>(
    `/bff/backoffice/admin/bank-change-requests?${params.toString()}`,
  );
  const rows = data?.items ?? [];

  return (
    <section className="space-y-6">
      <PageHeader
        title="Bank account changes"
        description="Changes to a household's payout account after it was approved, fast-tracked or pooled. Another admin must approve each one before payments go to the new account."
        actions={
          <Button variant="outline" onClick={reload} disabled={isLoading}>
            <RefreshCw />
            Refresh
          </Button>
        }
      />

      {notice ? <InlineAlert tone="success">{notice}</InlineAlert> : null}

      <Panel flush>
        <Tabs
          value={status}
          onValueChange={(value) => {
            setList({ status: value });
            setNotice(null);
          }}
          activationMode="manual"
        >
          <div className="shadow-[inset_0_-1px_0_rgb(0_0_0/0.06)]">
            <TabsList aria-label="Request status" className="shadow-none">
              {TABS.map((key) => (
                <TabsTrigger key={key} value={key}>
                  {TAB_LABELS[key]}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value={status}>
            {error ? (
              <div className="px-5 pt-4">
                <ErrorAlert error={error} onRetry={reload} />
              </div>
            ) : null}

            {isLoading && rows.length === 0 ? (
              <div role="status" className="space-y-3 p-5">
                <span className="sr-only">Loading…</span>
                {Array.from({ length: 3 }).map((_, index) => (
                  <PanelSkeleton key={index} rows={1} />
                ))}
              </div>
            ) : rows.length === 0 && !error ? (
              <p className="px-5 py-12 text-center text-sm text-black/60">
                {status === "PENDING" ? "No changes are waiting." : "Nothing here."}
              </p>
            ) : (
              <ul className="divide-y divide-black/[0.06]">
                {rows.map((request) => (
                  <li key={request.id} className="grid gap-4 px-5 py-4 lg:grid-cols-[16rem_minmax(0,1fr)]">
                    <div>
                      <Link
                        href={`/dashboard/beneficiary/${request.beneficiaryId}`}
                        className="font-semibold text-navy hover:underline"
                      >
                        {request.beneficiaryName ?? `Beneficiary #${request.beneficiaryId}`}
                      </Link>
                      <p className="mt-1 text-xs text-black/60">
                        Asked {formatDateTime(request.requestedAt ?? null)}
                        {request.requestedByName ? ` by ${request.requestedByName}` : ""}
                      </p>
                    </div>
                    <BankChangeCard
                      request={request}
                      onStale={reload}
                      onDecided={(decision) => {
                        const name = request.beneficiaryName ?? "The household";
                        setNotice(
                          decision === "approve"
                            ? `${name}: the new bank account is in use.`
                            : `${name}: the change was rejected. The account stays as it was.`,
                        );
                        reload();
                      }}
                    />
                  </li>
                ))}
              </ul>
            )}

            <ListPagination
              page={page}
              pageSize={PAGE_SIZE}
              totalItems={data?.pagination.totalItems ?? 0}
              totalPages={data?.pagination.totalPages ?? 1}
              disabled={isLoading}
              onPageChange={(next) => setList({ page: next })}
            />
          </TabsContent>
        </Tabs>
      </Panel>
    </section>
  );
}
