"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Pencil } from "lucide-react";

import { AssessmentSummary } from "@/components/assessment/assessment-summary";
import { DecisionHistory } from "@/components/assessment/decision-history";
import { DocumentsList } from "@/components/assessment/documents-panel";
import { AssessmentManagement, BranchReview } from "@/components/assessment/review-actions";
import { ScoreHistory, ScorePanel, SignOffTimeline } from "@/components/assessment/score-panel";
import { WhitelistPanel } from "@/components/whitelist/whitelist-panel";
import { AssessmentStatusBadge, PoolStatusBadge } from "@/components/backoffice/status-badges";
import { useBreadcrumbLabel } from "@/components/dashboard/dashboard-header";
import { ErrorAlert } from "@/components/dashboard/error-alert";
import { InlineAlert } from "@/components/dashboard/inline-alert";
import { isFieldOfficer } from "@/components/dashboard/nav-config";
import { PageHeader } from "@/components/dashboard/page-header";
import { Panel } from "@/components/dashboard/panel";
import { RequireRole } from "@/components/dashboard/require-role";
import { DetailSkeleton } from "@/components/dashboard/skeletons";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Assessment } from "@/lib/api/backoffice-types";
import { useResource } from "@/lib/api/use-resource";
import { useSession } from "@/lib/auth/use-session";
import {
  assessmentBeneficiaryId,
  assessmentCrumb,
  isEditable,
  reviewInfo,
  type AssessmentDetail,
} from "@/lib/backoffice/assessment-steps";
import { formatDate } from "@/lib/backoffice/format";
import { useNotice } from "@/lib/backoffice/notice";

type TabKey = "score" | "responses" | "documents" | "decisions" | "scores";

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
  // Also shows the notice the wizard leaves after a submission.
  const [notice, setNotice] = useNotice(`assessment:${id}`);
  const { data: assessment, error, isLoading, reload, mutate } = useResource<AssessmentDetail>(
    `/bff/backoffice/assessments/${encodeURIComponent(id)}`,
  );
  useBreadcrumbLabel(assessmentCrumb(assessment));

  if (isLoading && !assessment) {
    return <DetailSkeleton />;
  }

  if (!assessment) {
    return (
      <section className="space-y-6">
        <PageHeader title="Assessment" back={{ href: "/dashboard/assessments", label: "Assessments" }} />
        {error?.status === 404 ? (
          // Retrying can't make a missing record appear.
          <InlineAlert>This assessment doesn&apos;t exist. Check the link, or find it in the Assessments list.</InlineAlert>
        ) : (
          <ErrorAlert error={error} onRetry={reload} fallback="The assessment couldn't be loaded." />
        )}
      </section>
    );
  }

  const name = assessment.applicant?.fullName ?? "Beneficiary";
  const beneficiaryId = assessmentBeneficiaryId(assessment);
  const review = reviewInfo(assessment);
  const canEdit = isFieldOfficer(session) && isEditable(assessment.status);
  const canReview = (session?.isBranch ?? false) && assessment.status === "SUBMITTED";
  // A returned assessment can be cancelled too, instead of corrected.
  const canCancel = isEditable(assessment.status) && ((session?.isAdmin ?? false) || isFieldOfficer(session));
  const canReassign =
    (session?.isAdmin ?? false) && ["DRAFT", "SUBMITTED", "RETURNED"].includes(assessment.status);
  const documents = assessment.documents ?? [];
  const activeTab: TabKey = tab ?? (assessment.score ? "score" : "responses");

  const tabs: { key: TabKey; label: string }[] = [
    { key: "score", label: "Assessment & score" },
    { key: "responses", label: "Responses" },
    { key: "documents", label: `Documents (${documents.length})` },
    { key: "decisions", label: "Decision history" },
    { key: "scores", label: "Score history" },
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
        meta={
          <span className="flex items-center gap-1.5">
            <AssessmentStatusBadge status={assessment.status} />
            <PoolStatusBadge status={assessment.pool?.status} />
          </span>
        }
        description={
          <>
            {assessment.assessmentNumber ? `Assessment ${assessment.assessmentNumber} · ` : ""}
            Household assessment of {formatDate(assessment.assessmentInfo?.assessmentDate)}
            {assessment.applicant?.bin ? ` · BIN ${assessment.applicant.bin}` : ""}
            {session?.isBranch || !beneficiaryId ? null : (
              <>
                {" · "}
                <Link href={`/dashboard/beneficiary/${beneficiaryId}`} className="text-brand hover:underline">
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
      {assessment.status === "RETURNED" && review.comment ? (
        <InlineAlert tone="warning" title={review.byHeadOffice ? "Sent back by head office" : "Returned for correction"}>
          {review.comment}
        </InlineAlert>
      ) : null}
      {assessment.status === "DEFERRED" && assessment.deferredUntil ? (
        <InlineAlert tone="info" title={`Deferred until ${formatDate(assessment.deferredUntil)}`}>
          The branch wants to look at this household again from that date. A new assessment can be started then.
        </InlineAlert>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Panel flush className="min-w-0">
          <Tabs value={activeTab} onValueChange={(value) => setTab(value as TabKey)}>
            <TabsList aria-label="Assessment details">
              {tabs.map((item) => (
                <TabsTrigger key={item.key} value={item.key}>
                  {item.label}
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value="score">
              <ScorePanel assessment={assessment} />
            </TabsContent>
            <TabsContent value="responses">
              <AssessmentSummary assessment={assessment} />
            </TabsContent>
            <TabsContent value="documents" className="p-5">
              <DocumentsList assessmentId={assessment.id} documents={documents} />
            </TabsContent>
            <TabsContent value="decisions">
              {/* Keyed by status so a decision made here shows up straight away. */}
              <DecisionHistory key={assessment.status} assessmentId={assessment.id} />
            </TabsContent>
            <TabsContent value="scores">
              <ScoreHistory assessmentId={assessment.id} />
            </TabsContent>
          </Tabs>
        </Panel>

        <div className="space-y-6">
          {canReview ? (
            <BranchReview assessment={assessment} onDone={(updated, message) => onActionDone(message)(updated)} />
          ) : null}
          <AssessmentManagement
            assessment={assessment}
            canCancel={canCancel}
            canReassign={canReassign}
            onDone={(updated, message) => onActionDone(message)(updated)}
          />
          <SignOffTimeline assessment={assessment} />
          {beneficiaryId ? (
            <WhitelistPanel
              beneficiaryId={beneficiaryId}
              beneficiaryName={assessment.applicant?.fullName}
              livePoolStatus={assessment.pool?.status}
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}
