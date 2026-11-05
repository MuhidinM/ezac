import { createProxy } from "@/lib/api/proxy";

/**
 * Means-testing back office on beneficiary-service.
 *
 * Who may call each prefix (mirrors the UI; the gateway still decides):
 *
 * | Prefix                  | Access | UI callers                                                                 |
 * | ----------------------- | ------ | -------------------------------------------------------------------------- |
 * | admin/field-officers    | admin  | Field officers pages (admin); officer filter on Assessments (isAdmin);     |
 * |                         |        | reassign officer on an assessment (isAdmin)                                |
 * | admin/staff-assignments | admin  | Field officers > detail (admin)                                            |
 * | admin/scoring-configs   | admin  | Scoring (admin)                                                            |
 * | admin/branches          | admin  | Branches list, edit, reset password, revoke codes (admin)                  |
 * | admin/pool              | admin  | Disbursement pool (admin); pool queue card on Overview (isAdmin)           |
 * | admin/whitelist         | admin  | Whitelist page (admin); add/decide in the whitelist panel (isAdmin)        |
 * | whitelist-entries       | portal | evidence links in the whitelist panel (HQ and branch, on assessments)      |
 * | assessments             | portal | Assessments list/detail (hq, branch), wizard (officer), queue cards        |
 * | beneficiaries           | portal | Beneficiaries (hq); whitelist status/request on an assessment (branch)     |
 * | staff                   | staff  | Register beneficiary: staff/me, staff/beneficiaries (hq)                   |
 * | analytics               | staff  | Overview (hq; branch users are sent to their branch page)                  |
 * | branch/analytics        | portal | My branch (branch)                                                         |
 */
export const { GET, POST, PATCH, PUT, DELETE } = createProxy({
  label: "backoffice",
  upstreamPrefix: "/api/beneficiaries/v1",
  allowedPrefixes: {
    "admin/field-officers": "admin",
    "admin/staff-assignments": "admin",
    "admin/scoring-configs": "admin",
    "admin/branches": "admin",
    "admin/pool": "admin",
    "admin/whitelist": "admin",
    "whitelist-entries": "portal",
    assessments: "portal",
    beneficiaries: "portal",
    staff: "staff",
    analytics: "staff",
    "branch/analytics": "portal",
  },
});
