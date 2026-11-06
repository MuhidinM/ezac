import { describe, expect, it } from "vitest";

import { type LinkClick, guardedHref } from "@/lib/backoffice/leave-guard";

const page = { origin: "http://localhost:3000", pathname: "/dashboard/assessments/8/edit", search: "" };

function click(overrides: Partial<LinkClick>): LinkClick {
  return {
    href: "http://localhost:3000/dashboard/beneficiary",
    target: "",
    download: false,
    button: 0,
    metaKey: false,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    defaultPrevented: false,
    ...overrides,
  };
}

describe("guardedHref", () => {
  it("returns the in-app address a plain click would open", () => {
    expect(guardedHref(click({}), page)).toBe("/dashboard/beneficiary");
    expect(guardedHref(click({ href: "http://localhost:3000/dashboard/assessments?status=SUBMITTED#top" }), page)).toBe(
      "/dashboard/assessments?status=SUBMITTED#top",
    );
  });

  it("lets clicks that keep this page open go through", () => {
    expect(guardedHref(click({ ctrlKey: true }), page)).toBeNull();
    expect(guardedHref(click({ metaKey: true }), page)).toBeNull();
    expect(guardedHref(click({ shiftKey: true }), page)).toBeNull();
    expect(guardedHref(click({ button: 1 }), page)).toBeNull();
    expect(guardedHref(click({ target: "_blank" }), page)).toBeNull();
    expect(guardedHref(click({ download: true }), page)).toBeNull();
  });

  it("ignores other sites, other schemes and clicks already handled", () => {
    expect(guardedHref(click({ href: "https://www.openstreetmap.org/" }), page)).toBeNull();
    expect(guardedHref(click({ href: "mailto:help@example.org" }), page)).toBeNull();
    expect(guardedHref(click({ defaultPrevented: true }), page)).toBeNull();
  });

  it("ignores links to this same page", () => {
    expect(guardedHref(click({ href: "http://localhost:3000/dashboard/assessments/8/edit#step" }), page)).toBeNull();
    expect(guardedHref(click({ target: "_self", href: "http://localhost:3000/dashboard/assessments/8" }), page)).toBe(
      "/dashboard/assessments/8",
    );
  });
});
