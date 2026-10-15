"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, RefreshCw } from "lucide-react";

import { InlineAlert } from "@/components/dashboard/inline-alert";
import { ListPagination } from "@/components/dashboard/list-pagination";
import { PageHeader } from "@/components/dashboard/page-header";
import { Panel } from "@/components/dashboard/panel";
import { RequireRole } from "@/components/dashboard/require-role";
import { WHITELIST_STATUS, WhitelistEntryCard } from "@/components/whitelist/whitelist-entry-card";
import { WhitelistFormDialog } from "@/components/whitelist/whitelist-form-dialog";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import type { WhitelistEntry, WhitelistStatus } from "@/lib/api/backoffice-types";
import type { PaginatedItems } from "@/lib/api/types";
import { useResource } from "@/lib/api/use-resource";
import { formatDateTime } from "@/lib/beneficiary/format";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;
const STATUSES: WhitelistStatus[] = ["PENDING_APPROVAL", "ACTIVE", "REJECTED", "REVOKED"];

export default function WhitelistQueuePage() {
  return (
    <RequireRole audience={["admin"]}>
      <WhitelistQueue />
    </RequireRole>
  );
}

function WhitelistQueue() {
  const [status, setStatus] = useState<WhitelistStatus>("PENDING_APPROVAL");
  const [effect, setEffect] = useState("");
  const [page, setPage] = useState(1);
  const [notice, setNotice] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const params = new URLSearchParams({ status, page: String(page), limit: String(PAGE_SIZE) });
  if (effect) params.set("effect", effect);
  const { data, error, isLoading, reload } = useResource<PaginatedItems<WhitelistEntry>>(
    `/api/backoffice/admin/whitelist?${params.toString()}`,
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
          setStatus(entry.status);
          setPage(1);
          reload();
        }}
      />

      <Panel flush>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/[0.06] px-3 pt-2">
          <div className="flex gap-1 overflow-x-auto" role="tablist">
            {STATUSES.map((key) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={status === key}
                onClick={() => {
                  setStatus(key);
                  setPage(1);
                  setNotice(null);
                }}
                className={cn(
                  "-mb-px shrink-0 border-b-2 px-3 py-2.5 text-sm transition",
                  status === key ? "border-[#007050] font-medium text-[#001539]" : "border-transparent text-black/55 hover:text-[#001539]",
                )}
              >
                {WHITELIST_STATUS[key].label}
              </button>
            ))}
          </div>
          <div className="w-40 pb-2">
            <NativeSelect aria-label="Effect" value={effect} onChange={(event) => { setEffect(event.target.value); setPage(1); }}>
              <option value="">Any effect</option>
              <option value="FAST_TRACK">Fast track</option>
              <option value="PRIORITY">Priority</option>
            </NativeSelect>
          </div>
        </div>

        {error ? (
          <div className="px-5 pt-4">
            <InlineAlert>{error.message}</InlineAlert>
          </div>
        ) : null}

        {isLoading && rows.length === 0 ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-28 animate-pulse rounded-lg bg-black/[0.04]" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-black/45">Nothing here.</p>
        ) : (
          <ul className="divide-y divide-black/[0.06]">
            {rows.map((entry) => (
              <li key={entry.id} className="grid gap-4 px-5 py-4 lg:grid-cols-[16rem_minmax(0,1fr)]">
                <div>
                  <Link href={`/dashboard/beneficiary/${entry.beneficiaryId}`} className="font-semibold text-[#001539] hover:underline">
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
          onPageChange={setPage}
        />
      </Panel>
    </section>
  );
}
