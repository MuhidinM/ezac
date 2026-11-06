"use client";

import { useParams } from "next/navigation";

import { AssessmentLocked, AssessmentWizard } from "@/components/assessment/assessment-wizard";
import { useBreadcrumbLabel } from "@/components/dashboard/dashboard-header";
import { ErrorAlert } from "@/components/dashboard/error-alert";
import { InlineAlert } from "@/components/dashboard/inline-alert";
import { PageHeader } from "@/components/dashboard/page-header";
import { RequireRole } from "@/components/dashboard/require-role";
import { DetailSkeleton } from "@/components/dashboard/skeletons";
import type { Assessment } from "@/lib/api/backoffice-types";
import { useResource } from "@/lib/api/use-resource";
import { assessmentCrumb, isEditable } from "@/lib/backoffice/assessment-steps";

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
    `/bff/backoffice/assessments/${encodeURIComponent(id)}`,
  );
  // The record crumb (one up from "Edit") shows the household and assessment number.
  useBreadcrumbLabel(assessmentCrumb(assessment), `/dashboard/assessments/${id}`);

  if (isLoading && !assessment) {
    return <DetailSkeleton side={false} />;
  }

  if (!assessment) {
    return (
      <section className="space-y-6">
        <PageHeader title="Household assessment" back={{ href: "/dashboard/assessments", label: "Assessments" }} />
        {error?.status === 404 ? (
          // Retrying can't make a missing record appear.
          <InlineAlert>This assessment doesn&apos;t exist. Check the link, or find it in the Assessments list.</InlineAlert>
        ) : (
          <ErrorAlert error={error} onRetry={reload} fallback="The assessment couldn't be loaded." />
        )}
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
