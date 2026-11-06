import { describe, expect, it } from "vitest";

import { toAsciiNumber } from "@/lib/i18n/digits";

describe("toAsciiNumber", () => {
  it("converts Arabic-Indic digits", () => {
    expect(toAsciiNumber("٠١٢٣٤٥٦٧٨٩")).toBe("0123456789");
  });

  it("converts Extended Arabic-Indic (Persian) digits", () => {
    expect(toAsciiNumber("۰۱۲۳۴۵۶۷۸۹")).toBe("0123456789");
  });

  it("converts the Arabic decimal and thousands separators and the Arabic comma", () => {
    expect(toAsciiNumber("١٢٫٥")).toBe("12.5");
    expect(toAsciiNumber("١٬٢٣٤٫٥")).toBe("1,234.5");
    expect(toAsciiNumber("١،٥")).toBe("1,5");
  });

  it("keeps other characters, so mixed input such as a certificate number matches", () => {
    expect(toAsciiNumber("ZC-٢٠٢٦-0001")).toBe("ZC-2026-0001");
    expect(toAsciiNumber("12.5 ETB")).toBe("12.5 ETB");
  });

  it("leaves Ethiopic numerals and empty input alone", () => {
    expect(toAsciiNumber("፩፪")).toBe("፩፪");
    expect(toAsciiNumber("")).toBe("");
  });
});
