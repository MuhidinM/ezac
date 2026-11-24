import type { InstitutionSubtype, KycDocument } from "@/lib/registration/types";

/** POST /api/beneficiaries/v1/companies (REGISTRATION_MANUAL_AND_INSTITUTION_FLOW.md, 4.2). */
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
  authorityToActDocumentRequired: boolean;
  notes?: string;
};

export type CreateCompanyResponse = {
  id: string;
  companyDocumentUploadToken?: string;
  institutionRecommendedKycDocuments?: KycDocument[];
  institutionRequiredKycComplete?: boolean;
};

const SUBTYPES: readonly InstitutionSubtype[] = ["company", "ngo", "government", "cooperative", "other"];
const TEXT_FIELDS = [
  "legalName",
  "tradingName",
  "tradeRegistrationNumber",
  "taxIdentificationNumber",
  "vatRegistrationNumber",
  "phone",
  "email",
  "region",
  "city",
  "addressLine",
  "notes",
] as const;

/** The documented fields only, trimmed, with empty optional ones left out. */
export function companyPayload(input: unknown): Partial<CreateCompanyPayload> {
  const source = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const out: Record<string, unknown> = {};
  for (const key of TEXT_FIELDS) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) out[key] = value.trim().slice(0, 500);
  }
  if (typeof source.institutionSubtype === "string" && SUBTYPES.includes(source.institutionSubtype as InstitutionSubtype)) {
    out.institutionSubtype = source.institutionSubtype;
  }
  out.authorityToActDocumentRequired = source.authorityToActDocumentRequired === true;
  return out as Partial<CreateCompanyPayload>;
}
