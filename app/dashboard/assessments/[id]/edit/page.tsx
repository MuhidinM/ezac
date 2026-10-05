"use client";

import { useParams } from "next/navigation";

import { AssessmentLocked, AssessmentWizard } from "@/components/assessment/assessment-wizard";
import { InlineAlert } from "@/components/dashboard/inline-alert";
import { PageHeader } from "@/components/dashboard/page-header";
import { RequireRole } from "@/components/dashboard/require-role";
import { Button } from "@/components/ui/button";
import type { Assessment } from "@/lib/api/backoffice-types";
import { useResource } from "@/lib/api/use-resource";
import { isEditable } from "@/lib/backoffice/assessment-steps";

export default function EditAssessmentPage() {
  return (
    <RequireRole audience={["officer"]}>
      <EditAssessment />
    </RequireRole>
  );
}

function EditAssessment() {
  const { id } = useParams<{ id: string }>();
  const { data: assessment, error, isLoading, reload } = useResource<Assessment>(
    `/api/backoffice/assessments/${encodeURIComponent(id)}`,
  );

  if (isLoading && !assessment) {
    return (
      <div className="space-y-4">
        <div className="h-24 animate-pulse rounded-xl bg-black/[0.04]" />
        <div className="h-96 animate-pulse rounded-xl bg-black/[0.04]" />
      </div>
    );
  }

  if (!assessment) {
    return (
      <section className="space-y-6">
        <PageHeader title="Household assessment" back={{ href: "/dashboard/assessments", label: "Assessments" }} />
        <InlineAlert action={<Button variant="outline" size="sm" onClick={reload}>Retry</Button>}>
          {error?.message ?? "Assessment not found"}
        </InlineAlert>
      </section>
    );
  }

  if (!isEditable(assessment.status)) {
    return (
      <section className="space-y-6">
        <PageHeader title="Household assessment" back={{ href: "/dashboard/assessments", label: "Assessments" }} />
        <AssessmentLocked assessment={assessment} />
      </section>
    );
  }

  // Keyed so a different assessment id starts with fresh form state.
  return <AssessmentWizard key={assessment.id} initial={assessment} />;
}
