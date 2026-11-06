"use client";

import type { AssessmentListItem } from "@/lib/api/backoffice-types";
import type { BeneficiaryDetail, PaginatedItems } from "@/lib/api/types";
import { useResource } from "@/lib/api/use-resource";
import { useSession } from "@/lib/auth/use-session";

/**
 * "in": the user may change the household. "out": it belongs to another
 * branch. "unknown": the check failed. "checking": no answer yet.
 */
export type BranchScope = "checking" | "in" | "out" | "unknown";

/**
 * Whether a household is in the signed-in user's branches. The beneficiary
 * endpoints are not branch-scoped yet, but its assessment list is, and answers
 * 403 for another branch's household. Only a successful answer proves scope;
 * any other error leaves it unknown, and callers keep changes off until a
 * retry succeeds (fail closed). ADMIN covers every branch, and institutions
 * have no assessments, so neither is checked.
 *
 * `assessments` is the household's assessment history, undefined while it
 * loads or when it can't be read.
 */
export function useBranchScope(beneficiary: Pick<BeneficiaryDetail, "id" | "beneficiaryType"> | null | undefined) {
  const { session } = useSession();
  const isInstitution = beneficiary?.beneficiaryType === "institution";
  const { data, error, isLoading, reload } = useResource<AssessmentListItem[] | PaginatedItems<AssessmentListItem>>(
    beneficiary && !isInstitution
      ? `/bff/backoffice/beneficiaries/${encodeURIComponent(beneficiary.id)}/assessments`
      : null,
  );

  let scope: BranchScope;
  if (!beneficiary) scope = "checking";
  else if (isInstitution || session?.isAdmin) scope = "in";
  else if (error?.status === 403) scope = "out";
  else if (error) scope = "unknown";
  else if (isLoading || data === undefined) scope = "checking";
  else scope = "in";

  const assessments = error || isLoading ? undefined : Array.isArray(data) ? data : data?.items;
  return { scope, assessments, error, reload };
}
