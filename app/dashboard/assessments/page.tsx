"use client";

import { type FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDownUp, RefreshCw, Search, SlidersHorizontal, X } from "lucide-react";

import {
  AssessmentStatusBadge,
  RiskBadge,
  ScoreMeter,
} from "@/components/backoffice/status-badges";
import { FormField } from "@/components/dashboard/form-field";
import { InlineAlert } from "@/components/dashboard/inline-alert";
import { ListPagination } from "@/components/dashboard/list-pagination";
import { PageHeader } from "@/components/dashboard/page-header";
import { Panel } from "@/components/dashboard/panel";
import { isFieldOfficer } from "@/components/dashboard/nav-config";
import { RequireRole } from "@/components/dashboard/require-role";
import { TableMessageRow, TableSkeletonRows } from "@/components/dashboard/table-states";
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
import type { AssessmentListItem, FieldOfficer } from "@/lib/api/backoffice-types";
import type { BranchListItem, PaginatedItems, SessionInfo } from "@/lib/api/types";
import { useResource } from "@/lib/api/use-resource";
import { useSession } from "@/lib/auth/use-session";
import { isEditable } from "@/lib/backoffice/assessment-steps";
import { formatDate } from "@/lib/backoffice/format";
import { formatDateTime } from "@/lib/beneficiary/format";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

/** `status` accepts a comma-separated list. */
type Tab = { status: string; label: string };

const TABS: Tab[] = [
  { status: "", label: "All" },
  { status: "DRAFT,RETURNED", label: "Open" },
  { status: "SUBMITTED", label: "Submitted" },
  { status: "RETURNED", label: "Returned" },
  { status: "APPROVED", label: "Approved" },
  { status: "DEFERRED", label: "Deferred" },
  { status: "REJECTED", label: "Rejected" },
  { status: "CANCELLED", label: "Cancelled" },
];

type Filters = {
  search: string;
  riskCategory: string;
  branchId: string;
  officerId: string;
  dateField: "assessmentDate" | "submittedAt";
  from: string;
  to: string;
  sort: "updatedAt" | "submittedAt" | "assessmentDate" | "score";
  order: "desc" | "asc";
};

const EMPTY: Filters = {
  search: "",
  riskCategory: "",
  branchId: "",
  officerId: "",
  dateField: "assessmentDate",
  from: "",
  to: "",
  sort: "updatedAt",
  order: "desc",
};

/** Each role lands on the queue it acts on. */
function defaultStatus(session: SessionInfo | null) {
  if (session?.isBranch) return "SUBMITTED";
  if (isFieldOfficer(session) && !session?.isAdmin) return "DRAFT,RETURNED";
  return "";
}

function pageCopy(session: SessionInfo | null) {
  if (session?.isBranch) {
    return {
      title: "Review queue",
      description:
        "Assessments submitted by field officers in your branch. Your decision is final: approve, return, defer or reject.",
    };
  }
  if (session?.isAdmin) {
    return {
      title: "Assessments",
      description: "Every assessment in the system. Branch-approved households move on to the disbursement pool.",
    };
  }
  return {
    title: "Assessments",
    description: "Assessments in your assigned branches and regions. Open ones are drafts and returns waiting for you.",
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
  const router = useRouter();
  const isAdmin = session?.isAdmin ?? false;
  // RequireRole only renders once the session is known, so this is stable.
  const [status, setStatus] = useState(() => defaultStatus(session));
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Filters>(EMPTY);
  const [draftSearch, setDraftSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
  if (status) params.set("status", status);
  for (const [key, value] of Object.entries(filters)) {
    if (!value) continue;
    if (key === "dateField" && !filters.from && !filters.to) continue;
    if ((key === "sort" && value === "updatedAt") || (key === "order" && value === "desc")) continue;
    params.set(key, value);
  }

  const { data, error, isLoading, reload } = useResource<PaginatedItems<AssessmentListItem>>(
    `/bff/backoffice/assessments?${params.toString()}`,
  );
  const { data: branches } = useResource<PaginatedItems<BranchListItem>>(
    isAdmin && showFilters ? "/bff/admin/branches?page=1&limit=100" : null,
  );
  const { data: officers } = useResource<PaginatedItems<FieldOfficer>>(
    isAdmin && showFilters ? "/bff/backoffice/admin/field-officers?page=1&limit=100" : null,
  );

  const officer = isFieldOfficer(session);
  const copy = pageCopy(session);
  const rows = data?.items ?? [];
  const activeFilters = (["riskCategory", "branchId", "officerId", "from", "to"] as const).filter(
    (key) => filters[key],
  ).length;
  const hasFilters = !!filters.search || activeFilters > 0;

  function update<K extends keyof Filters>(key: K, value: Filters[K]) {
    setPage(1);
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    update("search", draftSearch.trim());
  }

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

        <div className="space-y-3 border-b border-black/[0.06] px-5 py-3">
          <form onSubmit={onSearch} className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-60 flex-[2]">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-black/35" />
              <Input
                value={draftSearch}
                onChange={(event) => setDraftSearch(event.target.value)}
                placeholder="Name, phone, assessment number or BIN"
                className="bg-white pl-9"
              />
            </div>
            <div className="min-w-44 flex-1">
              <NativeSelect
                aria-label="Sort"
                value={`${filters.sort}:${filters.order}`}
                onChange={(event) => {
                  const [sort, order] = event.target.value.split(":") as [Filters["sort"], Filters["order"]];
                  setPage(1);
                  setFilters((prev) => ({ ...prev, sort, order }));
                }}
              >
                <option value="updatedAt:desc">Recently updated</option>
                <option value="submittedAt:desc">Recently submitted</option>
                <option value="assessmentDate:desc">Assessment date (newest)</option>
                <option value="score:desc">Highest score</option>
                <option value="score:asc">Lowest score</option>
              </NativeSelect>
            </div>
            <Button type="submit" variant="secondary">
              Search
            </Button>
            <Button
              type="button"
              variant={showFilters ? "secondary" : "ghost"}
              onClick={() => setShowFilters((value) => !value)}
              aria-expanded={showFilters}
            >
              <SlidersHorizontal />
              Filters
              {activeFilters ? (
                <span className="rounded-full bg-[#007050] px-1.5 text-[11px] text-white tabular-nums">
                  {activeFilters}
                </span>
              ) : null}
            </Button>
            {hasFilters ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setDraftSearch("");
                  setPage(1);
                  setFilters(EMPTY);
                }}
              >
                <X />
                Clear
              </Button>
            ) : null}
          </form>

          {showFilters ? (
            <div className="grid gap-3 rounded-lg bg-black/[0.02] p-3 sm:grid-cols-2 lg:grid-cols-4">
              <FormField label="Risk" htmlFor="a-risk">
                <NativeSelect id="a-risk" value={filters.riskCategory} onChange={(e) => update("riskCategory", e.target.value)}>
                  <option value="">Any</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </NativeSelect>
              </FormField>
              <FormField label="Date range" htmlFor="a-from" className="lg:col-span-2">
                <div className="flex flex-wrap items-center gap-2">
                  <NativeSelect
                    aria-label="Date field"
                    value={filters.dateField}
                    onChange={(e) => update("dateField", e.target.value as Filters["dateField"])}
                  >
                    <option value="assessmentDate">Assessment date</option>
                    <option value="submittedAt">Submitted</option>
                  </NativeSelect>
                  <Input id="a-from" type="date" value={filters.from} onChange={(e) => update("from", e.target.value)} className="w-auto bg-white" />
                  <span className="text-black/40">–</span>
                  <Input type="date" aria-label="To" value={filters.to} onChange={(e) => update("to", e.target.value)} className="w-auto bg-white" />
                </div>
              </FormField>
              {isAdmin ? (
                <>
                  <FormField label="Branch" htmlFor="a-branch">
                    <NativeSelect id="a-branch" value={filters.branchId} onChange={(e) => update("branchId", e.target.value)}>
                      <option value="">Any</option>
                      {branches?.items.map((branch) => (
                        <option key={branch.id} value={branch.id}>{branch.name}</option>
                      ))}
                    </NativeSelect>
                  </FormField>
                  <FormField label="Field officer" htmlFor="a-officer">
                    <NativeSelect id="a-officer" value={filters.officerId} onChange={(e) => update("officerId", e.target.value)}>
                      <option value="">Any</option>
                      {officers?.items.map((item) => (
                        <option key={item.id} value={item.id}>{item.fullName}</option>
                      ))}
                    </NativeSelect>
                  </FormField>
                </>
              ) : null}
            </div>
          ) : null}
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
              <TableHead>
                <span className="inline-flex items-center gap-1">
                  Assessment date
                  {filters.sort === "assessmentDate" ? <ArrowDownUp className="size-3" /> : null}
                </span>
              </TableHead>
              <TableHead className="pr-5">Last update</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && rows.length === 0 ? (
              <TableSkeletonRows colSpan={6} />
            ) : rows.length === 0 ? (
              <TableMessageRow colSpan={6}>
                {status || hasFilters ? "Nothing matches this view right now." : "No assessments yet."}
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
                      {[item.assessmentNumber, item.bin, item.branchName, item.officerName].filter(Boolean).join(" · ") ||
                        `Assessment #${item.id}`}
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
