"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

import {
  AssessmentStatusBadge,
  RiskBadge,
  ScoreMeter,
} from "@/components/backoffice/status-badges";
import { InlineAlert } from "@/components/dashboard/inline-alert";
import { ListPagination } from "@/components/dashboard/list-pagination";
import { PageHeader } from "@/components/dashboard/page-header";
import { Panel } from "@/components/dashboard/panel";
import { isFieldOfficer } from "@/components/dashboard/nav-config";
import { RequireRole } from "@/components/dashboard/require-role";
import { TableMessageRow, TableSkeletonRows } from "@/components/dashboard/table-states";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AssessmentListItem, AssessmentStatus } from "@/lib/api/backoffice-types";
import type { PaginatedItems, SessionInfo } from "@/lib/api/types";
import { useResource } from "@/lib/api/use-resource";
import { useSession } from "@/lib/auth/use-session";
import { isEditable } from "@/lib/backoffice/assessment-steps";
import { formatDate } from "@/lib/backoffice/format";
import { formatDateTime } from "@/lib/beneficiary/format";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

type Tab = { status: AssessmentStatus | ""; label: string };

const TABS: Tab[] = [
  { status: "", label: "All" },
  { status: "DRAFT", label: "Draft" },
  { status: "RETURNED", label: "Returned" },
  { status: "SUBMITTED", label: "Submitted" },
  { status: "SUPERVISOR_APPROVED", label: "Supervisor approved" },
  { status: "APPROVED", label: "Approved" },
  { status: "CONDITIONALLY_APPROVED", label: "Conditional" },
  { status: "DEFERRED", label: "Deferred" },
  { status: "REJECTED", label: "Rejected" },
];

/** Each role lands on the queue it acts on. */
function defaultStatus(session: SessionInfo | null): AssessmentStatus | "" {
  if (session?.isBranch) return "SUBMITTED";
  if (session?.isAdmin) return "SUPERVISOR_APPROVED";
  return "";
}

function pageCopy(session: SessionInfo | null) {
  if (session?.isBranch) {
    return {
      title: "Review queue",
      description: "Assessments submitted by field officers in your branch. Return them for correction or approve them for the committee.",
    };
  }
  if (session?.isAdmin) {
    return {
      title: "Assessments",
      description: "Every assessment in the system. Supervisor-approved ones are waiting for a committee decision.",
    };
  }
  return {
    title: "Assessments",
    description: "Assessments in your assigned branches and regions. Drafts and returned ones are waiting for you.",
  };
}

export default function AssessmentsPage() {
  return (
    <RequireRole audience={["hq", "branch"]}>
      <AssessmentsView />
    </RequireRole>
  );
}

function AssessmentsView() {
  const { session } = useSession();
  // RequireRole only renders once the session is known, so this is stable.
  const [status, setStatus] = useState<AssessmentStatus | "">(() => defaultStatus(session));
  const [page, setPage] = useState(1);
  const router = useRouter();

  const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
  if (status) params.set("status", status);
  const { data, error, isLoading, reload } = useResource<PaginatedItems<AssessmentListItem>>(
    `/api/backoffice/assessments?${params.toString()}`,
  );

  const officer = isFieldOfficer(session);
  const copy = pageCopy(session);
  const rows = data?.items ?? [];

  function href(item: AssessmentListItem) {
    return officer && isEditable(item.status)
      ? `/dashboard/assessments/${item.id}/edit`
      : `/dashboard/assessments/${item.id}`;
  }

  return (
    <section className="space-y-6">
      <PageHeader
        title={copy.title}
        description={copy.description}
        actions={
          <Button variant="outline" onClick={reload} disabled={isLoading}>
            <RefreshCw />
            Refresh
          </Button>
        }
      />

      <Panel flush>
        <div className="flex gap-1 overflow-x-auto border-b border-black/[0.06] px-3 pt-2" role="tablist">
          {TABS.map((tab) => {
            const active = tab.status === status;
            return (
              <button
                key={tab.label}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setPage(1);
                  setStatus(tab.status);
                }}
                className={cn(
                  "-mb-px shrink-0 border-b-2 px-3 py-2.5 text-sm whitespace-nowrap transition",
                  active
                    ? "border-[#007050] font-medium text-[#001539]"
                    : "border-transparent text-black/55 hover:text-[#001539]",
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {error ? (
          <div className="px-5 pt-4">
            <InlineAlert>{error.message}</InlineAlert>
          </div>
        ) : null}

        <Table>
          <TableHeader>
            <TableRow className="bg-black/[0.015]">
              <TableHead className="pl-5">Beneficiary</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Risk</TableHead>
              <TableHead>Assessment date</TableHead>
              <TableHead className="pr-5">Last update</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && rows.length === 0 ? (
              <TableSkeletonRows colSpan={6} />
            ) : rows.length === 0 ? (
              <TableMessageRow colSpan={6}>
                {status ? "Nothing in this queue right now." : "No assessments yet."}
              </TableMessageRow>
            ) : (
              rows.map((item) => (
                <TableRow key={item.id} className="cursor-pointer" onClick={() => router.push(href(item))}>
                  <TableCell className="pl-5">
                    <Link
                      href={href(item)}
                      onClick={(event) => event.stopPropagation()}
                      className="font-medium text-[#001539] hover:underline"
                    >
                      {item.beneficiaryName ?? item.fullName ?? `Beneficiary #${item.beneficiaryId}`}
                    </Link>
                    <p className="text-xs text-black/50">
                      {[item.bin, item.branchName, item.officerName].filter(Boolean).join(" · ") || `Assessment #${item.id}`}
                    </p>
                  </TableCell>
                  <TableCell>
                    <AssessmentStatusBadge status={item.status} />
                  </TableCell>
                  <TableCell>
                    <ScoreMeter score={item.totalScore} max={item.maxScore} risk={item.riskCategory} />
                  </TableCell>
                  <TableCell>
                    {item.totalScore != null ? <RiskBadge risk={item.riskCategory} /> : <span className="text-black/40">—</span>}
                  </TableCell>
                  <TableCell>{formatDate(item.assessmentDate)}</TableCell>
                  <TableCell className="pr-5 text-sm text-black/60">
                    {formatDateTime(item.updatedAt ?? item.submittedAt ?? item.createdAt ?? null)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

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
