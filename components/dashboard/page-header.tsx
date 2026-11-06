"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { usePageTitle } from "@/lib/hooks/use-page-title";

type PageHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  back?: { href: string; label: string };
  /** Badges or meta shown next to the title. */
  meta?: ReactNode;
  /**
   * Browser-tab title ("<this> — EZAC staff"). Defaults to `title` when that
   * is plain text; set it when the title is JSX.
   */
  documentTitle?: string;
};

export function PageHeader({ title, description, actions, back, meta, documentTitle }: PageHeaderProps) {
  usePageTitle(documentTitle ?? (typeof title === "string" ? title : null));

  return (
    <div className="space-y-3">
      {back ? (
        <Link
          href={back.href}
          className="inline-flex items-center gap-1.5 text-sm text-black/60 transition hover:text-navy"
        >
          <ArrowLeft aria-hidden="true" className="size-3.5" />
          {back.label}
        </Link>
      ) : null}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-navy">{title}</h1>
            {meta}
          </div>
          {description ? (
            <p className="mt-1 max-w-3xl text-sm text-black/60">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}
