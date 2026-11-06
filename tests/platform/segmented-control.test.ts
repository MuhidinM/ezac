import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ChoiceCards, SegmentedControl } from "@/components/ui/segmented-control";

const options = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
] as const;

function render(component: typeof SegmentedControl | typeof ChoiceCards, props: { name?: string; required?: boolean }) {
  return renderToStaticMarkup(
    createElement(component, { value: null, onValueChange: () => {}, options, "aria-label": "Answer", ...props }),
  );
}

describe("required radio groups (Firefox blocked forms with unnamed required radios)", () => {
  it.each([SegmentedControl, ChoiceCards])("an unnamed group is aria-required only", (component) => {
    const html = render(component, { required: true });
    expect(html).toContain('aria-required="true"');
    expect(html).not.toMatch(/<input[^>]*required/);
  });

  it("a named group keeps the native required radios", () => {
    const html = render(SegmentedControl, { required: true, name: "answer" });
    expect(html).toContain('aria-required="true"');
    expect(html).toMatch(/<input[^>]*name="answer"[^>]*required|<input[^>]*required[^>]*name="answer"/);
  });

  it("an optional group is not marked required", () => {
    expect(render(SegmentedControl, {})).not.toContain("aria-required=\"true\"");
  });
});
