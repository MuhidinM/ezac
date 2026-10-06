"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  ClipboardCheck,
  CornerUpLeft,
  Gavel,
  Building2,
  Clock,
  Network,
  UserCog,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";

import { QueueCard } from "@/components/assessment/queue-card";
import { isFieldOfficer } from "@/components/dashboard/nav-config";
import { apiClient } from "@/lib/api/client";
import type { PaginatedItems } from "@/lib/api/types";
import { useSession } from "@/lib/auth/use-session";

type Stat = {
  label: string;
  hint: string;
  path: string;
  href: string;
  icon: LucideIcon;
};

const STATS: Stat[] = [
  {
    label: "Registered beneficiaries",
    hint: "Individuals and institutions",
    path: "/api/beneficiaries?limit=1",
    href: "/dashboard/beneficiary",
    icon: Users,
  },
  {
    label: "Awaiting review",
    hint: "Beneficiaries pending verification",
    path: "/api/beneficiaries?limit=1&verificationStatus=pending",
    href: "/dashboard/beneficiary",
    icon: Clock,
  },
  {
    label: "Verified",
    hint: "Cleared for disbursement",
    path: "/api/beneficiaries?limit=1&verificationStatus=verified",
    href: "/dashboard/beneficiary",
    icon: BadgeCheck,
  },
  {
    label: "Institutions pending",
    hint: "KYC documents to review",
    path: "/api/beneficiaries/institutions?limit=1&verificationStatus=pending",
    href: "/dashboard/institutions",
    icon: Building2,
  },
];

const ACTIONS = [
  {
    title: "Register a beneficiary",
    description: "Start a household or institution registration.",
    href: "/dashboard/register",
    icon: UserPlus,
  },
  {
    title: "Review institutions",
    description: "Check KYC documents and verify institutions.",
    href: "/dashboard/institutions",
    icon: Building2,
  },
  {
    title: "Manage branches",
    description: "Create branches and issue registration codes.",
    href: "/dashboard/branches",
    icon: Network,
    adminOnly: true,
  },
  {
    title: "Manage field officers",
    description: "Create assessment officers and set their branch or region.",
    href: "/dashboard/field-officers",
    icon: UserCog,
    adminOnly: true,
  },
];

function useTotal(path: string) {
  const [total, setTotal] = useState<number | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    apiClient<PaginatedItems<unknown>>(path)
      .then((data) => {
        if (!cancelled) setTotal(data.pagination.totalItems);
      })
      .catch(() => {
        if (!cancelled) setTotal(null);
      });
    return () => {
      cancelled = true;
    };
  }, [path]);

  return total;
}

function StatCard({ stat }: { stat: Stat }) {
  const total = useTotal(stat.path);
  const Icon = stat.icon;

  return (
    <Link
      href={stat.href}
      className="group rounded-xl border border-black/[0.06] bg-white p-5 shadow-xs transition hover:border-black/10 hover:shadow-sm"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-black/60">{stat.label}</p>
        <span className="flex size-8 items-center justify-center rounded-lg bg-[#007050]/[0.08] text-[#007050]">
          <Icon className="size-4" />
        </span>
      </div>
      {total === undefined ? (
        <div className="mt-3 h-8 w-20 animate-pulse rounded-md bg-black/[0.06]" />
      ) : (
        <p className="mt-3 text-3xl font-semibold tracking-tight text-[#001539] tabular-nums">
          {total === null ? "—" : total.toLocaleString()}
        </p>
      )}
      <p className="mt-1 text-xs text-black/50">{stat.hint}</p>
    </Link>
  );
}

export default function DashboardHomePage() {
  const { session } = useSession();
  const name = session?.displayName?.trim() || session?.username;
  const actions = ACTIONS.filter((action) => !action.adminOnly || session?.isAdmin);

  return (
    <section className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[#001539]">
          {name ? `Welcome back, ${name}` : "Overview"}
        </h1>
        <p className="mt-1 text-sm text-black/60">
          A snapshot of beneficiary registration and verification activity.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STATS.map((stat) => (
          <StatCard key={stat.label} stat={stat} />
        ))}
      </div>

      {session?.isAdmin || isFieldOfficer(session) ? (
        <div>
          <h2 className="text-sm font-semibold text-[#001539]">Assessment queues</h2>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            {session?.isAdmin ? (
              <QueueCard
                countPath="/api/backoffice/admin/pool/awaiting?page=1&limit=1"
                title="Awaiting disbursement pool"
                description="Approved by branches, not yet pooled"
                icon={Gavel}
              />
            ) : null}
            {isFieldOfficer(session) ? (
              <>
                <QueueCard
                  status="RETURNED"
                  title="Returned for correction"
                  description="Sent back by a supervisor"
                  icon={CornerUpLeft}
                />
                <QueueCard
                  status="DRAFT"
                  title="Drafts in progress"
                  description="Started but not yet submitted"
                  icon={ClipboardCheck}
                />
              </>
            ) : null}
          </div>
        </div>
      ) : null}

      <div>
        <h2 className="text-sm font-semibold text-[#001539]">Quick actions</h2>
        <div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {actions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group flex items-start gap-4 rounded-xl border border-black/[0.06] bg-white p-5 shadow-xs transition hover:border-[#007050]/30 hover:shadow-sm"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#001539] text-white">
                <action.icon className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-[#001539]">
                  {action.title}
                </span>
                <span className="mt-0.5 block text-sm text-black/55">
                  {action.description}
                </span>
              </span>
              <ArrowRight className="mt-0.5 size-4 shrink-0 text-black/30 transition group-hover:translate-x-0.5 group-hover:text-[#007050]" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
