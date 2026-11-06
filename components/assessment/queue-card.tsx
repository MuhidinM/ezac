"use client";

import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";

import type { AssessmentStatus } from "@/lib/api/backoffice-types";
import type { PaginatedItems } from "@/lib/api/types";
import { useResource } from "@/lib/api/use-resource";

/**
 * A count linking to a queue: assessments in `status`, or the paginated list
 * at `countPath` (its `totalItems`). Without `href` it opens the Assessments
 * list on that status's tab.
 */
export function QueueCard({
  status,
  countPath,
  href = status ? `/dashboard/assessments?status=${encodeURIComponent(status)}` : "/dashboard/assessments",
  title,
  description,
  icon: Icon,
}: {
  status?: AssessmentStatus | string;
  countPath?: string;
  href?: string;
  title: string;
  description: string;
  icon: LucideIcon;
}) {
  const { data, error } = useResource<PaginatedItems<unknown>>(
    countPath ?? `/bff/backoffice/assessments?status=${status}&page=1&limit=1`,
  );
  const total = data?.pagination.totalItems;

  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-xl border border-black/[0.06] bg-white p-5 shadow-xs transition hover:border-brand/30 hover:shadow-sm"
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-navy text-white">
        <Icon className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-navy">{title}</span>
        <span className="block text-sm text-black/60">{description}</span>
      </span>
      <span className="text-right">
        {total === undefined && !error ? (
          <span className="block h-7 w-10 animate-pulse rounded bg-black/[0.06]" />
        ) : (
          <span className="block text-2xl font-semibold text-navy tabular-nums">
            {error ? "—" : (total ?? 0).toLocaleString()}
          </span>
        )}
        <span className="inline-flex items-center gap-1 text-xs text-black/60 group-hover:text-brand">
          Open <ArrowRight className="size-3" />
        </span>
      </span>
    </Link>
  );
}
