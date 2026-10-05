"use client";

import { useEffect, type ReactNode } from "react";
import { Save, Store } from "lucide-react";

import { InlineAlert } from "@/components/dashboard/inline-alert";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

/** Page frame for multi-step registration wizards. */
export function QuestionnaireShell({
  title = "Registration",
  formId,
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
    <div className="questionnaire-theme mx-auto w-full max-w-5xl space-y-6">
      <PageHeader
        back={{ href: "/dashboard/beneficiary", label: "Beneficiaries" }}
        title={title}
        description={formId ? `Form ${formId}` : undefined}
        meta={
          branchName ? (
            <Badge tone="brand">
              <Store />
              {branchName}
            </Badge>
          ) : null
        }
        actions={
          onSaveDraft ? (
            <Button variant="outline" onClick={onSaveDraft}>
              <Save />
              {draftSaved ? "Draft saved" : "Save draft"}
            </Button>
          ) : null
        }
      />

      {showResumeBanner && onResumeDraft && onDiscardDraft ? (
        <InlineAlert
          tone="info"
          title="You have a saved draft"
          action={
            <div className="flex gap-2">
              <Button size="sm" onClick={onResumeDraft}>
                Resume
              </Button>
              <Button size="sm" variant="outline" onClick={onDiscardDraft}>
                Start fresh
              </Button>
            </div>
          }
        >
          Pick up where you left off, or start over.
        </InlineAlert>
      ) : null}

      {showProgress ? (
        <ProgressBar
          currentStep={typeof currentStep === "number" ? currentStep : totalSteps}
          totalSteps={totalSteps}
          sectionName={sectionName}
          label={progressLabel}
        />
      ) : null}

      <div className="rounded-xl border border-black/[0.06] bg-white p-5 shadow-xs sm:p-6">
        {children}
        {footer ? <div className="mt-8 border-t border-black/[0.06] pt-5">{footer}</div> : null}
      </div>
    </div>
  );
}
