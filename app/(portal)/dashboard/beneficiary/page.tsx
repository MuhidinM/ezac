"use client";

import { type FormEvent, Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Landmark, RefreshCw, SlidersHorizontal, UserPlus, X } from "lucide-react";

import {
  AssessmentStatusBadge,
  DuplicateBadge,
  LifecycleBadge,
  PoolStatusBadge,
  RiskBadge,
  ScoreMeter,
  WhitelistBadge,
} from "@/components/backoffice/status-badges";
import { VerificationStatusBadge } from "@/components/beneficiary/verification-status-badge";
import { ErrorAlert } from "@/components/dashboard/error-alert";
import { FormField } from "@/components/dashboard/form-field";
import { InlineAlert } from "@/components/dashboard/inline-alert";
import { ListPagination } from "@/components/dashboard/list-pagination";
import { PageHeader } from "@/components/dashboard/page-header";
import { Panel } from "@/components/dashboard/panel";
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
import type { BeneficiaryListItem, BranchListItem, PaginatedItems } from "@/lib/api/types";
import { useResource } from "@/lib/api/use-resource";
import { useSession } from "@/lib/auth/use-session";
import { scoreRangeProblem } from "@/lib/backoffice/list-filters";
import { ASNAF } from "@/lib/backoffice/options";
import { useScoreMax } from "@/lib/backoffice/score-max";
import { formatBeneficiaryCategory, formatDateTime } from "@/lib/beneficiary/format";
import { ETHIOPIAN_REGIONS } from "@/lib/constants/regions";
import { useListState } from "@/lib/hooks/use-list-state";
import { phoneSearchTerm } from "@/lib/registration/phone";
import { consumeRegistrationSuccessFlag } from "@/lib/registration/session";

const PAGE_SIZE = 20;

/** The list's filters and page, kept in the address (see useListState). */
const DEFAULTS = {
  search: "",
  lifecycleStatus: "",
  riskCategory: "",
  assessmentStatus: "",
  assessed: "",
  verificationStatus: "",
  beneficiaryType: "",
  minScore: "",
  maxScore: "",
  asnaf: "",
  branchId: "",
  region: "",
  whitelistEffect: "",
  page: 1,
};

type Filters = typeof DEFAULTS;

const ALLOWED = {
  lifecycleStatus: ["", "PENDING_ASSESSMENT", "UNDER_ASSESSMENT", "ASSESSED", "ACTIVE", "INACTIVE", "GRADUATED", "EXITED"],
  riskCategory: ["", "HIGH", "MEDIUM", "LOW"],
  assessmentStatus: ["", "DRAFT", "SUBMITTED", "RETURNED", "APPROVED", "CANCELLED", "DEFERRED", "REJECTED"],
  assessed: ["", "assessed", "not_assessed"],
  verificationStatus: ["", "pending", "verified", "rejected"],
  beneficiaryType: ["", "individual", "institution"],
  whitelistEffect: ["", "any", "FAST_TRACK", "PRIORITY", "none"],
} as const;

const ADVANCED_KEYS = [
  "assessmentStatus",
  "assessed",
  "verificationStatus",
  "beneficiaryType",
  "minScore",
  "maxScore",
  "asnaf",
  "branchId",
  "region",
  "whitelistEffect",
] as const satisfies readonly (keyof Filters)[];

function toQuery(filters: Filters) {
  const params = new URLSearchParams({ page: String(filters.page), limit: String(PAGE_SIZE) });
  // A reversed score range can't match anything: leave it out until it's fixed.
  const scoreOk = !scoreRangeProblem(filters.minScore, filters.maxScore);
  for (const [key, value] of Object.entries(filters)) {
    if (!value || key === "page" || key === "assessed" || key === "whitelistEffect") continue;
    if ((key === "minScore" || key === "maxScore") && !scoreOk) continue;
    params.set(key, String(value));
  }
  if (filters.assessed) params.set("notAssessed", String(filters.assessed === "not_assessed"));
  if (filters.whitelistEffect === "any") params.set("whitelisted", "true");
  else if (filters.whitelistEffect === "none") params.set("whitelisted", "false");
  else if (filters.whitelistEffect) params.set("whitelistEffect", filters.whitelistEffect);
  return params.toString();
}

export default function BeneficiaryPage() {
  return (
    // useListState reads the address through useSearchParams.
    <Suspense>
      <Beneficiaries />
    </Suspense>
  );
}

function Beneficiaries() {
  const router = useRouter();
  const { session } = useSession();
  const isAdmin = session?.isAdmin ?? false;

  const [list, setFilters, { reset, isDefault }] = useListState("", DEFAULTS, { allowed: ALLOWED });
  // Only ADMIN has the branch filter, so only ADMIN takes it from a link: for
  // anyone else it would narrow the list by a filter they can't see or change.
  // Kept while the session is still loading, so an admin's link doesn't load twice.
  const filters = session && !isAdmin ? { ...list, branchId: "" } : list;
  const [draftSearch, setDraftSearch] = useState(filters.search);
  // Score bounds apply on Enter or when the field is left, not on every keystroke.
  const [draftScore, setDraftScore] = useState({ min: filters.minScore, max: filters.maxScore });
  // Keep the drafts in step when the address changes (Clear, Back, a link).
  const [seen, setSeen] = useState({ search: filters.search, min: filters.minScore, max: filters.maxScore });
  if (seen.search !== filters.search || seen.min !== filters.minScore || seen.max !== filters.maxScore) {
    setSeen({ search: filters.search, min: filters.minScore, max: filters.maxScore });
    setDraftSearch(filters.search);
    setDraftScore({ min: filters.minScore, max: filters.maxScore });
  }
  const activeAdvanced = ADVANCED_KEYS.filter((key) => filters[key]).length;
  const [showAdvanced, setShowAdvanced] = useState(activeAdvanced > 0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (consumeRegistrationSuccessFlag()) {
      // Read once from sessionStorage after a registration redirect.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSuccessMessage("Beneficiary registered successfully.");
    }
  }, []);

  const { data, error, isLoading, reload } = useResource<PaginatedItems<BeneficiaryListItem>>(
    `/bff/backoffice/beneficiaries?${toQuery(filters)}`,
  );
  const { data: branches } = useResource<PaginatedItems<BranchListItem>>(
    isAdmin ? "/bff/admin/branches?page=1&limit=100" : null,
  );
  // The active scoring config's maximum, read once the score filter is shown.
  const scoreMax = useScoreMax(showAdvanced);
  const scoreProblem = scoreRangeProblem(draftScore.min, draftScore.max, scoreMax);

  function update<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters({ [key]: value } as Partial<Filters>);
  }

  function applyScore() {
    if (scoreRangeProblem(draftScore.min, draftScore.max, scoreMax)) return;
    setFilters({ minScore: draftScore.min.trim(), maxScore: draftScore.max.trim() });
  }

  function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Phones are stored as +251…, so a local 09… number finds nothing as typed.
    const valid = !scoreRangeProblem(draftScore.min, draftScore.max, scoreMax);
    setFilters({
      search: phoneSearchTerm(draftSearch),
      ...(valid ? { minScore: draftScore.min.trim(), maxScore: draftScore.max.trim() } : {}),
    });
  }

  const hasFilters = !isDefault;
  const rows = data?.items ?? [];

  return (
    <section className="space-y-6">
      <PageHeader
        title="Beneficiaries"
        description="Registered applicants with their lifecycle stage, latest means-test score and need level."
        actions={
          <>
            <Button variant="outline" onClick={reload} disabled={isLoading}>
              <RefreshCw />
              Refresh
            </Button>
            <Button asChild>
              <Link href="/dashboard/register">
                <UserPlus />
                Register beneficiary
              </Link>
            </Button>
          </>
        }
      />

      {successMessage ? <InlineAlert tone="success">{successMessage}</InlineAlert> : null}

      <Panel flush>
        <form role="search" onSubmit={onSearch} className="space-y-3 border-b border-black/[0.06] px-5 py-3">
          <div className="flex flex-wrap items-center gap-3">
            <SearchInput
              label="Search beneficiaries"
              wrapperClassName="min-w-60 flex-[2]"
              value={draftSearch}
              onChange={(event) => setDraftSearch(event.target.value)}
              placeholder="Search name, phone or bank account number"
            />
            <div className="min-w-44 flex-1">
              <NativeSelect
                aria-label="Lifecycle"
                value={filters.lifecycleStatus}
                onChange={(event) => update("lifecycleStatus", event.target.value)}
              >
                <option value="">All lifecycle stages</option>
                <option value="PENDING_ASSESSMENT">Pending assessment</option>
                <option value="UNDER_ASSESSMENT">Under assessment</option>
                <option value="ASSESSED">Assessed</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="GRADUATED">Graduated</option>
                <option value="EXITED">Exited</option>
              </NativeSelect>
            </div>
            <div className="min-w-36 flex-1">
              <NativeSelect
                aria-label="Need"
                value={filters.riskCategory}
                onChange={(event) => update("riskCategory", event.target.value)}
              >
                <option value="">Any need level</option>
                <option value="HIGH">High need</option>
                <option value="MEDIUM">Medium need</option>
                <option value="LOW">Low need</option>
              </NativeSelect>
            </div>
            <Button type="submit" variant="secondary">
              Search
            </Button>
            <Button
              type="button"
              variant={showAdvanced ? "secondary" : "ghost"}
              onClick={() => setShowAdvanced((value) => !value)}
              aria-expanded={showAdvanced}
              aria-controls="beneficiary-filters"
            >
              <SlidersHorizontal />
              Filters
              {activeAdvanced ? (
                <span className="rounded-full bg-brand px-1.5 text-[11px] text-white tabular-nums">
                  {activeAdvanced}
                </span>
              ) : null}
            </Button>
            {hasFilters || draftSearch ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setDraftSearch("");
                  setDraftScore({ min: "", max: "" });
                  reset();
                }}
              >
                <X />
                Clear
              </Button>
            ) : null}
          </div>

          {showAdvanced ? (
            <div id="beneficiary-filters" className="grid gap-3 rounded-lg bg-black/[0.02] p-3 sm:grid-cols-2 lg:grid-cols-4">
              <FormField label="Assessment status" htmlFor="f-assessment">
                <NativeSelect
                  id="f-assessment"
                  value={filters.assessmentStatus}
                  onChange={(event) => update("assessmentStatus", event.target.value)}
                >
                  <option value="">Any</option>
                  <option value="DRAFT">Draft</option>
                  <option value="SUBMITTED">Submitted</option>
                  <option value="RETURNED">Returned</option>
                  <option value="APPROVED">Approved</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="DEFERRED">Deferred</option>
                  <option value="REJECTED">Rejected</option>
                </NativeSelect>
              </FormField>
              <FormField label="Scored" htmlFor="f-assessed">
                <NativeSelect
                  id="f-assessed"
                  value={filters.assessed}
                  onChange={(event) => update("assessed", event.target.value)}
                >
                  <option value="">All</option>
                  <option value="assessed">Has a score</option>
                  <option value="not_assessed">Not assessed yet</option>
                </NativeSelect>
              </FormField>
              <FormField
                label={`Score range (0–${scoreMax})`}
                htmlFor="f-min"
                error={scoreProblem}
                hint={scoreProblem ? undefined : "Applied when you press Enter or leave the field"}
              >
                <div className="flex items-center gap-2">
                  <Input
                    id="f-min"
                    type="number"
                    min={0}
                    max={scoreMax}
                    inputMode="numeric"
                    placeholder="Min"
                    value={draftScore.min}
                    onChange={(event) => setDraftScore((prev) => ({ ...prev, min: event.target.value }))}
                    onBlur={applyScore}
                    className="bg-white"
                  />
                  <span aria-hidden="true" className="text-black/40">–</span>
                  <Input
                    type="number"
                    min={0}
                    max={scoreMax}
                    inputMode="numeric"
                    placeholder="Max"
                    aria-label="Maximum score"
                    value={draftScore.max}
                    onChange={(event) => setDraftScore((prev) => ({ ...prev, max: event.target.value }))}
                    onBlur={applyScore}
                    className="bg-white"
                  />
                </div>
              </FormField>
              <FormField label="Asnaf" htmlFor="f-asnaf">
                <NativeSelect
                  id="f-asnaf"
                  value={filters.asnaf}
                  onChange={(event) => update("asnaf", event.target.value)}
                >
                  <option value="">Any</option>
                  {ASNAF.filter((option) => option.value !== "other").map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </NativeSelect>
              </FormField>
              <FormField label="Verification" htmlFor="f-verification">
                <NativeSelect
                  id="f-verification"
                  value={filters.verificationStatus}
                  onChange={(event) => update("verificationStatus", event.target.value)}
                >
                  <option value="">Any</option>
                  <option value="pending">Pending review</option>
                  {/* "Fayda in progress" is not a filter the backend accepts (400). */}
                  <option value="verified">Verified</option>
                  <option value="rejected">Rejected</option>
                </NativeSelect>
              </FormField>
              <FormField label="Type" htmlFor="f-type">
                <NativeSelect
                  id="f-type"
                  value={filters.beneficiaryType}
                  onChange={(event) => update("beneficiaryType", event.target.value)}
                >
                  <option value="">Any</option>
                  <option value="individual">Individual</option>
                  <option value="institution">Institution</option>
                </NativeSelect>
              </FormField>
              <FormField label="Region" htmlFor="f-region">
                <NativeSelect
                  id="f-region"
                  value={filters.region}
                  onChange={(event) => update("region", event.target.value)}
                >
                  <option value="">Any</option>
                  {ETHIOPIAN_REGIONS.map((region) => (
                    <option key={region} value={region}>
                      {region}
                    </option>
                  ))}
                </NativeSelect>
              </FormField>
              <FormField label="Whitelist" htmlFor="f-whitelist">
                <NativeSelect
                  id="f-whitelist"
                  value={filters.whitelistEffect}
                  onChange={(event) => update("whitelistEffect", event.target.value)}
                >
                  <option value="">Any</option>
                  <option value="any">Whitelisted</option>
                  <option value="FAST_TRACK">Fast track</option>
                  <option value="PRIORITY">Priority</option>
                  <option value="none">Not whitelisted</option>
                </NativeSelect>
              </FormField>
              {isAdmin ? (
                <FormField label="Branch" htmlFor="f-branch">
                  <NativeSelect
                    id="f-branch"
                    value={filters.branchId}
                    onChange={(event) => update("branchId", event.target.value)}
                  >
                    <option value="">Any</option>
                    {filters.branchId && !branches?.items.some((branch) => branch.id === filters.branchId) ? (
                      <option value={filters.branchId}>{branches ? "Branch from the link" : "Loading…"}</option>
                    ) : null}
                    {branches?.items.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </NativeSelect>
                </FormField>
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
              <TableHead>Category</TableHead>
              <TableHead>Lifecycle</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Need</TableHead>
              <TableHead>Assessment</TableHead>
              <TableHead className="pr-5">Verification</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && rows.length === 0 ? (
              <TableSkeletonRows colSpan={7} />
            ) : rows.length === 0 ? (
              <TableMessageRow colSpan={7}>
                {hasFilters ? "No beneficiaries match your filters." : "No beneficiaries registered yet."}
              </TableMessageRow>
            ) : (
              rows.map((item) => (
                <TableRow
                  key={item.id}
                  className="cursor-pointer"
                  // A mouse shortcut; the name link is the keyboard and screen-reader way in.
                  onClick={() => router.push(`/dashboard/beneficiary/${item.id}`)}
                >
                  <TableCell className="pl-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/dashboard/beneficiary/${item.id}`}
                        className="font-medium text-navy hover:underline"
                        onClick={(event) => event.stopPropagation()}
                      >
                        {item.fullName ?? "Unnamed beneficiary"}
                      </Link>
                      <WhitelistBadge effect={item.whitelistEffect} />
                      <DuplicateBadge status={item.duplicateStatus} />
                      {item.hasBankAccount === false && item.beneficiaryType === "individual" ? (
                        <span title="No bank account yet" className="text-amber-600">
                          <Landmark className="size-3.5" aria-label="No bank account yet" />
                        </span>
                      ) : null}
                    </div>
                    <p className="text-xs text-black/50 tabular-nums">
                      {item.phone ?? "—"}
                      <span className="capitalize"> · {item.beneficiaryType}</span>
                    </p>
                  </TableCell>
                  <TableCell>{formatBeneficiaryCategory(item.beneficiaryCategory)}</TableCell>
                  <TableCell>
                    <div className="flex flex-col items-start gap-1">
                      <LifecycleBadge status={item.lifecycleStatus} />
                      <PoolStatusBadge status={item.poolStatus} />
                    </div>
                  </TableCell>
                  <TableCell>
                    <ScoreMeter score={item.score} max={item.maxScore} risk={item.riskCategory} />
                  </TableCell>
                  <TableCell>
                    <RiskBadge risk={item.riskCategory} />
                  </TableCell>
                  <TableCell>
                    <AssessmentStatusBadge status={item.assessmentStatus} />
                    {item.lastAssessedAt ? (
                      <p className="mt-1 text-xs text-black/45">
                        {formatDateTime(item.lastAssessedAt)}
                      </p>
                    ) : null}
                  </TableCell>
                  <TableCell className="pr-5">
                    <VerificationStatusBadge status={item.verificationStatus} />
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
          onPageChange={(page) => setFilters({ page })}
        />
      </Panel>
    </section>
  );
}
