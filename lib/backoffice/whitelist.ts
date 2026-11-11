import type { BeneficiaryListItem } from "@/lib/api/types";

type Household = Pick<
  BeneficiaryListItem,
  "beneficiaryType" | "verificationStatus" | "lifecycleStatus" | "duplicateStatus" | "whitelistEffect"
>;

/**
 * Why a household can't be added to the whitelist, or null when it can. The
 * backend refuses institutions, confirmed duplicates, rejected and exited
 * households, and households that already have an entry; the picker shows
 * the reason instead of letting the admin pick one and fail on save.
 */
export function whitelistBlocker(household: Household): string | null {
  if (household.whitelistEffect) return "Already whitelisted";
  if (household.beneficiaryType === "institution") return "Institution";
  if (household.duplicateStatus === "CONFIRMED_DUPLICATE") return "Confirmed duplicate";
  if (household.verificationStatus === "rejected") return "Registration rejected";
  if (household.lifecycleStatus === "EXITED") return "Exited";
  return null;
}

/** Something to check before picking a household that can still be picked. */
export function whitelistCaution(household: Household): string | null {
  if (household.duplicateStatus === "POTENTIAL") return "Possible duplicate";
  return null;
}

/** Evidence the backend accepts: at most 5 files of 5 MB each, PDF, JPEG, PNG or WebP. */
export const WHITELIST_EVIDENCE_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
export const WHITELIST_MAX_FILES = 5;
export const WHITELIST_MAX_FILE_BYTES = 5 * 1024 * 1024;
/** The emergency reason: with Fast track, a community note can stand in for files. */
export const EMERGENCY_REASON = "disaster_or_displacement_emergency";
export const EMERGENCY_NOTE_MIN = 20;

/** A disaster or displacement emergency with Fast track may use a community note instead of files. */
export function isEmergencyFastTrack(effect: string, reasonCode: string) {
  return effect === "FAST_TRACK" && reasonCode === EMERGENCY_REASON;
}

/** Whether the community note is long enough to replace the evidence files. */
export function noteReplacesFiles(effect: string, reasonCode: string, note: string) {
  return isEmergencyFastTrack(effect, reasonCode) && note.trim().length >= EMERGENCY_NOTE_MIN;
}

/** What is wrong with the evidence, or null when the backend will take it. */
export function whitelistEvidenceProblem(
  input: { effect: string; reasonCode: string; communityNote: string },
  files: { name: string; size: number; type: string }[],
): string | null {
  if (files.length === 0 && !noteReplacesFiles(input.effect, input.reasonCode, input.communityNote)) {
    return isEmergencyFastTrack(input.effect, input.reasonCode)
      ? `Attach evidence, or write a community verification note of at least ${EMERGENCY_NOTE_MIN} characters.`
      : "Attach at least one evidence file.";
  }
  if (files.length > WHITELIST_MAX_FILES) return `Attach at most ${WHITELIST_MAX_FILES} files.`;
  if (files.some((file) => !WHITELIST_EVIDENCE_TYPES.includes(file.type))) return "Evidence must be PDF, JPEG, PNG or WebP.";
  const tooBig = files.find((file) => file.size > WHITELIST_MAX_FILE_BYTES);
  if (tooBig) return `"${tooBig.name}" is larger than 5 MB. Attach a smaller file or a scan at lower quality.`;
  return null;
}
