"use client";

import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";

import type { AssessmentStatus } from "@/lib/api/backoffice-types";
import type { PaginatedItems } from "@/lib/api/types";
import { useResource } from "@/lib/api/use-resource";

/** Count of assessments in one status, linking to that queue. */
export function QueueCard({
  status,
  title,
  description,
  icon: Icon,
}: {
  status: AssessmentStatus;
  title: string;
  description: string;
  icon: LucideIcon;
}) {
  const { data, error } = useResource<PaginatedItems<unknown>>(
    `/api/backoffice/assessments?status=${status}&page=1&limit=1`,
  );
  const total = data?.pagination.totalItems;

  return (
    <Link
      href="/dashboard/assessments"
      className="group flex items-center gap-4 rounded-xl border border-black/[0.06] bg-white p-5 shadow-xs transition hover:border-[#007050]/30 hover:shadow-sm"
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-[#001539] text-white">
        <Icon className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-[#001539]">{title}</span>
        <span className="block text-sm text-black/55">{description}</span>
      </span>
      <span className="text-right">
        {total === undefined && !error ? (
          <span className="block h-7 w-10 animate-pulse rounded bg-black/[0.06]" />
        ) : (
          <span className="block text-2xl font-semibold text-[#001539] tabular-nums">
            {error ? "—" : (total ?? 0).toLocaleString()}
          </span>
        )}
        <span className="inline-flex items-center gap-1 text-xs text-black/45 group-hover:text-[#007050]">
          Open <ArrowRight className="size-3" />
        </span>
      </span>
    </Link>
  );
}
