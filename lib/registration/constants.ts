import type { BeneficiaryCategory, Gender, InstitutionSubtype } from "@/lib/registration/types";

export const BENEFICIARY_CATEGORIES: {
  value: BeneficiaryCategory;
  label: string;
}[] = [
  { value: "poor", label: "Poor" },
  { value: "needy", label: "Needy" },
  { value: "zakat_administrator", label: "Zakat Administrator" },
  { value: "muallaf", label: "Muallaf" },
  { value: "freeing_captives", label: "Freeing Captives" },
  { value: "debtor", label: "Debtor" },
  { value: "fi_sabilillah", label: "Fi Sabilillah" },
  { value: "stranded_traveler", label: "Stranded Traveler" },
];

export const INSTITUTION_SUBTYPES: {
  value: InstitutionSubtype;
  label: string;
}[] = [
  { value: "company", label: "Company" },
  { value: "ngo", label: "NGO" },
  { value: "government", label: "Government" },
  { value: "cooperative", label: "Cooperative" },
  { value: "other", label: "Other" },
];

export const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

/**
 * Stepper labels for staff registration, the same on every page. The type
 * step is skipped while "Individual" is the only type (see welcome-step.tsx).
 */
export const REGISTRATION_STEPS = ["Branch", "Details", "Login"];

/** Where the branch step goes next while individuals are the only type. */
export const FIRST_DETAILS_STEP = "/dashboard/register/manual";

export const PHONE_PREFIX = "+251";

/**
 * Upload limits of household registration (backend answers 2026-11-11,
 * 3.1 #5). The server checks the type from the file's bytes, so these
 * checks only save the officer a wasted upload. A request may carry 12 MB
 * in all, which one photo or one document per request never reaches.
 */
export const MAX_PROFILE_IMAGE_SIZE = 2 * 1024 * 1024;
export const MAX_KYC_FILE_SIZE = 5 * 1024 * 1024;

export const PROFILE_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const KYC_FILE_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

/**
 * Version of the data-processing notice read to the household, sent with
 * its consent on registration. Change it when the notice text changes.
 */
export const CONSENT_NOTICE_VERSION = "2026-11";

export const BULK_IMPORT_ACCEPT = ".csv,.xls,.xlsx";
export const BULK_IMPORT_EXTENSIONS = [".csv", ".xls", ".xlsx"];
export const BULK_IMPORT_TYPES = [
  "text/csv",
  "application/csv",
  "text/plain",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];
export const MAX_BULK_IMPORT_SIZE = 5 * 1024 * 1024;
