import { describe, expect, it } from "vitest";

import { noteReplacesFiles, whitelistEvidenceProblem } from "@/lib/backoffice/whitelist";

const pdf = { name: "letter.pdf", size: 1000, type: "application/pdf" };
const emergency = { effect: "FAST_TRACK", reasonCode: "disaster_or_displacement_emergency", communityNote: "" };

describe("whitelist evidence", () => {
  it("lets a long enough note replace files only for a fast-track emergency", () => {
    const note = "Kebele elders confirmed the flood.";
    expect(noteReplacesFiles("FAST_TRACK", "disaster_or_displacement_emergency", note)).toBe(true);
    expect(noteReplacesFiles("PRIORITY", "disaster_or_displacement_emergency", note)).toBe(false);
    expect(noteReplacesFiles("FAST_TRACK", "disaster_or_displacement_emergency", "too short")).toBe(false);
    expect(whitelistEvidenceProblem({ ...emergency, communityNote: note }, [])).toBeNull();
  });

  it("asks for files otherwise", () => {
    expect(whitelistEvidenceProblem(emergency, [])).toMatch(/community verification note of at least 20/);
    expect(whitelistEvidenceProblem({ ...emergency, effect: "PRIORITY" }, [])).toBe("Attach at least one evidence file.");
  });

  it("allows at most 5 files of 5 MB, PDF or image", () => {
    expect(whitelistEvidenceProblem(emergency, [pdf])).toBeNull();
    expect(whitelistEvidenceProblem(emergency, Array(6).fill(pdf))).toBe("Attach at most 5 files.");
    expect(whitelistEvidenceProblem(emergency, [{ ...pdf, type: "text/plain" }])).toMatch(/PDF, JPEG, PNG or WebP/);
    expect(whitelistEvidenceProblem(emergency, [{ ...pdf, size: 6 * 1024 * 1024 }])).toMatch(/larger than 5 MB/);
  });
});
