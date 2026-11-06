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
