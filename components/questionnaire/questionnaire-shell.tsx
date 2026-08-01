"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";

import { scrollDashboardToTop } from "@/lib/scroll-to-top";

import { ProgressBar } from "./progress-bar";

type QuestionnaireShellProps = {
  title?: string;
  formId?: string;
  totalSteps?: number;
  sectionName?: string;
  branchName?: string | null;
  currentStep?: number | string;
  showProgress?: boolean;
  progressLabel?: string;
  onSaveDraft?: () => void;
  draftSaved?: boolean;
  showResumeBanner?: boolean;
  onResumeDraft?: () => void;
  onDiscardDraft?: () => void;
  children: ReactNode;
  footer?: ReactNode;
};

export function QuestionnaireShell({
  title = "EZAC Household Assessment",
  formId = "EZAC-MTT-QST-001",
  totalSteps = 7,
  sectionName,
  branchName,
  currentStep = 1,
  showProgress = true,
  progressLabel,
  onSaveDraft,
  draftSaved,
  showResumeBanner,
  onResumeDraft,
  onDiscardDraft,
  children,
  footer,
}: QuestionnaireShellProps) {
  useEffect(() => {
    scrollDashboardToTop();
  }, [currentStep]);

  return (
    <div className="questionnaire-theme mx-auto w-full max-w-3xl space-y-6">
      <div>
        <Link
          href="/dashboard/beneficiary"
          className="text-xs uppercase tracking-[0.12em] text-black/45 transition hover:text-[#001539]"
        >
          Back to beneficiaries
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-serif-display text-3xl tracking-tight text-[#001539]">
              {title}
            </h1>
            {formId ? (
              <p className="mt-1 text-sm text-black/60">{formId}</p>
            ) : null}
            {branchName ? (
              <p className="mt-3 inline-flex items-center rounded-full border border-[rgba(0,112,80,0.2)] bg-[rgba(0,112,80,0.08)] px-3 py-1 text-xs font-medium text-[#007050]">
                Branch: {branchName}
              </p>
            ) : null}
          </div>
          {onSaveDraft ? (
            <button
              type="button"
              onClick={onSaveDraft}
              className="shrink-0 rounded-lg border border-black/15 px-3 py-2 text-sm font-medium text-[#001539] transition hover:bg-black/[0.03]"
            >
              {draftSaved ? "Draft Saved" : "Save Draft"}
            </button>
          ) : null}
        </div>

        {showResumeBanner && onResumeDraft && onDiscardDraft ? (
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-[rgba(225,143,53,0.35)] bg-[rgba(225,143,53,0.1)] px-4 py-3">
            <p className="text-sm text-[#001539]">
              You have a saved draft. Would you like to resume?
            </p>
            <button
              type="button"
              onClick={onResumeDraft}
              className="rounded-lg bg-[#007050] px-3 py-1.5 text-sm font-medium text-white"
            >
              Resume Draft
            </button>
            <button
              type="button"
              onClick={onDiscardDraft}
              className="rounded-lg border border-black/15 px-3 py-1.5 text-sm text-[#001539]"
            >
              Start Fresh
            </button>
          </div>
        ) : null}

        {showProgress ? (
          <div className="mt-4">
            <ProgressBar
              currentStep={typeof currentStep === "number" ? currentStep : totalSteps}
              totalSteps={totalSteps}
              sectionName={sectionName}
              label={progressLabel}
            />
          </div>
        ) : null}
      </div>

      <div className="form-card animate-step-enter sm:p-6">{children}</div>

      {footer ? (
        <div className="sticky bottom-0 z-10 -mx-1 rounded-2xl border border-black/5 bg-white/95 px-1 py-3 backdrop-blur-sm">
          {footer}
        </div>
      ) : null}
    </div>
  );
}
