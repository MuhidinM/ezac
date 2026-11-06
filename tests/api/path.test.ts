import { describe, expect, it } from "vitest";

import { isBackendId, isSafePathSegment } from "@/lib/api/path";

describe("isSafePathSegment", () => {
  it.each(["42", "abc", "report.pdf", "...", "a b", "ሰላም", "x".repeat(200)])("accepts %j", (segment) => {
    expect(isSafePathSegment(segment)).toBe(true);
  });

  it.each([
    ["empty", ""],
    ["current-directory segment", "."],
    ["parent-directory segment", ".."],
    ["slash (a decoded %2F)", "a/b"],
    ["backslash", "a\\b"],
    ["percent (double encoding)", "a%2Fb"],
    ["newline", "a\nb"],
    ["NUL", "a\u0000b"],
    ["DEL", "a\u007fb"],
    ["over 200 characters", "x".repeat(201)],
  ])("rejects %s", (_label, segment) => {
    expect(isSafePathSegment(segment)).toBe(false);
  });
});

describe("isBackendId", () => {
  it.each(["0", "42", "9".repeat(19), "3f2b8c1e-9a4d-4e6f-b1c2-0d9e8f7a6b5c", "3F2B8C1E-9A4D-4E6F-B1C2-0D9E8F7A6B5C"])(
    "accepts %s",
    (id) => {
      expect(isBackendId(id)).toBe(true);
    },
  );

  it.each([
    "",
    "9".repeat(20),
    "-1",
    "4.2",
    " 42",
    "42\n",
    "42/..",
    "3f2b8c1e9a4d4e6fb1c20d9e8f7a6b5c",
    "3f2b8c1e-9a4d-4e6f-b1c2-0d9e8f7a6b5",
    "zf2b8c1e-9a4d-4e6f-b1c2-0d9e8f7a6b5c",
  ])("rejects %j", (id) => {
    expect(isBackendId(id)).toBe(false);
  });
});
