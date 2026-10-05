"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Pencil } from "lucide-react";

import { AssessmentSummary } from "@/components/assessment/assessment-summary";
import { DocumentsList } from "@/components/assessment/documents-panel";
import { AssessmentStatusBadge, RiskBadge, ScoreMeter } from "@/components/backoffice/status-badges";
import { InlineAlert } from "@/components/dashboard/inline-alert";
import { isFieldOfficer } from "@/components/dashboard/nav-config";
import { PageHeader } from "@/components/dashboard/page-header";
import { DetailList, Panel } from "@/components/dashboard/panel";
import { RequireRole } from "@/components/dashboard/require-role";
import { Button } from "@/components/ui/button";
import type { Assessment } from "@/lib/api/backoffice-types";
import { useResource } from "@/lib/api/use-resource";
import { useSession } from "@/lib/auth/use-session";
import { isEditable } from "@/lib/backoffice/assessment-steps";
import { formatDate } from "@/lib/backoffice/format";
import { OFFICER_RECOMMENDATION, labelFor } from "@/lib/backoffice/options";
import { formatDateTime } from "@/lib/beneficiary/format";
import { cn } from "@/lib/utils";

type TabKey = "responses" | "documents";

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
  const [tab, setTab] = useState<TabKey>("responses");
  const { data: assessment, error, isLoading, reload } = useResource<Assessment>(
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
  const signOffs = assessment.signOffs ?? {};
  const documents = assessment.documents ?? [];

  const tabs: { key: TabKey; label: string }[] = [
    { key: "responses", label: "Responses" },
    { key: "documents", label: `Documents (${documents.length})` },
  ];

  return (
    <section className="space-y-6">
      <PageHeader
        back={{ href: "/dashboard/assessments", label: "Assessments" }}
        title={name}
        meta={<AssessmentStatusBadge status={assessment.status} />}
        description={
          <>
            Household assessment of {formatDate(assessment.assessmentInfo?.assessmentDate)}
            {assessment.applicant?.bin ? ` · BIN ${assessment.applicant.bin}` : ""} ·{" "}
            <Link href={`/dashboard/beneficiary/${assessment.beneficiaryId}`} className="text-[#007050] hover:underline">
              View beneficiary
            </Link>
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

      {assessment.status === "RETURNED" && signOffs.reviewComment ? (
        <InlineAlert tone="warning" title="Returned for correction">
          {signOffs.reviewComment}
        </InlineAlert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Score" className="lg:col-span-1">
          {assessment.score ? (
            <div className="space-y-3">
              <ScoreMeter
                score={assessment.score.totalScore}
                max={assessment.score.maxScore}
                risk={assessment.score.riskCategory}
                size="lg"
              />
              <RiskBadge risk={assessment.score.riskCategory} />
            </div>
          ) : (
            <p className="text-sm text-black/50">Scored when the officer submits.</p>
          )}
        </Panel>
        <Panel title="Recommendation & sign-off" className="lg:col-span-2">
          <DetailList
            columns={3}
            items={[
              {
                label: "Officer recommendation",
                value: assessment.recommendation?.officerRecommendation
                  ? labelFor(OFFICER_RECOMMENDATION, assessment.recommendation.officerRecommendation)
                  : null,
              },
              { label: "Submitted", value: signOffs.submittedAt ? formatDateTime(signOffs.submittedAt) : null },
              { label: "Submitted by", value: signOffs.submittedByName ?? assessment.assessmentInfo?.officerName },
              { label: "Reason", value: assessment.recommendation?.recommendationReason },
            ]}
          />
        </Panel>
      </div>

      <Panel flush>
        <div className="flex gap-1 border-b border-black/[0.06] px-3 pt-2" role="tablist">
          {tabs.map((item) => (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={tab === item.key}
              onClick={() => setTab(item.key)}
              className={cn(
                "-mb-px border-b-2 px-3 py-2.5 text-sm transition",
                tab === item.key
                  ? "border-[#007050] font-medium text-[#001539]"
                  : "border-transparent text-black/55 hover:text-[#001539]",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
        {tab === "responses" ? <AssessmentSummary assessment={assessment} /> : null}
        {tab === "documents" ? (
          <div className="p-5">
            <DocumentsList assessmentId={assessment.id} documents={documents} />
          </div>
        ) : null}
      </Panel>
    </section>
  );
}
