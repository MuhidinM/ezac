import { describe, expect, it } from "vitest";

import { ApiError } from "@/lib/api/errors";
import {
  activationNeedsAnotherAdmin,
  changedPaths,
  draftBaseline,
  draftToContinue,
  scoringHistorySteps,
  setPath,
  staleDraftConflict,
} from "@/lib/backoffice/scoring-config";

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

describe("activationNeedsAnotherAdmin", () => {
  it("is true for whoever made or last edited the version", () => {
    const draft = version({ version: 7, status: "DRAFT", createdBy: "admin-a", updatedBy: "admin-b" });
    expect(activationNeedsAnotherAdmin(draft, "admin-a")).toBe(true);
    expect(activationNeedsAnotherAdmin(draft, "admin-b")).toBe(true);
    expect(activationNeedsAnotherAdmin(draft, "admin-c")).toBe(false);
  });

  it("doesn't hide Activate before the signed-in admin is known", () => {
    expect(activationNeedsAnotherAdmin(version({ version: 7, createdBy: "admin-a" }), null)).toBe(false);
  });
});

describe("staleDraftConflict", () => {
  it("reads both versions from a 409 STALE_DRAFT", () => {
    const error = new ApiError("Stale", 409, [], { basedOnVersion: 1, activeVersion: 3 }, "STALE_DRAFT");
    expect(staleDraftConflict(error)).toEqual({ basedOnVersion: 1, activeVersion: 3 });
  });

  it("is null for any other error", () => {
    expect(staleDraftConflict(new ApiError("Conflict", 409, [], null, "VERSION_CONFLICT"))).toBeNull();
    expect(staleDraftConflict(new Error("x"))).toBeNull();
  });
});

describe("scoringHistorySteps", () => {
  it("lists drafted, edits, activations and retirements in time order", () => {
    const steps = scoringHistorySteps({
      version: 9,
      basedOnVersion: 1,
      drafted: { by: "a", byName: "Platform Admin", at: "2026-11-05T09:45:00Z" },
      edits: [{ by: "a", byName: "Platform Admin", at: "2026-11-05T09:46:00Z" }],
      activations: [
        {
          version: 9,
          activatedAt: "2026-11-05T09:47:06Z",
          activatedByName: "Second Admin",
          reason: "Committee 12",
          retiredAt: "2026-11-05T09:47:52Z",
          retiredByName: "Second Admin",
        },
      ],
    });
    expect(steps.map((step) => step.title)).toEqual([
      "Drafted from v1",
      "Edited",
      "Activated",
      "Replaced by another version",
    ]);
    expect(steps[2]).toMatchObject({ byName: "Second Admin", note: "Committee 12" });
  });
});
