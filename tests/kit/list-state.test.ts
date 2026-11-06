import { describe, expect, it } from "vitest";

import {
  type ListStateConfig,
  isDefaultListState,
  nextListState,
  readListState,
  writeListState,
} from "@/lib/hooks/list-state";

const defaults = { q: "", status: "OPEN", sort: "updatedAt:desc", page: 1, mine: false, regions: [] as string[] };
type State = typeof defaults;
const config: ListStateConfig<State> = {
  prefix: "",
  defaults,
  allowed: { status: ["OPEN", "SUBMITTED", ""] },
};

function read(query: string, cfg: ListStateConfig<State> = config) {
  return readListState(new URLSearchParams(query), cfg);
}

describe("readListState", () => {
  it("reads every field with its default's type", () => {
    expect(read("q=amina&status=SUBMITTED&page=3&mine=1&regions=Afar&regions=Amhara")).toEqual({
      q: "amina",
      status: "SUBMITTED",
      sort: "updatedAt:desc",
      page: 3,
      mine: true,
      regions: ["Afar", "Amhara"],
    });
  });

  it("falls back to the default for a missing, unreadable or unknown value", () => {
    expect(read("")).toEqual(defaults);
    expect(read("page=abc&mine=maybe&status=DELETED")).toEqual(defaults);
  });

  it("keeps an empty string that differs from the default (the All tab)", () => {
    expect(read("status=").status).toBe("");
  });

  it("starts pages at 1 and keeps them whole", () => {
    expect(read("page=0").page).toBe(1);
    expect(read("page=-4").page).toBe(1);
    expect(read("page=2.7").page).toBe(2);
  });

  it("reads only its own prefixed params", () => {
    const codes = { ...config, prefix: "codes" };
    expect(read("page=5&codes.page=2", codes).page).toBe(2);
  });
});

describe("writeListState", () => {
  it("leaves defaults out so an unfiltered list has a clean URL", () => {
    expect(writeListState(new URLSearchParams(), defaults, config).toString()).toBe("");
  });

  it("writes changed fields and keeps params that belong to something else", () => {
    const params = writeListState(
      new URLSearchParams("redirect=%2Fdashboard&page=4"),
      { ...defaults, q: "Amina Y", status: "", mine: true, regions: ["Afar", "Oromia"] },
      config,
    );
    expect(params.get("redirect")).toBe("/dashboard");
    expect(params.has("page")).toBe(false);
    expect(params.get("q")).toBe("Amina Y");
    expect(params.get("status")).toBe("");
    expect(params.get("mine")).toBe("1");
    expect(params.getAll("regions")).toEqual(["Afar", "Oromia"]);
  });

  it("round-trips through the URL", () => {
    const state = { ...defaults, q: "x&y=z", page: 7, regions: ["Somali"] };
    expect(read(writeListState(new URLSearchParams(), state, config).toString())).toEqual(state);
  });
});

describe("nextListState", () => {
  const onPage3 = { ...defaults, page: 3 };

  it("goes back to page 1 when a filter changes", () => {
    expect(nextListState(onPage3, { status: "SUBMITTED" }, config).page).toBe(1);
  });

  it("keeps the page when only the page changes, or when asked", () => {
    expect(nextListState(onPage3, { page: 4 }, config).page).toBe(4);
    expect(nextListState(onPage3, { sort: "score:desc" }, config, { keepPage: true }).page).toBe(3);
  });

  it("keeps the page when a 'change' sets the same value", () => {
    expect(nextListState(onPage3, { status: "OPEN" }, config).page).toBe(3);
  });
});

describe("isDefaultListState", () => {
  it("ignores the page", () => {
    expect(isDefaultListState({ ...defaults, page: 5 }, defaults)).toBe(true);
    expect(isDefaultListState({ ...defaults, q: "a" }, defaults)).toBe(false);
    expect(isDefaultListState({ ...defaults, regions: ["Afar"] }, defaults)).toBe(false);
  });
});
