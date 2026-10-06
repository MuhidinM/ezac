"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Pencil } from "lucide-react";

import { AssessmentSummary } from "@/components/assessment/assessment-summary";
import { DocumentsList } from "@/components/assessment/documents-panel";
import { AssessmentManagement, BranchReview } from "@/components/assessment/review-actions";
import { ScoreHistory, ScorePanel, SignOffTimeline } from "@/components/assessment/score-panel";
import { AssessmentStatusBadge } from "@/components/backoffice/status-badges";
import { InlineAlert } from "@/components/dashboard/inline-alert";
import { isFieldOfficer } from "@/components/dashboard/nav-config";
import { PageHeader } from "@/components/dashboard/page-header";
import { Panel } from "@/components/dashboard/panel";
import { RequireRole } from "@/components/dashboard/require-role";
import { Button } from "@/components/ui/button";
import type { Assessment } from "@/lib/api/backoffice-types";
import { useResource } from "@/lib/api/use-resource";
import { useSession } from "@/lib/auth/use-session";
import { isEditable } from "@/lib/backoffice/assessment-steps";
import { formatDate } from "@/lib/backoffice/format";
import { cn } from "@/lib/utils";

type TabKey = "score" | "responses" | "documents" | "history";

export default function AssessmentDetailPage() {
  return (
    <RequireRole audience={["hq", "branch"]}>
      <AssessmentDetail />
    </RequireRole>
  );
}

function AssessmentDetail() {
  const { id } = useParams<{ id: string }>();
  const { session } = useSession();
  const [tab, setTab] = useState<TabKey | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const { data: assessment, error, isLoading, reload, mutate } = useResource<Assessment>(
    `/api/backoffice/assessments/${encodeURIComponent(id)}`,
  );

  if (isLoading && !assessment) {
    return <div className="h-96 animate-pulse rounded-xl bg-black/[0.04]" />;
  }

  if (!assessment) {
    return (
      <section className="space-y-6">
        <PageHeader title="Assessment" back={{ href: "/dashboard/assessments", label: "Assessments" }} />
        <InlineAlert action={<Button variant="outline" size="sm" onClick={reload}>Retry</Button>}>
          {error?.message ?? "Assessment not found"}
        </InlineAlert>
      </section>
    );
  }

  const name = assessment.applicant?.fullName ?? "Beneficiary";
  const canEdit = isFieldOfficer(session) && isEditable(assessment.status);
  const canReview = (session?.isBranch ?? false) && assessment.status === "SUBMITTED";
  const canCancel = assessment.status === "DRAFT" && ((session?.isAdmin ?? false) || isFieldOfficer(session));
  const canReassign =
    (session?.isAdmin ?? false) && ["DRAFT", "SUBMITTED", "RETURNED"].includes(assessment.status);
  const documents = assessment.documents ?? [];
  const activeTab: TabKey = tab ?? (assessment.score ? "score" : "responses");

  const tabs: { key: TabKey; label: string }[] = [
    { key: "score", label: "Assessment & score" },
    { key: "responses", label: "Responses" },
    { key: "documents", label: `Documents (${documents.length})` },
    { key: "history", label: "Score history" },
  ];

  function onActionDone(message: string) {
    return (updated: Assessment) => {
      // Action responses may omit nested data; fall back to a fresh fetch.
      mutate({ ...assessment!, ...updated });
      setNotice(message);
      reload();
    };
  }

  return (
    <section className="space-y-6">
      <PageHeader
        back={{ href: "/dashboard/assessments", label: "Assessments" }}
        title={name}
        meta={<AssessmentStatusBadge status={assessment.status} />}
        description={
          <>
            Household assessment of {formatDate(assessment.assessmentInfo?.assessmentDate)}
            {assessment.applicant?.bin ? ` · BIN ${assessment.applicant.bin}` : ""}
            {session?.isBranch ? null : (
              <>
                {" · "}
                <Link href={`/dashboard/beneficiary/${assessment.beneficiaryId}`} className="text-[#007050] hover:underline">
                  View beneficiary
                </Link>
              </>
            )}
          </>
        }
        actions={
          canEdit ? (
            <Button asChild>
              <Link href={`/dashboard/assessments/${assessment.id}/edit`}>
                <Pencil />
                {assessment.status === "RETURNED" ? "Make corrections" : "Continue assessment"}
              </Link>
            </Button>
          ) : null
        }
      />

      {notice ? <InlineAlert tone="success">{notice}</InlineAlert> : null}
      {assessment.status === "RETURNED" && assessment.signOffs?.reviewComment ? (
        <InlineAlert tone="warning" title="Returned for correction">
          {assessment.signOffs.reviewComment}
        </InlineAlert>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Panel flush className="min-w-0">
          <div className="flex gap-1 overflow-x-auto border-b border-black/[0.06] px-3 pt-2" role="tablist">
            {tabs.map((item) => (
              <button
                key={item.key}
                type="button"
                role="tab"
                aria-selected={activeTab === item.key}
                onClick={() => setTab(item.key)}
                className={cn(
                  "-mb-px shrink-0 border-b-2 px-3 py-2.5 text-sm whitespace-nowrap transition",
                  activeTab === item.key
                    ? "border-[#007050] font-medium text-[#001539]"
                    : "border-transparent text-black/55 hover:text-[#001539]",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
          {activeTab === "score" ? <ScorePanel assessment={assessment} /> : null}
          {activeTab === "responses" ? <AssessmentSummary assessment={assessment} /> : null}
          {activeTab === "documents" ? (
            <div className="p-5">
              <DocumentsList assessmentId={assessment.id} documents={documents} />
            </div>
          ) : null}
          {activeTab === "history" ? <ScoreHistory assessmentId={assessment.id} /> : null}
        </Panel>

        <div className="space-y-6">
          {canReview ? (
            <BranchReview assessment={assessment} onDone={onActionDone("Decision recorded.")} />
          ) : null}
          <AssessmentManagement
            assessment={assessment}
            canCancel={canCancel}
            canReassign={canReassign}
            onDone={(updated, message) => onActionDone(message)(updated)}
          />
          <SignOffTimeline assessment={assessment} />
        </div>
      </div>
    </section>
  );
}
