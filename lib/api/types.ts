import type {
  AssessmentStatus,
  BankAccount,
  DuplicateStatus,
  LifecycleStatus,
  PoolStatus,
  RiskCategory,
  WhitelistEffect,
} from "@/lib/api/backoffice-types";

export type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  message?: string;
  errors?: unknown;
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
  lifecycleStatus?: LifecycleStatus | null;
  duplicateStatus?: DuplicateStatus | null;
  /** Means-test score; absent until the beneficiary is assessed. */
  score?: number | null;
  maxScore?: number | null;
  riskCategory?: RiskCategory | null;
  lastAssessedAt?: string | null;
  assessmentStatus?: AssessmentStatus | null;
  /** Absent until the branch approves. */
  poolStatus?: PoolStatus | null;
  /** false = the officer still has to enter the bank details. */
  hasBankAccount?: boolean | null;
  whitelistEffect?: WhitelistEffect | null;
};

export type BeneficiaryDetail = {
  id: string;
  fullName: string | null;
  phone: string | null;
  email: string | null;
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
  // Means-testing basic details (section B)
  maritalStatus?: string | null;
  estimatedAge?: number | null;
  religion?: string | null;
  primaryLanguage?: string | null;
  primaryLanguageOther?: string | null;
  zone?: string | null;
  woreda?: string | null;
  kebele?: string | null;
  branchId?: string | null;
  branchName?: string | null;
  /** Beneficiary identification number: the registration code used. */
  bin?: string | null;
  registrationCode?: string | null;
  lifecycleStatus?: LifecycleStatus | null;
  duplicateStatus?: DuplicateStatus | null;
  bankAccount?: BankAccount | null;
  poolStatus?: PoolStatus | null;
  whitelistEffect?: WhitelistEffect | null;
};

export type StaffRole = "ADMIN" | "FIELD_OFFICER";

export type AppRole = StaffRole | "BRANCH";

export type SessionInfo = {
  username: string;
  roles: AppRole[];
  allRoles: string[];
  isAdmin: boolean;
  isBranch: boolean;
  isStaff: boolean;
  email?: string | null;
  phone?: string | null;
  displayName?: string | null;
};

export type MeProfile = {
  sub: string;
  email: string | null;
  displayName: string | null;
  phone: string | null;
  roles: string[];
  donorSummary?: unknown;
};

export type UpdateMeBody = {
  phone?: string;
  displayName?: string;
};

export type ChangePasswordBody = {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
};

export type InstitutionListItem = {
  id: string;
  fullName: string | null;
  tradingName: string | null;
  phone: string | null;
  verificationStatus: VerificationStatus;
  institutionSubtype: string | null;
  institutionRequiredKycComplete: boolean | null;
  createdAt: string;
};

export type InstitutionDocumentCode =
  | "TRADE_REGISTRATION"
  | "TAX_STATUS"
  | "AUTHORITY_TO_ACT"
  | string;

export type InstitutionDocumentItem = {
  documentCode: InstitutionDocumentCode;
  label?: string | null;
  uploaded?: boolean;
  required?: boolean;
  fileName?: string | null;
  contentType?: string | null;
  uploadedAt?: string | null;
};

export type BeneficiaryUpdateBody = {
  fullName?: string | null;
  phone?: string | null;
  email?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  region?: string | null;
  city?: string | null;
  addressLine?: string | null;
  nationality?: string | null;
  beneficiaryCategory?: string | null;
  notes?: string | null;
  tradingName?: string | null;
  tradeRegistrationNumber?: string | null;
  taxIdentificationNumber?: string | null;
  vatRegistrationNumber?: string | null;
  institutionSubtype?: string | null;
  maritalStatus?: string | null;
  estimatedAge?: number | null;
  religion?: string | null;
  primaryLanguage?: string | null;
  primaryLanguageOther?: string | null;
  zone?: string | null;
  woreda?: string | null;
  kebele?: string | null;
};

export type CodeStats = {
  available: number;
  reserved: number;
  consumed: number;
  revoked: number;
};

export type RegistrationCodeStatus =
  | "AVAILABLE"
  | "RESERVED"
  | "CONSUMED"
  | "REVOKED";

export type RegistrationCodeItem = {
  id: string;
  code: string;
  status: RegistrationCodeStatus;
  beneficiaryId: string | null;
  consumedAt: string | null;
  createdAt: string;
  revokedAt?: string | null;
  revokedBy?: string | null;
  revokeReason?: string | null;
};

export type BranchListItem = {
  id: string;
  name: string;
  region: string | null;
  zone: string | null;
  woreda: string | null;
  branchPhone: string | null;
  branchEmail: string | null;
  branchFullName: string | null;
  active: boolean;
  codeStats: CodeStats | null;
  createdAt?: string;
  officerName?: string | null;
};

export type Branch = BranchListItem;

export type CreateBranchBody = {
  name: string;
  region: string;
  zone: string;
  woreda: string;
  branchPhone: string;
  branchEmail?: string;
  branchFullName: string;
};

export type BranchCreateResponse = Branch & {
  initialPassword: string;
  passwordChangeRequired: boolean;
};

export type BranchPortalProfile = {
  id?: string;
  name: string;
  region: string | null;
  zone: string | null;
  woreda: string | null;
  codeStats: CodeStats | null;
};
