import { describe, expect, it } from "vitest";

import { eventNotes, eventTitle, eventTone } from "@/components/assessment/assessment-events";
import { downloadName, truncationNote } from "@/components/assessment/csv-export";
import {
  DOCUMENT_MAX_BYTES,
  documentFileProblem,
  documentLimitProblem,
} from "@/components/assessment/document-rules";

describe("decision history", () => {
  it("names every event type the backend sends", () => {
    const types = [
      "CREATED",
      "SUBMITTED",
      "RESUBMITTED",
      "RETURNED",
      "APPROVED",
      "REJECTED",
      "DEFERRED",
      "CANCELLED",
      "REASSIGNED",
      "SENT_BACK_BY_ADMIN",
      "POOLED",
      "POOL_DECLINED",
      "POOL_REMOVED",
      "DISBURSED",
    ];
    for (const type of types) expect(eventTitle(type)).not.toMatch(/_/);
    expect(eventTitle("SENT_BACK_BY_ADMIN")).toBe("Sent back by head office");
    expect(eventTone("REJECTED")).toBe("danger");
    // A type added later still reads as words.
    expect(eventTitle("SOMETHING_NEW")).toBe("Something new");
  });

  it("states both recommendations on a submission", () => {
    expect(
      eventNotes({
        type: "SUBMITTED",
        occurredAt: "2026-11-05T10:58:05Z",
        details: { officerRecommendation: "defer", systemRecommendation: "conditional_approval" },
      }),
    ).toEqual(["Officer recommends defer; system recommends conditional approval."]);
  });

  it("shows the comment once, from the event or its details", () => {
    const comment = "QA branch: deferred until next intake.";
    expect(eventNotes({ type: "DEFERRED", occurredAt: null, comment, details: { reason: comment } })).toEqual([comment]);
    expect(eventNotes({ type: "POOL_DECLINED", occurredAt: null, details: { reason: "Funds closed" } })).toEqual(["Funds closed"]);
    expect(eventNotes({ type: "CREATED", occurredAt: null, details: { beneficiaryId: 41 } })).toEqual([]);
  });
});

describe("assessment document rules", () => {
  it("accepts PDF, JPEG, PNG and WebP up to 5 MB", () => {
    expect(documentFileProblem({ type: "image/webp", size: DOCUMENT_MAX_BYTES })).toBeNull();
    expect(documentFileProblem({ type: "image/gif", size: 10 })).toMatch(/PDF, JPEG, PNG or WebP/);
    expect(documentFileProblem({ type: "application/pdf", size: DOCUMENT_MAX_BYTES + 1 })).toMatch(/5 MB/);
  });

  it("stops at 10 of one type and 40 in all", () => {
    const photos = Array.from({ length: 10 }, () => ({ documentType: "photo" }));
    expect(documentLimitProblem(photos, "photo", "Photo")).toMatch(/at most 10 of each type \(photo\)/);
    expect(documentLimitProblem(photos, "kebele_id", "Kebele ID")).toBeNull();
    const many = Array.from({ length: 40 }, (_, index) => ({ documentType: `type_${index % 5}` }));
    expect(documentLimitProblem(many, "photo", "Photo")).toMatch(/at most 40 documents/);
  });
});

describe("CSV export", () => {
  it("takes the file name from Content-Disposition", () => {
    expect(downloadName('attachment; filename="assessments-2026-11-11.csv"', "x.csv")).toBe("assessments-2026-11-11.csv");
    expect(downloadName(null, "assessments.csv")).toBe("assessments.csv");
  });

  it("says when the file holds only the first 10,000 rows", () => {
    const truncated = new Headers({ "X-Export-Truncated": "true", "X-Total-Count": "12500" });
    expect(truncationNote(truncated, "assessments")).toBe(
      "The file has the first 10,000 assessments only of 12,500. Narrow the filters to export the rest.",
    );
    expect(truncationNote(new Headers({ "X-Export-Truncated": "false", "X-Total-Count": "2" }), "assessments")).toBeNull();
  });
});
