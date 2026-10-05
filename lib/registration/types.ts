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

export type CreateBeneficiaryPayload = {
  fullName: string;
  phone: string;
  email: string;
  dateOfBirth: string;
  gender: Gender;
  region: string;
  city: string;
  addressLine: string;
  beneficiaryType: "individual";
  category: BeneficiaryCategory;
  notes: string;
  branchId?: string;
};

export type CreateCompanyPayload = {
  legalName: string;
  tradingName: string;
  tradeRegistrationNumber: string;
  taxIdentificationNumber: string;
  vatRegistrationNumber?: string;
  phone: string;
  email: string;
  region: string;
  city: string;
  addressLine: string;
  institutionSubtype: InstitutionSubtype;
  authorityToActDocumentRequired?: boolean;
  notes?: string;
  branchId?: string;
};

export type KycDocument = {
  code: string;
  label: string;
  required: boolean;
  uploaded: boolean;
};

export type CreateBeneficiaryResponse = {
  id: string;
  passwordSetupToken?: string;
};

export type CreateCompanyResponse = {
  id: string;
  passwordSetupToken?: string;
  companyDocumentUploadToken?: string;
  institutionRecommendedKycDocuments?: KycDocument[];
  institutionRequiredKycComplete?: boolean;
};

export type UploadDocumentResponse = {
  companyDocumentUploadToken?: string;
  institutionRecommendedKycDocuments?: KycDocument[];
  institutionRequiredKycComplete?: boolean;
};

export type SetPasswordPayload = {
  password: string;
  confirmPassword: string;
};
