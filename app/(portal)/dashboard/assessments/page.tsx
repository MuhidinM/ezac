"use client";

import { type FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDownUp, RefreshCw, SlidersHorizontal, X } from "lucide-react";

import {
  AssessmentStatusBadge,
  RiskBadge,
  ScoreMeter,
} from "@/components/backoffice/status-badges";
import { ErrorAlert } from "@/components/dashboard/error-alert";
import { FormField } from "@/components/dashboard/form-field";
import { ListPagination } from "@/components/dashboard/list-pagination";
import { PageHeader } from "@/components/dashboard/page-header";
import { Panel } from "@/components/dashboard/panel";
import { isFieldOfficer } from "@/components/dashboard/nav-config";
import { RequireRole } from "@/components/dashboard/require-role";
import { TableMessageRow, TableSkeletonRows } from "@/components/dashboard/table-states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { SearchInput } from "@/components/ui/search-input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AssessmentListItem, FieldOfficer } from "@/lib/api/backoffice-types";
import type { BranchListItem, PaginatedItems, SessionInfo } from "@/lib/api/types";
import { useResource } from "@/lib/api/use-resource";
import { useSession } from "@/lib/auth/use-session";
import { isEditable } from "@/lib/backoffice/assessment-steps";
import { formatDate } from "@/lib/backoffice/format";
import { useScoreMax } from "@/lib/backoffice/score-max";
import { dateRangeProblem } from "@/lib/backoffice/list-filters";
import { formatDateTime } from "@/lib/beneficiary/format";
import { useListState } from "@/lib/hooks/use-list-state";
import { isValidEthiopianPhone, normalizePhoneToE164 } from "@/lib/registration/phone";

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

const SORTS = [
  { value: "updatedAt:desc", label: "Recently updated" },
  { value: "submittedAt:desc", label: "Recently submitted" },
  { value: "assessmentDate:desc", label: "Assessment date (newest)" },
  { value: "score:desc", label: "Highest score" },
  { value: "score:asc", label: "Lowest score" },
] as const;

const ALLOWED = {
  status: TABS.map((tab) => tab.status),
  riskCategory: ["", "HIGH", "MEDIUM", "LOW"],
  dateField: ["assessmentDate", "submittedAt"],
  sort: SORTS.map((sort) => sort.value),
};

/** The advanced filters, counted on the Filters button. */
const ADVANCED_KEYS = ["riskCategory", "branchId", "officerId", "from", "to"] as const;

/** Each role lands on the queue it acts on. */
function defaultStatus(session: SessionInfo | null) {
  if (session?.isBranch) return "SUBMITTED";
  if (isFieldOfficer(session) && !session?.isAdmin) return "DRAFT,RETURNED";
  return "";
}

/** Phone numbers are stored as +251…; a local 09… search would match nothing. */
function searchTerm(input: string) {
  const term = input.trim();
  return /^[+\d\s()-]+$/.test(term) && isValidEthiopianPhone(term) ? normalizePhoneToE164(term) : term;
}

/** Officer filter label; the branch tells officers with the same name apart. */
function officerLabel(officer: FieldOfficer) {
  const places = officer.assignments
    ?.filter((item) => item.active)
    .map((item) => item.branchName ?? item.region)
    .filter(Boolean);
  return places?.length ? `${officer.fullName} — ${places.join(", ")}` : officer.fullName;
}

function pageCopy(session: SessionInfo | null) {
  if (session?.isBranch) {
    return {
      title: "Review queue",
      description:
        "Assessments submitted by field officers in your branch. Approve, defer or reject to decide, or return one to the officer for corrections.",
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
    description: "Assessments in your branch. Open ones are drafts and returns waiting for you.",
  };
}

export default function AssessmentsPage() {
  return (
    <RequireRole audience={["hq", "branch"]}>
      {/* useSearchParams needs a Suspense boundary. */}
      <Suspense>
        <AssessmentsView />
      </Suspense>
    </RequireRole>
  );
}

function AssessmentsView() {
  const { session } = useSession();
  const router = useRouter();
  const isAdmin = session?.isAdmin ?? false;

  // Tab, search, filters, sort and page live in the address, so Back from an
  // assessment, a reload or a shared link shows the same list. A ?status= or
  // ?officerId= link (Overview card, officer page) opens that view.
  // RequireRole only renders once the session is known, so the default is stable.
  const [list, setList] = useListState(
    "",
    {
      status: defaultStatus(session),
      search: "",
      riskCategory: "",
      branchId: "",
      officerId: "",
      dateField: "assessmentDate",
      from: "",
      to: "",
      sort: "updatedAt:desc",
      page: 1,
    },
    { allowed: ALLOWED },
  );
  // Only ADMIN has the branch and officer filters, so only ADMIN takes them from a link.
  const branchId = isAdmin ? list.branchId : "";
  const officerId = isAdmin ? list.officerId : "";
  const filters = { ...list, branchId, officerId };

  const [draftSearch, setDraftSearch] = useState(list.search);
  const [seenSearch, setSeenSearch] = useState(list.search);
  if (seenSearch !== list.search) {
    setSeenSearch(list.search);
    setDraftSearch(list.search);
  }
  const activeFilters = ADVANCED_KEYS.filter((key) => filters[key]).length;
  const [showFilters, setShowFilters] = useState(activeFilters > 0);

  // A reversed date range can't match anything: say so and leave it out of the request.
  const dateProblem = dateRangeProblem(filters.from, filters.to);
  const [sort, order] = filters.sort.split(":");
  const params = new URLSearchParams({ page: String(filters.page), limit: String(PAGE_SIZE) });
  if (filters.status) params.set("status", filters.status);
  if (filters.search) params.set("search", filters.search);
  if (filters.riskCategory) params.set("riskCategory", filters.riskCategory);
  if (branchId) params.set("branchId", branchId);
  if (officerId) params.set("officerId", officerId);
  if (!dateProblem && (filters.from || filters.to)) {
    params.set("dateField", filters.dateField);
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);
  }
  if (sort !== "updatedAt" || order !== "desc") {
    params.set("sort", sort);
    params.set("order", order);
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
  // Only rows without their own maxScore need the live maximum.
  const scoreMax = useScoreMax(rows.some((item) => item.totalScore != null && !item.maxScore));
  const hasFilters = !!filters.search || activeFilters > 0;

  function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setList({ search: searchTerm(draftSearch) });
  }

  function clearFilters() {
    setDraftSearch("");
    // The tab and sort stay; only the search and filters go.
    setList({ search: "", riskCategory: "", branchId: "", officerId: "", dateField: "assessmentDate", from: "", to: "" });
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
        <Tabs value={filters.status} onValueChange={(status) => setList({ status })} activationMode="manual">
          <TabsList aria-label="Assessment status">
            {TABS.map((tab) => (
              <TabsTrigger key={tab.label} value={tab.status}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={filters.status}>
            <form role="search" onSubmit={onSearch} className="space-y-3 border-b border-black/[0.06] px-5 py-3">
              <div className="flex flex-wrap items-center gap-3">
                <SearchInput
                  label="Search assessments"
                  wrapperClassName="min-w-60 flex-[2]"
                  value={draftSearch}
                  onChange={(event) => setDraftSearch(event.target.value)}
                  placeholder="Name, phone, assessment number or BIN"
                />
                <div className="min-w-44 flex-1">
                  <NativeSelect
                    aria-label="Sort"
                    value={filters.sort}
                    onChange={(event) => setList({ sort: event.target.value })}
                  >
                    {SORTS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
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
                  aria-controls="assessment-filters"
                >
                  <SlidersHorizontal />
                  Filters
                  {activeFilters ? (
                    <span className="rounded-full bg-brand px-1.5 text-xs text-white tabular-nums">
                      {activeFilters}
                    </span>
                  ) : null}
                </Button>
                {hasFilters || draftSearch ? (
                  <Button type="button" variant="ghost" onClick={clearFilters}>
                    <X />
                    Clear
                  </Button>
                ) : null}
              </div>

              {showFilters ? (
                <div id="assessment-filters" className="grid gap-3 rounded-lg bg-black/[0.02] p-3 sm:grid-cols-2 lg:grid-cols-4">
                  <FormField label="Need" htmlFor="a-risk">
                    <NativeSelect id="a-risk" value={filters.riskCategory} onChange={(e) => setList({ riskCategory: e.target.value })}>
                      <option value="">Any</option>
                      <option value="HIGH">High</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="LOW">Low</option>
                    </NativeSelect>
                  </FormField>
                  <FormField label="Date range" htmlFor="a-from" className="lg:col-span-2" error={dateProblem}>
                    <div className="flex flex-wrap items-center gap-2">
                      <NativeSelect
                        aria-label="Date field"
                        value={filters.dateField}
                        onChange={(e) => setList({ dateField: e.target.value })}
                      >
                        <option value="assessmentDate">Assessment date</option>
                        <option value="submittedAt">Submitted</option>
                      </NativeSelect>
                      <Input
                        id="a-from"
                        type="date"
                        aria-label="From"
                        max={filters.to || undefined}
                        value={filters.from}
                        onChange={(e) => setList({ from: e.target.value })}
                        className="w-auto bg-white"
                      />
                      <span aria-hidden="true" className="text-black/40">–</span>
                      <Input
                        type="date"
                        aria-label="To"
                        min={filters.from || undefined}
                        value={filters.to}
                        onChange={(e) => setList({ to: e.target.value })}
                        className="w-auto bg-white"
                      />
                    </div>
                  </FormField>
                  {isAdmin ? (
                    <>
                      <FormField label="Branch" htmlFor="a-branch">
                        <NativeSelect id="a-branch" value={branchId} onChange={(e) => setList({ branchId: e.target.value })}>
                          <option value="">Any</option>
                          {branchId && !branches?.items.some((item) => item.id === branchId) ? (
                            <option value={branchId}>{branches ? "Branch from the link" : "Loading…"}</option>
                          ) : null}
                          {branches?.items.map((branch) => (
                            <option key={branch.id} value={branch.id}>{branch.name}</option>
                          ))}
                        </NativeSelect>
                      </FormField>
                      <FormField label="Field officer" htmlFor="a-officer">
                        <NativeSelect id="a-officer" value={officerId} onChange={(e) => setList({ officerId: e.target.value })}>
                          <option value="">Any</option>
                          {officerId && !officers?.items.some((item) => item.id === officerId) ? (
                            <option value={officerId}>{officers ? "Officer from the link" : "Loading…"}</option>
                          ) : null}
                          {officers?.items.map((item) => (
                            <option key={item.id} value={item.id}>{officerLabel(item)}</option>
                          ))}
                        </NativeSelect>
                      </FormField>
                    </>
                  ) : null}
                </div>
              ) : null}
            </form>

            {error ? (
              <div className="px-5 pt-4">
                <ErrorAlert error={error} onRetry={reload} />
              </div>
            ) : null}

            <Table>
              <TableHeader>
                <TableRow className="bg-black/[0.015]">
                  <TableHead className="pl-5">Beneficiary</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Need</TableHead>
                  <TableHead>
                    <span className="inline-flex items-center gap-1">
                      Assessment date
                      {sort === "assessmentDate" ? <ArrowDownUp aria-hidden="true" className="size-3" /> : null}
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
                    {filters.status || hasFilters ? "Nothing matches this view right now." : "No assessments yet."}
                  </TableMessageRow>
                ) : (
                  rows.map((item) => (
                    // The row click is a mouse shortcut; the name link is the keyboard way in.
                    <TableRow key={item.id} className="cursor-pointer" onClick={() => router.push(href(item))}>
                      <TableCell className="pl-5">
                        <Link
                          href={href(item)}
                          onClick={(event) => event.stopPropagation()}
                          className="font-medium text-navy hover:underline"
                        >
                          {item.beneficiaryName ?? item.fullName ?? `Beneficiary #${item.beneficiaryId}`}
                        </Link>
                        <p className="text-xs text-black/60">
                          {[item.assessmentNumber, item.bin, item.branchName, item.officerName].filter(Boolean).join(" · ") ||
                            `Assessment #${item.id}`}
                        </p>
                      </TableCell>
                      <TableCell>
                        <AssessmentStatusBadge status={item.status} />
                      </TableCell>
                      <TableCell>
                        <ScoreMeter score={item.totalScore} max={item.maxScore || scoreMax} risk={item.riskCategory} />
                      </TableCell>
                      <TableCell>
                        {item.totalScore != null ? <RiskBadge risk={item.riskCategory} /> : <span className="text-black/60">—</span>}
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
              page={filters.page}
              pageSize={PAGE_SIZE}
              totalItems={data?.pagination.totalItems ?? 0}
              totalPages={data?.pagination.totalPages ?? 1}
              disabled={isLoading}
              onPageChange={(page) => setList({ page })}
            />
          </TabsContent>
        </Tabs>
      </Panel>
    </section>
  );
}
