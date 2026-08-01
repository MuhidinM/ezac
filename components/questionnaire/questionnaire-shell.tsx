"use client";

import type { ReactNode } from "react";
import Link from "next/link";

import { ProgressBar } from "./progress-bar";

type QuestionnaireShellProps = {
  title?: string;
  formId?: string;
  totalSteps?: number;
  sectionName?: string;
  branchName?: string | null;
  currentStep?: number;
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
  return (
    <div className="questionnaire-theme min-h-full bg-[#f7f3ec]">
      <header className="sticky top-0 z-20 border-b border-[#1a3d2b]/10 bg-[#f7f3ec]/95 backdrop-blur-md">
        <div className="mx-auto max-w-3xl px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Link
                href="/dashboard/beneficiary"
                className="text-xs uppercase tracking-[0.12em] text-[#5a6e62] transition hover:text-[#1a3d2b]"
              >
                Back to beneficiaries
              </Link>
              <p className="mt-1 font-playfair text-lg font-semibold text-[#1a3d2b]">
                {title}
              </p>
              {formId ? (
                <p className="text-xs text-[#5a6e62]">{formId}</p>
              ) : null}
            </div>
            {onSaveDraft ? (
              <button
                type="button"
                onClick={onSaveDraft}
                className="shrink-0 rounded-lg border border-[#1a3d2b]/30 px-3 py-2 text-sm font-medium text-[#1a3d2b] transition hover:bg-[#1a3d2b]/5"
              >
                {draftSaved ? "Draft Saved" : "Save Draft"}
              </button>
            ) : null}
          </div>
          {branchName ? (
            <p className="mt-2 inline-flex items-center rounded-full border border-[#1a3d2b]/20 bg-[#1a3d2b]/8 px-3 py-1 text-xs font-medium text-[#1a3d2b]">
              Branch: {branchName}
            </p>
          ) : null}
          {showResumeBanner && onResumeDraft && onDiscardDraft ? (
            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-[#c4a040]/40 bg-[#c4a040]/10 px-4 py-3">
              <p className="text-sm text-[#1a3d2b]">
                You have a saved draft. Would you like to resume?
              </p>
              <button
                type="button"
                onClick={onResumeDraft}
                className="rounded-lg bg-[#1a3d2b] px-3 py-1.5 text-sm font-medium text-white"
              >
                Resume Draft
              </button>
              <button
                type="button"
                onClick={onDiscardDraft}
                className="rounded-lg border border-[#1a3d2b]/30 px-3 py-1.5 text-sm text-[#1a3d2b]"
              >
                Start Fresh
              </button>
            </div>
          ) : null}
          {showProgress ? (
            <div className="mt-4">
              <ProgressBar
                currentStep={currentStep}
                totalSteps={totalSteps}
                sectionName={sectionName}
                label={progressLabel}
              />
            </div>
          ) : null}
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="animate-step-enter">{children}</div>
      </main>

      {footer ? (
        <footer className="sticky bottom-0 z-20 border-t border-[#1a3d2b]/10 bg-[#f7f3ec]/95 backdrop-blur-md">
          <div className="mx-auto max-w-3xl px-4 py-4 sm:px-6">{footer}</div>
        </footer>
      ) : null}
    </div>
  );
}
