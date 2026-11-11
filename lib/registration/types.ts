export type RegistrationType = "manual" | "institution";

export type BeneficiaryCategory =
  | "poor"
  | "needy"
  | "zakat_administrator"
  | "muallaf"
  | "freeing_captives"
  | "debtor"
  | "fi_sabilillah"
  | "stranded_traveler";

export type InstitutionSubtype =
  | "company"
  | "ngo"
  | "government"
  | "cooperative"
  | "other";

export type Gender = "male" | "female";

export type KycDocument = {
  code: string;
  label: string;
  required: boolean;
  uploaded: boolean;
};

export type UploadDocumentResponse = {
  companyDocumentUploadToken?: string;
  institutionRecommendedKycDocuments?: KycDocument[];
  institutionRequiredKycComplete?: boolean;
};
