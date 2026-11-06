import { describe, expect, it } from "vitest";

import { isPastLastPage, listPath, pageFromParam } from "@/components/site/list-page";

describe("pageFromParam", () => {
  it.each([
    [undefined, 1],
    ["", 1],
    ["1", 1],
    ["2", 2],
    ["0", 1],
    ["-3", 1],
    ["2.5", 1],
    ["abc", 1],
    ["1e3", 1],
    ["9999999", 1],
    [["3", "4"], 3],
  ] as const)("%j is page %i", (raw, page) => {
    expect(pageFromParam(raw as string | string[] | undefined)).toBe(page);
  });
});

describe("isPastLastPage", () => {
  it("allows page 1 of an empty list, so it can say nothing is published", () => {
    expect(isPastLastPage(1, 0)).toBe(false);
  });

  it("allows the pages that exist", () => {
    expect(isPastLastPage(3, 3)).toBe(false);
  });

  it("refuses a page past the end", () => {
    expect(isPastLastPage(4, 3)).toBe(true);
    expect(isPastLastPage(2, 0)).toBe(true);
  });
});

describe("listPath", () => {
  it("keeps page 1 on the bare path", () => {
    expect(listPath("/transparency/stories", 1)).toBe("/transparency/stories");
  });

  it("adds the page after the list's own parameters", () => {
    expect(listPath("/causes", 2, { status: "closed" })).toBe("/causes?status=closed&page=2");
    expect(listPath("/causes", 1, { status: "closed" })).toBe("/causes?status=closed");
  });

  it("leaves out empty parameters", () => {
    expect(listPath("/causes", 3, { status: undefined })).toBe("/causes?page=3");
  });
});
