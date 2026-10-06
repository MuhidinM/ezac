import { createProxy } from "@/lib/api/proxy";

/** Means-testing back office on beneficiary-service. */
export const { GET, POST, PATCH, PUT, DELETE } = createProxy({
  label: "backoffice",
  upstreamPrefix: "/api/beneficiaries/v1",
  allowedPrefixes: [
    "admin/field-officers",
    "admin/staff-assignments",
    "admin/scoring-configs",
    "admin/branches",
    "admin/pool",
    "assessments",
    "beneficiaries",
    "staff",
    "analytics",
    "branch/analytics",
  ],
});
