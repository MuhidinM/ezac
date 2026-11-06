"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ClipboardCheck, CornerUpLeft, Network, Timer, UserCog, UserPlus, Users } from "lucide-react";

import { AssessmentStatusBadge } from "@/components/backoffice/status-badges";
import { StatTile, formatCompact } from "@/components/charts/stat-tile";
import { InlineAlert } from "@/components/dashboard/inline-alert";
import { isFieldOfficer } from "@/components/dashboard/nav-config";
import { Panel } from "@/components/dashboard/panel";
import { RangeSelect } from "@/components/dashboard/range-select";
import { OverviewDashboard } from "@/components/overview/overview-dashboard";
import { NativeSelect } from "@/components/ui/native-select";
import type { OfficerHome } from "@/lib/api/backoffice-types";
import { useResource } from "@/lib/api/use-resource";
import { useSession } from "@/lib/auth/use-session";
import { rangeQuery, type RangeKey } from "@/lib/backoffice/date-range";
import { formatDays } from "@/lib/backoffice/format";
import { formatDateTime } from "@/lib/beneficiary/format";
import { ETHIOPIAN_REGIONS } from "@/lib/constants/regions";

const API = "/bff/backoffice/analytics";
const days = formatDays;

export default function DashboardHomePage() {
  const { session } = useSession();
  const [range, setRange] = useState<RangeKey>("30d");
  const [region, setRegion] = useState("");
  const isAdmin = session?.isAdmin ?? false;
  const officer = isFieldOfficer(session) && !isAdmin;
  const name = session?.displayName?.trim() || session?.username;

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-navy">
            {name ? `Welcome back, ${name}` : "Overview"}
          </h1>
          <p className="mt-1 text-sm text-black/60">
            {isAdmin
              ? "Registration, assessment and disbursement activity across EZAC."
              : "Activity in your assigned branches and regions."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isAdmin ? (
            <div className="w-44">
              <NativeSelect aria-label="Region" value={region} onChange={(event) => setRegion(event.target.value)}>
                <option value="">All regions</option>
                {ETHIOPIAN_REGIONS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </NativeSelect>
            </div>
          ) : null}
          <RangeSelect value={range} onChange={setRange} />
        </div>
      </div>

      {officer ? <OfficerSummary range={range} /> : null}

      <OverviewDashboard range={range} region={region} isAdmin={isAdmin} />

      <QuickActions isAdmin={isAdmin} />
    </section>
  );
}

function OfficerSummary({ range }: { range: RangeKey }) {
  const { data, error, isLoading } = useResource<OfficerHome>(`${API}/me?${rangeQuery(range)}`);
  const loading = isLoading && !data;

  if (error) return <InlineAlert>{error.message}</InlineAlert>;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatTile label="Drafts" value={formatCompact(data?.drafts)} hint="Started, not submitted" icon={ClipboardCheck} loading={loading} />
        <StatTile label="Returned to you" value={formatCompact(data?.returned)} hint="Needs corrections" icon={CornerUpLeft} loading={loading} />
        <StatTile
          label="Waiting for assessment"
          value={formatCompact(data?.beneficiariesPendingAssessment)}
          hint="Registered in your area"
          icon={Users}
          loading={loading}
        />
        <StatTile label="Submitted" value={formatCompact(data?.submittedInRange)} hint="In this period" loading={loading} />
        <StatTile label="Approved" value={formatCompact(data?.approvedInRange)} hint="By the branch, this period" loading={loading} />
        <StatTile
          label="Days to submit"
          value={days(data?.averageDaysToSubmit)}
          hint="Average, start to submission"
          icon={Timer}
          loading={loading}
        />
      </div>
      <Panel title="Recent assessments" flush>
        {(data?.recent ?? []).length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-black/60">{loading ? "Loading…" : "Nothing yet."}</p>
        ) : (
          <ul className="divide-y divide-black/[0.05]">
            {(data?.recent ?? []).map((item) => (
              <li key={item.assessmentId}>
                <Link
                  href={
                    item.status === "DRAFT" || item.status === "RETURNED"
                      ? `/dashboard/assessments/${item.assessmentId}/edit`
                      : `/dashboard/assessments/${item.assessmentId}`
                  }
                  className="flex items-center justify-between gap-3 px-5 py-3 transition hover:bg-black/[0.02]"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-navy">
                      {item.beneficiaryName ?? `#${item.assessmentId}`}
                    </span>
                    <span className="block text-xs text-black/60">{formatDateTime(item.updatedAt)}</span>
                  </span>
                  <AssessmentStatusBadge status={item.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

const ACTIONS = [
  { title: "Register a beneficiary", description: "Walk-in registration at a branch.", href: "/dashboard/register", icon: UserPlus },
  { title: "Assessments", description: "Drafts, returns and decisions.", href: "/dashboard/assessments", icon: ClipboardCheck },
  { title: "Manage branches", description: "Branches, officers and registration codes.", href: "/dashboard/branches", icon: Network, adminOnly: true },
  {
    title: "Manage field officers",
    description: "Create officers and set their branch or region.",
    href: "/dashboard/field-officers",
    icon: UserCog,
    adminOnly: true,
  },
];

function QuickActions({ isAdmin }: { isAdmin: boolean }) {
  const actions = ACTIONS.filter((action) => !action.adminOnly || isAdmin);
  return (
    <div>
      <h2 className="text-sm font-semibold text-navy">Quick actions</h2>
      <div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="group flex items-start gap-4 rounded-xl border border-black/[0.06] bg-white p-5 shadow-xs transition hover:border-brand/30 hover:shadow-sm"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-navy text-white">
              <action.icon className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-navy">{action.title}</span>
              <span className="mt-0.5 block text-sm text-black/60">{action.description}</span>
            </span>
            <ArrowRight className="mt-0.5 size-4 shrink-0 text-black/30 transition group-hover:translate-x-0.5 group-hover:text-brand" />
          </Link>
        ))}
      </div>
    </div>
  );
}
