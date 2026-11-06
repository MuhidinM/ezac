"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { Plus, RefreshCw } from "lucide-react";

import { ErrorAlert } from "@/components/dashboard/error-alert";
import { InlineAlert } from "@/components/dashboard/inline-alert";
import { ListPagination } from "@/components/dashboard/list-pagination";
import { PageHeader } from "@/components/dashboard/page-header";
import { Panel } from "@/components/dashboard/panel";
import { RequireRole } from "@/components/dashboard/require-role";
import { PanelSkeleton } from "@/components/dashboard/skeletons";
import { WHITELIST_STATUS, WhitelistEntryCard } from "@/components/whitelist/whitelist-entry-card";
import { WhitelistFormDialog } from "@/components/whitelist/whitelist-form-dialog";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { WhitelistEntry, WhitelistStatus } from "@/lib/api/backoffice-types";
import type { PaginatedItems } from "@/lib/api/types";
import { useResource } from "@/lib/api/use-resource";
import { formatDateTime } from "@/lib/beneficiary/format";
import { useListState } from "@/lib/hooks/use-list-state";

const PAGE_SIZE = 20;
const STATUSES: WhitelistStatus[] = ["PENDING_APPROVAL", "ACTIVE", "REJECTED", "REVOKED"];

export default function WhitelistQueuePage() {
  return (
    <RequireRole audience={["admin"]}>
      {/* useListState reads the address through useSearchParams. */}
      <Suspense>
        <WhitelistQueue />
      </Suspense>
    </RequireRole>
  );
}

function WhitelistQueue() {
  // Tab, effect and page live in the address, so Back from a household keeps them.
  const [list, setList] = useListState(
    "",
    { status: "PENDING_APPROVAL", effect: "", page: 1 },
    { allowed: { status: STATUSES, effect: ["", "FAST_TRACK", "PRIORITY"] } },
  );
  const status = list.status as WhitelistStatus;
  const { effect, page } = list;
  const [notice, setNotice] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const params = new URLSearchParams({ status, page: String(page), limit: String(PAGE_SIZE) });
  if (effect) params.set("effect", effect);
  const { data, error, isLoading, reload } = useResource<PaginatedItems<WhitelistEntry>>(
    `/bff/backoffice/admin/whitelist?${params.toString()}`,
  );
  const rows = data?.items ?? [];

  return (
    <section className="space-y-6">
      <PageHeader
        title="Whitelist"
        description="Households marked Fast track (emergency) or Priority (long-term need). Field officers and branches send requests for you to decide; you can also add a household directly. It changes the pool order, never the score."
        actions={
          <>
            <Button variant="outline" onClick={reload} disabled={isLoading}>
              <RefreshCw />
              Refresh
            </Button>
            <Button onClick={() => setAddOpen(true)}>
              <Plus />
              Add household
            </Button>
          </>
        }
      />

      {notice ? <InlineAlert tone="success">{notice}</InlineAlert> : null}

      <WhitelistFormDialog
        key={addOpen ? "open" : "closed"}
        mode="admin"
        open={addOpen}
        onOpenChange={setAddOpen}
        onSaved={(entry) => {
          setAddOpen(false);
          setNotice(`${entry.beneficiaryName ?? "Household"} added to the whitelist.`);
          setList({ status: entry.status, page: 1 });
          reload();
        }}
      />

      <Panel flush>
        <Tabs
          value={status}
          onValueChange={(value) => {
            setList({ status: value });
            setNotice(null);
          }}
          activationMode="manual"
        >
          <div className="flex flex-wrap items-end justify-between gap-3 shadow-[inset_0_-1px_0_rgb(0_0_0/0.06)]">
            <TabsList aria-label="Request status" className="shadow-none">
              {STATUSES.map((key) => (
                <TabsTrigger key={key} value={key}>
                  {WHITELIST_STATUS[key].label}
                </TabsTrigger>
              ))}
            </TabsList>
            <div className="w-40 px-3 pb-2">
              <NativeSelect aria-label="Effect" value={effect} onChange={(event) => setList({ effect: event.target.value })}>
                <option value="">Any effect</option>
                <option value="FAST_TRACK">Fast track</option>
                <option value="PRIORITY">Priority</option>
              </NativeSelect>
            </div>
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
            ) : rows.length === 0 ? (
              <p className="px-5 py-12 text-center text-sm text-black/45">Nothing here.</p>
            ) : (
              <ul className="divide-y divide-black/[0.06]">
                {rows.map((entry) => (
                  <li key={entry.id} className="grid gap-4 px-5 py-4 lg:grid-cols-[16rem_minmax(0,1fr)]">
                    <div>
                      <Link href={`/dashboard/beneficiary/${entry.beneficiaryId}`} className="font-semibold text-navy hover:underline">
                        {entry.beneficiaryName ?? `Beneficiary #${entry.beneficiaryId}`}
                      </Link>
                      <p className="text-xs text-black/50">{[entry.branchName, entry.region].filter(Boolean).join(" · ") || "—"}</p>
                      <p className="mt-1 text-xs text-black/45">
                        Requested {formatDateTime(entry.requestedAt ?? null)}
                        {entry.requestedByName ? ` by ${entry.requestedByName}` : ""}
                      </p>
                    </div>
                    <WhitelistEntryCard
                      entry={entry}
                      canDecide
                      compact
                      onChanged={(updated) => {
                        setNotice(
                          `${entry.beneficiaryName ?? "Request"}: ${WHITELIST_STATUS[updated.status]?.label.toLowerCase() ?? "updated"}.`,
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
