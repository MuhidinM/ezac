import { generateId } from "@/lib/utils";

import type {
  AidTypeKey,
  CoverageArea,
  FundingSourceEntry,
  NgoRegistrationState,
  ProgramDetail,
} from "./types";

export const DOCUMENTS_TO_ATTACH = [
  "registrationCertificate",
  "operatingLicense",
  "boardResolution",
  "annualReport",
  "bankVerification",
  "other",
] as const;

export const DOCUMENT_LABELS: Record<(typeof DOCUMENTS_TO_ATTACH)[number], string> = {
  registrationCertificate: "Organization Registration Certificate",
  operatingLicense: "Current Operating License",
  boardResolution: "Board Resolution / Authorization Letter",
  annualReport: "Previous Annual Report",
  bankVerification: "Bank Account Verification Letter",
  other: "Other",
};

export const AID_TYPES: AidTypeKey[] = [
  "cash",
  "food",
  "medical",
  "education",
  "housing",
  "livelihood",
  "psychosocial",
  "emergency",
  "other",
];

export const AID_TYPE_LABELS: Record<AidTypeKey, string> = {
  cash: "Cash / Financial assistance",
  food: "Food packages / in-kind food",
  medical: "Medical support (medicines, hospital fees)",
  education: "Education support (school fees, supplies)",
  housing: "Housing / shelter assistance",
  livelihood: "Livelihood / income-generating support",
  psychosocial: "Psychosocial support / counseling",
  emergency: "Emergency relief",
  other: "Other",
};

export const DISTRIBUTION_METHODS = [
  "directCash",
  "bankTransfer",
  "physicalDistribution",
  "homeDelivery",
  "partnerMosques",
  "volunteers",
  "other",
] as const;

export const DISTRIBUTION_LABELS: Record<(typeof DISTRIBUTION_METHODS)[number], string> = {
  directCash: "Direct cash transfer",
  bankTransfer: "Bank transfer / mobile money",
  physicalDistribution: "Physical distribution at office",
  homeDelivery: "Home delivery",
  partnerMosques: "Through partner mosques",
  volunteers: "Through volunteers",
  other: "Other",
};

export const FUNDING_SOURCE_KEYS = [
  "localDonors",
  "diasporaDonors",
  "corporate",
  "governmentGrants",
  "internationalNgo",
  "mosqueCollections",
  "zakatSadaqah",
  "waqfIncome",
  "ownIncome",
  "other",
] as const;

export const FUNDING_SOURCE_LABELS: Record<(typeof FUNDING_SOURCE_KEYS)[number], string> = {
  localDonors: "Individual donors (local)",
  diasporaDonors: "Individual donors (diaspora / international)",
  corporate: "Corporate donations",
  governmentGrants: "Government grants",
  internationalNgo: "International NGO / donor funding",
  mosqueCollections: "Mosque collections / Friday donations",
  zakatSadaqah: "Zakat / Sadaqah pooled funds",
  waqfIncome: "Waqf income",
  ownIncome: "Own income-generating activities",
  other: "Other",
};

export const SHARIAH_DECLARATIONS = [
  "islamicPrinciples",
  "asnafCategories",
  "noRiba",
  "shariahAdvisor",
  "zakatExclusive",
  "separateAccounting",
  "noDiscrimination",
  "transparency",
] as const;

export const SHARIAH_DECLARATION_LABELS: Record<
  (typeof SHARIAH_DECLARATIONS)[number],
  string
> = {
  islamicPrinciples: "Our operations are guided by Islamic principles",
  asnafCategories: "Aid distribution follows Zakat eligibility (Asnaf) categories",
  noRiba: "We do not engage in Riba (interest-based financial activities)",
  shariahAdvisor: "We have a Shariah advisor or committee that reviews our programs",
  zakatExclusive: "Funds received as Zakat are used exclusively for Zakat-eligible purposes",
  separateAccounting: "We maintain separate accounting for Zakat and Sadaqah funds",
  noDiscrimination: "We do not discriminate in aid delivery based on ethnicity or sect",
  transparency: "We are transparent with donors about how their funds are used",
};

function createCoverageArea(): CoverageArea {
  return {
    id: generateId(),
    region: "",
    zone: "",
    woreda: "",
    urbanRural: "",
  };
}

function createFundingSource(sourceKey: string): FundingSourceEntry {
  return {
    id: generateId(),
    sourceKey,
    description: "",
    annualAmount: "",
    confirmed: "",
  };
}

function falseRecord<T extends readonly string[]>(keys: T): Record<T[number], boolean> {
  return Object.fromEntries(keys.map((k) => [k, false])) as Record<T[number], boolean>;
}

function emptyProgram(): ProgramDetail {
  return {
    name: "",
    beneficiariesReached: "",
    frequency: "",
    avgValuePerBeneficiary: "",
  };
}

export function createInitialState(): NgoRegistrationState {
  const aidTypes = Object.fromEntries(AID_TYPES.map((k) => [k, false])) as Record<
    AidTypeKey,
    boolean
  >;

  return {
    step1: {
      orgName: "",
      shortName: "",
      orgType: "",
      orgTypeOther: "",
      yearEstablished: "",
      registrationNumber: "",
      registeredWith: "",
      registeredWithOther: "",
      licenseExpiryDate: "",
      tin: "",
      contactName: "",
      contactTitle: "",
      contactPhone: "",
      contactEmail: "",
      contactNationalId: "",
      region: "",
      zone: "",
      woreda: "",
      kebele: "",
      fullAddress: "",
      documentsToAttach: falseRecord(DOCUMENTS_TO_ATTACH),
    },
    step2: {
      regionsCount: "",
      woredasCount: "",
      kebelesCount: "",
      coverageAreas: [createCoverageArea()],
      beneficiaryStats: {
        totalRegistered: "",
        activeReceiving: "",
        female: "",
        children: "",
        elderly: "",
        disability: "",
        orphans: "",
        widows: "",
        idp: "",
      },
      selectionMethod: "",
      selectionMethodOther: "",
    },
    step3: {
      aidTypes,
      aidTypeOther: "",
      programs: {},
      distributionMethods: falseRecord(DISTRIBUTION_METHODS),
      monitoring: {
        followUpVisits: "",
        beneficiaryFeedback: "",
        complaintsMechanism: "",
        writtenReports: "",
      },
    },
    step4: {
      totalBudget: "",
      securedBudget: "",
      fundingSources: [],
      fundingSourceFlags: falseRecord(FUNDING_SOURCE_KEYS),
      fundingSourceOther: "",
      previousDonorAid: {
        received: "",
        donorName: "",
        year: "",
        amount: "",
        purpose: "",
        reportingOnTime: "",
      },
      requestedAmount: "",
      intendedUse: "",
      timeline: "",
      bankName: "",
      accountName: "",
      accountNumber: "",
      branch: "",
    },
    step5: {
      shariahDeclarations: falseRecord(SHARIAH_DECLARATIONS),
      shariahAdvisorName: "",
      shariahContact: "",
      declarationAgreed: false,
      applicantName: "",
      applicantTitle: "",
      applicantDate: new Date().toISOString().slice(0, 10),
      reviewerScores: {
        legal: "",
        reach: "",
        programs: "",
        financialNeed: "",
        shariah: "",
        accountability: "",
      },
      decisionOverride: "",
      overrideReason: "",
      reviewerName: "",
      reviewerTitle: "",
      reviewerDate: new Date().toISOString().slice(0, 10),
      supervisorName: "",
      supervisorDate: "",
    },
  };
}

export { createCoverageArea, createFundingSource, emptyProgram };
