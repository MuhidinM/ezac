import { describe, expect, it } from "vitest";

import { actionLabel, auditQuery, auditRangeError, AUDIT_FILTER_DEFAULTS, entityHref, humanize, metadataSummary, roleLabel } from "@/components/zakat/content/audit";
import { coverAltTextChange, endDatePassed, endsOnError, END_DATE_PASSED, todayInAddis } from "@/components/zakat/content/cause-rules";
import { adminMediaById, adminMediaSrc } from "@/components/zakat/content/media";

describe("adminMediaSrc", () => {
  it("routes public and admin media URLs through the admin proxy", () => {
    expect(adminMediaSrc("http://196.188.249.232/api/zakat/v1/media/5")).toBe("/bff/zakat-admin/media/5");
    expect(adminMediaSrc("http://196.188.249.232/api/zakat/v1/admin/media/6")).toBe("/bff/zakat-admin/media/6");
  });
  it("keeps a known size and drops anything else", () => {
    expect(adminMediaSrc("/api/zakat/v1/media/3?size=thumbnail")).toBe("/bff/zakat-admin/media/3?size=thumbnail");
    expect(adminMediaSrc("/api/zakat/v1/media/3?size=huge")).toBe("/bff/zakat-admin/media/3");
  });
  it("passes other URLs through and handles empty values", () => {
    expect(adminMediaSrc("https://example.org/a.png")).toBe("https://example.org/a.png");
    expect(adminMediaSrc(null)).toBeNull();
    expect(adminMediaById("abc")).toBeNull();
    expect(adminMediaById(7, "medium")).toBe("/bff/zakat-admin/media/7?size=medium");
  });
});

describe("cause end date", () => {
  it("uses the Addis Ababa calendar day", () => {
    // 22:30 UTC is already the next day in Addis Ababa (UTC+3).
    expect(todayInAddis(new Date("2026-11-11T22:30:00Z"))).toBe("2026-11-12");
  });
  it("needs today or later on a new cause", () => {
    expect(endsOnError("2026-11-10", null, "2026-11-11")).toBe(END_DATE_PASSED);
    expect(endsOnError("2026-11-11", null, "2026-11-11")).toBeNull();
    expect(endsOnError("", null, "2026-11-11")).toBeNull();
  });
  it("checks only a changed date on an edit", () => {
    expect(endsOnError("1981-11-14", "1981-11-14", "2026-11-11")).toBeNull();
    expect(endsOnError("2026-01-01", "1981-11-14", "2026-11-11")).toBe(END_DATE_PASSED);
    expect(endsOnError("2026-12-01", null, "2026-11-11")).toBeNull();
  });
  it("blocks publishing past the end date", () => {
    expect(endDatePassed("2026-11-10", "2026-11-11")).toBe(true);
    expect(endDatePassed("2026-11-11", "2026-11-11")).toBe(false);
    expect(endDatePassed(null, "2026-11-11")).toBe(false);
  });
});

describe("coverAltTextChange", () => {
  it("sends nothing when the text and image are unchanged", () => {
    expect(coverAltTextChange({ id: "5", altText: " Well " }, { id: "5", altText: "Well" })).toBeUndefined();
  });
  it("sends a changed or cleared text for the same image", () => {
    expect(coverAltTextChange({ id: "5", altText: "New" }, { id: "5", altText: "Old" })).toEqual({ mediaId: "5", altText: "New" });
    expect(coverAltTextChange({ id: "5", altText: "" }, { id: "5", altText: "Old" })).toEqual({ mediaId: "5", altText: null });
  });
  it("puts the text on a new cover, and nothing without a cover", () => {
    expect(coverAltTextChange({ id: "9", altText: "Kids" }, { id: "5", altText: "Kids" })).toEqual({ mediaId: "9", altText: "Kids" });
    expect(coverAltTextChange({ id: "9", altText: "" }, { id: "5", altText: "Kids" })).toBeUndefined();
    expect(coverAltTextChange({ id: "", altText: "Kids" }, { id: null, altText: null })).toBeUndefined();
  });
});

describe("content audit log", () => {
  it("words actions and roles", () => {
    expect(actionLabel("CAUSE_CLOSED_AUTOMATICALLY")).toBe("Cause closed automatically");
    expect(actionLabel("CALCULATOR_CONFIG_ACTIVATED")).toBe("Calculator rules activated");
    expect(roleLabel("FIELD_OFFICER")).toBe("Field officer");
    expect(roleLabel(null)).toBeNull();
    expect(humanize("previousVersion")).toBe("Previous version");
    expect(humanize("ZAKAT_AL_FITR_DELETED")).toBe("Zakat al-Fitr deleted");
  });
  it("summarises metadata on one line", () => {
    expect(metadataSummary({ previousVersion: 4, trigger: "daily" })).toBe("Previous version: 4 · Trigger: daily");
    expect(metadataSummary(null)).toBe("");
    expect(metadataSummary({ a: 1, b: 2, c: 3 }, 2)).toBe("A: 1 · B: 2 · +1 more");
  });
  it("builds the query with only the filters set", () => {
    expect(auditQuery({ ...AUDIT_FILTER_DEFAULTS, entityType: "Cause", action: "cause created", page: 2 }, 50)).toBe(
      "entityType=Cause&action=CAUSE_CREATED&page=2&limit=50",
    );
    expect(auditQuery(AUDIT_FILTER_DEFAULTS, 50)).toBe("page=1&limit=50");
  });
  it("refuses a reversed date range", () => {
    expect(auditRangeError("2026-11-11", "2026-11-01")).not.toBeNull();
    expect(auditRangeError("2026-11-01", "2026-11-01")).toBeNull();
  });
  it("links records that have an editor", () => {
    expect(entityHref("Cause", "2")).toBe("/dashboard/zakat/causes/2");
    expect(entityHref("PriceSnapshot", "43")).toBeNull();
    expect(entityHref("Cause", null)).toBeNull();
  });
});
