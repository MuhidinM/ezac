import { describe, expect, it } from "vitest";

import {
  draftFromAssessment,
  reviewInfo,
  reviewerName,
  stepBody,
  type AssessmentDetail,
} from "@/lib/backoffice/assessment-steps";

function assessment(extra: Partial<AssessmentDetail> = {}): AssessmentDetail {
  return { id: "17", status: "RETURNED", ...extra };
}

describe("reviewInfo", () => {
  it("reads a branch return from the branch's own comment", () => {
    const returned = assessment({
      signOffs: { reviewComment: " Please re-check the remittance amount. ", returnedBy: "BRANCH" },
    });
    expect(reviewInfo(returned)).toEqual({ byHeadOffice: false, comment: "Please re-check the remittance amount." });
  });

  it("reads a head-office send-back from sentBackReason, leaving the branch's review alone", () => {
    const sentBack = assessment({
      signOffs: {
        reviewComment: "Verified on site",
        reviewedByName: "Branch Officer",
        returnedBy: "ADMIN",
        sentBackReason: "Verify the remittance with the household.",
        sentBackByName: "Platform Admin",
      },
    });
    expect(reviewInfo(sentBack)).toEqual({ byHeadOffice: true, comment: "Verify the remittance with the household." });
    expect(reviewerName(sentBack)).toBe("Branch Officer");
  });

  it("no longer reads a 'Sent back by admin:' prefix as a head-office send-back", () => {
    const old = assessment({ signOffs: { reviewComment: "Sent back by admin: check", returnedBy: "BRANCH" } });
    expect(reviewInfo(old).byHeadOffice).toBe(false);
  });

  it("names the supervisor only when the reviewer is (or may be) them", () => {
    const info = { assessmentDate: null, supervisorSub: "sup-1", supervisorName: "Supervisor" };
    expect(reviewerName(assessment({ assessmentInfo: info, signOffs: { reviewedBy: "sup-1" } }))).toBe("Supervisor");
    expect(reviewerName(assessment({ assessmentInfo: info, signOffs: { reviewedBy: "other" } }))).toBeNull();
  });
});

describe("stepBody", () => {
  it("sends the loaded version with every step", () => {
    const draft = draftFromAssessment(assessment());
    expect(stepBody(4, draft, 3)).toMatchObject({ version: 3, housing: expect.any(Object) });
    expect(stepBody(4, draft, null)).not.toHaveProperty("version");
  });

  it("leaves consent out until the officer answers it, then sends it inside verification", () => {
    const draft = draftFromAssessment(assessment());
    const before = stepBody(7, draft, 1) as { verification: Record<string, unknown> };
    expect(before.verification).not.toHaveProperty("consent");

    draft.verification.consent = { dataProcessingConsent: true, noticeVersion: "2026-11" };
    const after = stepBody(7, draft, 1) as { verification: Record<string, unknown> };
    expect(after.verification.consent).toEqual({ dataProcessingConsent: true, noticeVersion: "2026-11" });
  });
});

describe("draftFromAssessment", () => {
  it("keeps only the consent fields the PATCH takes, not who recorded it", () => {
    const loaded = assessment({
      verification: {
        homeVisitDone: true,
        consent: {
          dataProcessingConsent: true,
          noticeVersion: "2026-11",
          consentedAt: "2026-11-11T08:00:00Z",
          recordedByName: "Officer",
        },
      } as AssessmentDetail["verification"],
    });
    const draft = draftFromAssessment(loaded);
    expect(draft.verification.consent).toEqual({ dataProcessingConsent: true, noticeVersion: "2026-11" });
    expect(draft.verification.homeVisitDone).toBe(true);
  });

  it("has no consent when none was recorded", () => {
    expect(draftFromAssessment(assessment({ verification: { consent: null } as AssessmentDetail["verification"] })).verification.consent).toBeNull();
    expect(draftFromAssessment(assessment()).verification.consent).toBeNull();
  });

  it("resends a stored consent without a notice version under the current notice, never an empty one", () => {
    const stored = assessment({
      verification: { consent: { dataProcessingConsent: false } } as AssessmentDetail["verification"],
    });
    expect(draftFromAssessment(stored).verification.consent).toEqual({ dataProcessingConsent: false, noticeVersion: "2026-11" });
  });
});
