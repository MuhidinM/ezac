"use client";

import { type FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RefreshCw, Search, SlidersHorizontal, UserPlus, X } from "lucide-react";

import {
  AssessmentStatusBadge,
  DuplicateBadge,
  LifecycleBadge,
  RiskBadge,
  ScoreMeter,
} from "@/components/backoffice/status-badges";
import { VerificationStatusBadge } from "@/components/beneficiary/verification-status-badge";
import { FormField } from "@/components/dashboard/form-field";
import { InlineAlert } from "@/components/dashboard/inline-alert";
import { ListPagination } from "@/components/dashboard/list-pagination";
import { PageHeader } from "@/components/dashboard/page-header";
import { Panel } from "@/components/dashboard/panel";
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
import type { BeneficiaryListItem, BranchListItem, PaginatedItems } from "@/lib/api/types";
import { useResource } from "@/lib/api/use-resource";
import { useSession } from "@/lib/auth/use-session";
import { ASNAF } from "@/lib/backoffice/options";
import { formatBeneficiaryCategory, formatDateTime } from "@/lib/beneficiary/format";
import { ETHIOPIAN_REGIONS } from "@/lib/constants/regions";
import { consumeRegistrationSuccessFlag } from "@/lib/registration/session";

const PAGE_SIZE = 20;

type Filters = {
  search: string;
  lifecycleStatus: string;
  riskCategory: string;
  assessmentStatus: string;
  assessed: "" | "assessed" | "not_assessed";
  verificationStatus: string;
  beneficiaryType: string;
  minScore: string;
  maxScore: string;
  asnaf: string;
  branchId: string;
  region: string;
};

const EMPTY_FILTERS: Filters = {
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
};

const ADVANCED_KEYS: (keyof Filters)[] = [
  "assessmentStatus",
  "assessed",
  "verificationStatus",
  "beneficiaryType",
  "minScore",
  "maxScore",
  "asnaf",
  "branchId",
  "region",
];

function toQuery(filters: Filters, page: number) {
  const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
  for (const [key, value] of Object.entries(filters)) {
    if (!value || key === "assessed") continue;
    params.set(key, value);
  }
  if (filters.assessed) params.set("notAssessed", String(filters.assessed === "not_assessed"));
  return params.toString();
}

export default function BeneficiaryPage() {
  const router = useRouter();
  const { session } = useSession();
  const isAdmin = session?.isAdmin ?? false;

  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [draftSearch, setDraftSearch] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (consumeRegistrationSuccessFlag()) {
      // Read once from sessionStorage after a registration redirect.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSuccessMessage("Beneficiary registered successfully.");
    }
  }, []);

  const { data, error, isLoading, reload } = useResource<PaginatedItems<BeneficiaryListItem>>(
    `/api/backoffice/beneficiaries?${toQuery(filters, page)}`,
  );
  const { data: branches } = useResource<PaginatedItems<BranchListItem>>(
    isAdmin ? "/api/admin/branches?page=1&limit=100" : null,
  );

  function update<K extends keyof Filters>(key: K, value: Filters[K]) {
    setPage(1);
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    update("search", draftSearch.trim());
  }

  const activeAdvanced = ADVANCED_KEYS.filter((key) => filters[key]).length;
  const hasFilters = Object.values(filters).some(Boolean);
  const rows = data?.items ?? [];

  return (
    <section className="space-y-6">
      <PageHeader
        title="Beneficiaries"
        description="Registered applicants with their lifecycle stage, latest means-test score and risk."
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
        <div className="space-y-3 border-b border-black/[0.06] px-5 py-3">
          <form onSubmit={onSearch} className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-60 flex-[2]">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-black/35" />
              <Input
                value={draftSearch}
                onChange={(event) => setDraftSearch(event.target.value)}
                placeholder="Search name, phone or national ID"
                className="bg-white pl-9"
              />
            </div>
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
                aria-label="Risk"
                value={filters.riskCategory}
                onChange={(event) => update("riskCategory", event.target.value)}
              >
                <option value="">Any risk</option>
                <option value="HIGH">High risk</option>
                <option value="MEDIUM">Medium risk</option>
                <option value="LOW">Low risk</option>
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
            >
              <SlidersHorizontal />
              Filters
              {activeAdvanced ? (
                <span className="rounded-full bg-[#007050] px-1.5 text-[11px] text-white tabular-nums">
                  {activeAdvanced}
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
                  setFilters(EMPTY_FILTERS);
                }}
              >
                <X />
                Clear
              </Button>
            ) : null}
          </form>

          {showAdvanced ? (
            <div className="grid gap-3 rounded-lg bg-black/[0.02] p-3 sm:grid-cols-2 lg:grid-cols-4">
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
                  onChange={(event) => update("assessed", event.target.value as Filters["assessed"])}
                >
                  <option value="">All</option>
                  <option value="assessed">Has a score</option>
                  <option value="not_assessed">Not assessed yet</option>
                </NativeSelect>
              </FormField>
              <FormField label="Score range (0–270)" htmlFor="f-min">
                <div className="flex items-center gap-2">
                  <Input
                    id="f-min"
                    type="number"
                    min={0}
                    max={270}
                    inputMode="numeric"
                    placeholder="Min"
                    value={filters.minScore}
                    onChange={(event) => update("minScore", event.target.value)}
                    className="bg-white"
                  />
                  <span className="text-black/40">–</span>
                  <Input
                    type="number"
                    min={0}
                    max={270}
                    inputMode="numeric"
                    placeholder="Max"
                    aria-label="Maximum score"
                    value={filters.maxScore}
                    onChange={(event) => update("maxScore", event.target.value)}
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
                  <option value="pending_third_party">Fayda in progress</option>
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
              {isAdmin ? (
                <FormField label="Branch" htmlFor="f-branch">
                  <NativeSelect
                    id="f-branch"
                    value={filters.branchId}
                    onChange={(event) => update("branchId", event.target.value)}
                  >
                    <option value="">Any</option>
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
              <TableHead>Category</TableHead>
              <TableHead>Lifecycle</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Risk</TableHead>
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
                  onClick={() => router.push(`/dashboard/beneficiary/${item.id}`)}
                >
                  <TableCell className="pl-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/dashboard/beneficiary/${item.id}`}
                        className="font-medium text-[#001539] hover:underline"
                        onClick={(event) => event.stopPropagation()}
                      >
                        {item.fullName ?? "Unnamed beneficiary"}
                      </Link>
                      <DuplicateBadge status={item.duplicateStatus} />
                    </div>
                    <p className="text-xs text-black/50 tabular-nums">
                      {item.phone ?? "—"}
                      <span className="capitalize"> · {item.beneficiaryType}</span>
                    </p>
                  </TableCell>
                  <TableCell>{formatBeneficiaryCategory(item.beneficiaryCategory)}</TableCell>
                  <TableCell>
                    <LifecycleBadge status={item.lifecycleStatus} />
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
