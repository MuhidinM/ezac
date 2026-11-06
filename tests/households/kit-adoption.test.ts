import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { YesNoField } from "@/components/assessment/fields";
import { ScoreMeter } from "@/components/backoffice/status-badges";
import { CheckboxGroup } from "@/components/wizard/ui/checkbox-group";
import { ASNAF, labelFor } from "@/lib/backoffice/options";
import { FALLBACK_SCORE_MAX } from "@/lib/backoffice/score-max";
import { yesNoChoice, yesNoValue } from "@/lib/backoffice/yes-no";

describe("Yes / No field", () => {
  it("maps values to choices and back", () => {
    expect(yesNoChoice(true, false)).toBe("yes");
    expect(yesNoChoice(false, true)).toBe("no");
    expect(yesNoChoice(null, true)).toBe("auto");
    expect(yesNoChoice(null, false)).toBeNull();
    expect(yesNoValue("yes")).toBe(true);
    expect(yesNoValue("no")).toBe(false);
    expect(yesNoValue("auto")).toBeNull();
  });

  it("is a radio group named by its label, with Auto checked for null", () => {
    const html = renderToStaticMarkup(
      createElement(YesNoField, { id: "q1", label: "Has a disability", value: null, onChange: () => {}, autoLabel: "Auto" }),
    );
    expect(html).toContain('role="radiogroup"');
    expect(html).toMatch(/aria-labelledby="[^"]+-label"/);
    expect(html).toMatch(/aria-checked="true"[^>]*>Auto</);
  });
});

describe("CheckboxGroup", () => {
  it("gives two groups with the same option value different ids", () => {
    const group = (label: string) =>
      createElement(CheckboxGroup, { label, options: [{ value: "other", label: "Other" }], values: {}, onChange: () => {} });
    const html = renderToStaticMarkup(createElement("div", null, group("Programs"), group("Funding")));
    const ids = [...html.matchAll(/<input[^>]*id="([^"]+)"/g)].map((match) => match[1]);
    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(2);
    for (const id of ids) expect(html).toContain(`for="${id}"`);
  });
});

describe("ScoreMeter", () => {
  it("shows the row's own maximum", () => {
    expect(renderToStaticMarkup(createElement(ScoreMeter, { score: 120, max: 300 }))).toContain("/ 300");
  });

  it("falls back to the shared constant only when no maximum is known", () => {
    expect(renderToStaticMarkup(createElement(ScoreMeter, { score: 120, max: null }))).toContain(
      `/ ${FALLBACK_SCORE_MAX}`,
    );
  });
});

describe("asnaf labels", () => {
  it("gloss the Arabic terms in English, as on the public site", () => {
    expect(labelFor(ASNAF, "muallaf")).toBe("Hearts to be reconciled (Muallaf)");
    expect(labelFor(ASNAF, "fi_sabilillah")).toBe("In the cause of Allah (Fi sabilillah)");
  });
});
