import { describe, expect, it } from "vitest";

import { format } from "@/lib/i18n/messages";

describe("format", () => {
  it("fills placeholders", () => {
    expect(format("Wait {n} minutes", { n: 5 })).toBe("Wait 5 minutes");
    expect(format("{a} and {b}", { a: "x", b: "y" })).toBe("x and y");
  });

  it("fills every occurrence of a placeholder", () => {
    expect(format("{x}-{x}", { x: 1 })).toBe("1-1");
  });

  it("writes falsy values instead of dropping them", () => {
    expect(format("{n} items", { n: 0 })).toBe("0 items");
    expect(format("[{s}]", { s: "" })).toBe("[]");
  });

  it("leaves placeholders without a value as they are", () => {
    expect(format("Hello {name}", {})).toBe("Hello {name}");
  });

  it("ignores keys inherited from Object.prototype", () => {
    expect(format("{constructor} {toString}", {})).toBe("{constructor} {toString}");
  });

  it("inserts values literally, without replacement patterns", () => {
    expect(format("{x}", { x: "$& $1 $$" })).toBe("$& $1 $$");
  });

  it("leaves braces that are not a placeholder alone", () => {
    expect(format("{a-b} {} { n }", { n: 1 })).toBe("{a-b} {} { n }");
  });

  it("works with non-Latin text around placeholders", () => {
    expect(format("ከ{minimum} ራስ ጀምሮ", { minimum: 30 })).toBe("ከ30 ራስ ጀምሮ");
  });
});
