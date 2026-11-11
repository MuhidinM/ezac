import { describe, expect, it } from "vitest";

import {
  addisToday,
  homeFiguresProblems,
  receivingAccountToSend,
  seasonDeletePath,
  seasonDeletion,
} from "@/components/zakat/settings/logic";

describe("receivingAccountToSend", () => {
  it("sends the masked account back untouched, so the stored one is kept", () => {
    expect(receivingAccountToSend("*********7357", "*********7357")).toEqual({ value: "*********7357", changed: false, problem: null });
  });

  it("checks and cleans a new number", () => {
    expect(receivingAccountToSend("1000 1234-5678", "*********7357")).toEqual({ value: "100012345678", changed: true, problem: null });
    expect(receivingAccountToSend("12ab", "*********7357").problem).toBe("Use digits only.");
  });

  it("clears the account when emptied", () => {
    expect(receivingAccountToSend("", "*********7357")).toEqual({ value: null, changed: true, problem: null });
    expect(receivingAccountToSend("", null)).toEqual({ value: null, changed: false, problem: null });
  });
});

describe("seasonDeletion", () => {
  it("never deletes an open season", () => {
    expect(seasonDeletion("open").allowed).toBe(false);
  });

  it("deletes a season that hasn't started without force, an ended one with force", () => {
    expect(seasonDeletion("upcoming")).toEqual({ allowed: true, force: false });
    expect(seasonDeletion("closed")).toEqual({ allowed: true, force: true });
  });

  it("puts force and the reason in the query only when needed", () => {
    expect(seasonDeletePath(1447, false, "ignored")).toBe("/bff/zakat-admin/zakat-al-fitr/1447");
    expect(seasonDeletePath(1445, true, " Entered by mistake ")).toBe(
      "/bff/zakat-admin/zakat-al-fitr/1445?force=true&reason=Entered+by+mistake",
    );
  });
});

describe("homeFiguresProblems", () => {
  const ok = { households: "12", note: "Cash ledger, October 2026", asOfDate: "2026-11-10" };

  it("accepts a sourced change counted to a past day", () => {
    expect(homeFiguresProblems(ok, "2026-11-11")).toEqual({});
    expect(homeFiguresProblems({ ...ok, asOfDate: "2026-11-11" }, "2026-11-11")).toEqual({});
  });

  it("asks for a whole number, a source and a date not in the future", () => {
    expect(homeFiguresProblems({ households: "1.5", note: "short", asOfDate: "" }, "2026-11-11")).toEqual({
      offlineBeneficiaries: expect.any(String),
      note: expect.any(String),
      asOfDate: expect.any(String),
    });
    expect(homeFiguresProblems({ ...ok, asOfDate: "2026-11-12" }, "2026-11-11").asOfDate).toBe("Can't be in the future.");
  });
});

describe("addisToday", () => {
  it("uses Addis Ababa's date, not UTC's", () => {
    // 22:30 UTC on 10 November is 01:30 on 11 November in Addis Ababa.
    expect(addisToday(Date.parse("2026-11-10T22:30:00Z"))).toBe("2026-11-11");
  });
});
