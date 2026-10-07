"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus } from "lucide-react";

import { InlineAlert } from "@/components/dashboard/inline-alert";
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
import type { PaginatedItems } from "@/lib/api/types";
import { useResource } from "@/lib/api/use-resource";
import { formatDate } from "@/lib/backoffice/format";
import { type AdminCause, type CauseStatus, categoryLabel } from "@/lib/zakat/content";
import { cn } from "@/lib/utils";

const etb = new Intl.NumberFormat("en-ET", { maximumFractionDigits: 0 });

const TABS: { key: CauseStatus | "ALL"; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "DRAFT", label: "Drafts" },
  { key: "ACTIVE", label: "Active" },
  { key: "CLOSED", label: "Closed" },
];

export default function CausesAdminPage() {
  return (
    <RequireRole audience={["admin"]}>
      <CausesAdmin />
    </RequireRole>
  );
}

function CausesAdmin() {
  const [tab, setTab] = useState<CauseStatus | "ALL">("ALL");
  const { data, error, isLoading } = useResource<PaginatedItems<AdminCause> | AdminCause[]>(
    `/api/zakat-admin/causes${tab === "ALL" ? "" : `?status=${tab}`}`,
  );
  const causes = Array.isArray(data) ? data : (data?.items ?? []);

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
        <div className="flex gap-1 border-b border-black/[0.06] px-3 pt-2" role="tablist">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={cn(
                "-mb-px border-b-2 px-3 py-2.5 text-sm transition",
                tab === key ? "border-[#007050] font-medium text-[#001539]" : "border-transparent text-black/55 hover:text-[#001539]",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        {error ? (
          <div className="px-5 pt-4">
            <InlineAlert>{error.message}</InlineAlert>
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
                        <img src={cause.imageUrl} alt="" className="size-10 shrink-0 rounded-md object-cover" />
                      ) : (
                        <span className="size-10 shrink-0 rounded-md bg-black/[0.05]" />
                      )}
                      <span className="min-w-0">
                        <Link
                          href={`/dashboard/zakat/causes/${encodeURIComponent(cause.id)}`}
                          className="block truncate font-medium text-[#001539] after:absolute after:inset-0 hover:underline"
                        >
                          {cause.title}
                        </Link>
                        <span className="block max-w-sm truncate text-xs text-black/50">{cause.description}</span>
                      </span>
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="flex flex-wrap items-center gap-1.5">
                      {categoryLabel(cause.category)}
                      {cause.badge ? <Badge tone={cause.badge === "urgent" ? "danger" : "info"}>{cause.badge === "urgent" ? "Urgent" : "Essential"}</Badge> : null}
                    </span>
                  </TableCell>
                  <TableCell>
                    <CauseStatusBadge status={cause.status} ended={cause.ended} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {cause.raisedEtb != null ? `ETB ${etb.format(cause.raisedEtb)}` : "—"}
                    {cause.goalEtb != null ? <span className="block text-xs text-black/45">of {etb.format(cause.goalEtb)}</span> : null}
                  </TableCell>
                  <TableCell>
                    {cause.progress != null ? (
                      <span className="flex items-center gap-2">
                        <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/[0.06]">
                          <span className="block h-full rounded-full bg-[#007050]" style={{ width: `${Math.round(cause.progress * 100)}%` }} />
                        </span>
                        <span className="w-9 text-right text-xs tabular-nums text-black/55">{Math.round(cause.progress * 100)}%</span>
                      </span>
                    ) : (
                      <span className="text-xs text-black/40">No goal</span>
                    )}
                  </TableCell>
                  <TableCell className="pr-5 text-sm text-black/60">{formatDate(cause.endsOn)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Panel>
    </section>
  );
}
