import { describe, expect, it } from "vitest";

import { changedPaths, draftBaseline, draftToContinue, setPath } from "@/lib/backoffice/scoring-config";

import { schema, validConfig, version } from "./fixtures/scoring";

describe("draftBaseline", () => {
  it("is not stale when the draft is a copy of the live version", () => {
    const live = version({ version: 3, active: true });
    const draft = version({ version: 4, status: "DRAFT", basedOnVersion: 3 });
    expect(draftBaseline(draft, [draft, live])).toEqual({ live, base: live, stale: false, compareWith: live });
  });

  it("compares with the live version when the draft was copied from another one", () => {
    const old = version({ version: 2 });
    const live = version({ version: 5, active: true });
    const draft = version({ version: 6, status: "DRAFT", basedOnVersion: 2 });
    expect(draftBaseline(draft, [draft, live, old])).toEqual({ live, base: old, stale: true, compareWith: live });
  });

  it("is stale when the draft names no source and a version is live", () => {
    const live = version({ version: 1, active: true });
    const draft = version({ version: 2, status: "DRAFT" });
    expect(draftBaseline(draft, [draft, live])).toMatchObject({ base: null, stale: true, compareWith: live });
  });

  it("falls back to the copied version when nothing is live", () => {
    const base = version({ version: 1 });
    const draft = version({ version: 2, status: "DRAFT", basedOnVersion: 1 });
    expect(draftBaseline(draft, [draft, base])).toEqual({ live: null, base, stale: false, compareWith: base });
  });

  it("counts the settings a stale draft would undo", () => {
    const old = version({ version: 2 });
    const live = version({ version: 5, active: true, config: setPath(validConfig(), "sections.income.zero", 55) });
    // Unedited copy of v2: no changes from its base, one from live.
    const draft = version({ version: 6, status: "DRAFT", basedOnVersion: 2 });
    const { base, compareWith } = draftBaseline(draft, [draft, live, old]);
    expect(changedPaths(schema.fields, base?.config, draft.config)).toEqual([]);
    expect(changedPaths(schema.fields, compareWith?.config, draft.config)).toEqual(["sections.income.zero"]);
  });
});

describe("draftToContinue", () => {
  it("is null when no draft is open", () => {
    expect(draftToContinue([version({ version: 1, active: true }), version({ version: 2 })])).toBeNull();
  });

  it("prefers the newest copy of the live version over a newer stale draft", () => {
    const versions = [
      version({ version: 1 }),
      version({ version: 2, active: true }),
      version({ version: 3, status: "DRAFT", basedOnVersion: 2 }),
      version({ version: 4, status: "DRAFT", basedOnVersion: 2 }),
      version({ version: 5, status: "DRAFT", basedOnVersion: 1 }),
    ];
    expect(draftToContinue(versions)?.version).toBe(4);
  });

  it("falls back to the newest draft when none is a copy of the live version", () => {
    const versions = [
      version({ version: 2, active: true }),
      version({ version: 3, status: "DRAFT", basedOnVersion: 1 }),
      version({ version: 4, status: "DRAFT", basedOnVersion: 1 }),
    ];
    expect(draftToContinue(versions)?.version).toBe(4);
  });
});
