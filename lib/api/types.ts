export type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  message?: string;
};

export type Pagination = {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
};

export type PaginatedItems<T> = {
  items: T[];
  pagination: Pagination;
};

export type LoginData = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  passwordChangeRequired: boolean;
};

export type VerificationStatus =
  | "pending"
  | "pending_third_party"
  | "verified"
  | "rejected";

export type BeneficiaryType = "individual" | "institution";

export type BeneficiaryListItem = {
  id: string;
  fullName: string | null;
  phone: string | null;
  beneficiaryType: BeneficiaryType;
  beneficiaryCategory: string | null;
  verificationStatus: VerificationStatus;
  createdAt: string;
};

export type BeneficiaryDetail = {
  id: string;
  fullName: string | null;
  phone: string | null;
  email: string | null;
  nationalId: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  region: string | null;
  city: string | null;
  addressLine: string | null;
  nationality: string | null;
  beneficiaryType: BeneficiaryType;
  beneficiaryCategory: string | null;
  hasProfilePicture: boolean;
  verificationStatus: VerificationStatus;
  verificationReason: string | null;
  notes: string | null;
  identityProviderSub: string | null;
  verificationLink: string | null;
  tradingName: string | null;
  tradeRegistrationNumber: string | null;
  taxIdentificationNumber: string | null;
  vatRegistrationNumber: string | null;
  institutionSubtype: string | null;
  institutionRecommendedKycDocuments: unknown;
  institutionRequiredKycComplete: boolean | null;
  createdAt: string;
  updatedAt: string;
};

export type StaffRole = "ADMIN" | "FIELD_OFFICER";

export type SessionInfo = {
  username: string;
  roles: StaffRole[];
  isAdmin: boolean;
};
