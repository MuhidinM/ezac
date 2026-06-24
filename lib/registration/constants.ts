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

export const PHONE_PREFIX = "+251";

export const MAX_PROFILE_IMAGE_SIZE = 5 * 1024 * 1024;
export const MAX_KYC_FILE_SIZE = 10 * 1024 * 1024;

export const PROFILE_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const KYC_FILE_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
];

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
