import { describe, expect, it } from "vitest";

import { pageOfCauses } from "@/lib/zakat/causes-page";

describe("pageOfCauses", () => {
  const causes = Array.from({ length: 45 }, (_, index) => ({ id: String(index + 1) }));

  it("pages a plain list here", () => {
    const second = pageOfCauses(causes, 2, 20);
    expect(second.items.map((cause) => cause.id)).toEqual(causes.slice(20, 40).map((cause) => cause.id));
    expect(second.totalItems).toBe(45);
    expect(second.totalPages).toBe(3);
    expect(pageOfCauses(causes, 3, 20).items).toHaveLength(5);
  });

  it("uses a paged answer as sent", () => {
    const answer = { items: causes.slice(0, 20), pagination: { page: 1, limit: 20, totalItems: 45, totalPages: 3 } };
    expect(pageOfCauses(answer, 1, 20)).toEqual({ items: answer.items, totalItems: 45, totalPages: 3 });
  });

  it("shows the last page when the page is past the end, and copes with no data", () => {
    expect(pageOfCauses(causes, 9, 20).items).toHaveLength(5);
    expect(pageOfCauses(undefined, 1, 20)).toEqual({ items: [], totalItems: 0, totalPages: 1 });
  });
});
