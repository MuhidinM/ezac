/**
 * Fixed option keys from the means-testing API (FRONTEND-API-GUIDE §9) with
 * their English labels. Keys never change; labels are ours to translate.
 */

export type Option = { value: string; label: string };

function options(entries: Record<string, string>): Option[] {
  return Object.entries(entries).map(([value, label]) => ({ value, label }));
}

export const ASNAF = options({
  poor: "Poor (Faqir)",
  needy: "Needy (Miskin)",
  zakat_administrator: "Zakat administrator (Amil)",
  muallaf: "Muallaf",
  freeing_captives: "Freeing captives (Riqab)",
  debtor: "Debtor (Gharim)",
  fi_sabilillah: "Fi sabilillah",
  stranded_traveler: "Stranded traveller (Ibn sabil)",
  other: "Other",
});

export const SEX = options({ male: "Male", female: "Female" });

export const RELATIONSHIP = options({
  self: "Applicant (self)",
  spouse: "Spouse",
  child: "Child",
  parent: "Parent",
  sibling: "Sibling",
  grandchild: "Grandchild",
  grandparent: "Grandparent",
  other_relative: "Other relative",
  non_relative: "Non-relative",
});

export const MARITAL_STATUS = options({
  single: "Single",
  married: "Married",
  widowed: "Widowed",
  divorced: "Divorced",
  separated: "Separated",
});

export const PRIMARY_LANGUAGE = options({
  amharic: "Amharic",
  afaan_oromo: "Afaan Oromo",
  tigrinya: "Tigrinya",
  somali: "Somali",
  afar: "Afar",
  other: "Other",
});

export const ASSETS = options({
  house: "House",
  agricultural_land: "Agricultural land",
  business_premises: "Business premises",
  livestock: "Livestock",
  vehicle: "Vehicle",
  motorcycle: "Motorcycle",
  cart: "Cart",
  television: "Television",
  refrigerator: "Refrigerator",
  computer: "Computer",
  mobile_phone: "Mobile phone",
  savings: "Savings",
  other: "Other",
});

export const TENURE = options({
  owned: "Owned",
  rented: "Rented",
  borrowed: "Borrowed",
  temporary_shelter: "Temporary shelter",
});

export const ROOF_TYPE = options({
  iron_sheet: "Iron sheet",
  thatch: "Thatch",
  plastic: "Plastic",
  other: "Other",
});

export const WALL_TYPE = options({
  concrete: "Concrete",
  wood: "Wood",
  mud: "Mud",
  other: "Other",
});

export const FLOOR_TYPE = options({ cement: "Cement", earth: "Earth", tile: "Tile" });

export const WATER_SOURCE = options({
  piped: "Piped",
  protected_well: "Protected well",
  unprotected_well: "Unprotected well",
  river: "River",
  other: "Other",
});

export const TOILET_TYPE = options({
  flush: "Flush toilet",
  pit_latrine: "Pit latrine",
  none: "None",
});

export const ELECTRICITY_SOURCE = options({
  grid: "Grid",
  solar: "Solar",
  generator: "Generator",
  none: "None",
});

export const COOKING_FUEL = options({
  electricity: "Electricity",
  gas: "Gas",
  charcoal: "Charcoal",
  firewood: "Firewood",
  other: "Other",
});

export const MEALS_PER_DAY = options({
  one: "One",
  two: "Two",
  three_or_more: "Three or more",
});

export const SCHOOL_ATTENDANCE = options({
  all: "All children attend",
  some: "Some attend",
  none: "None attend",
  not_applicable: "Not applicable",
});

export const NON_ATTENDANCE_REASONS = options({
  poverty: "Poverty",
  disability: "Disability",
  distance: "Distance",
  other: "Other",
});

export const DEBT_PURPOSES = options({
  medical: "Medical",
  food: "Food",
  business: "Business",
  education: "Education",
  housing: "Housing",
  other: "Other",
});

export const VULNERABILITIES = options({
  widow: "Widow",
  orphan: "Orphan",
  disability: "Disability",
  elderly_living_alone: "Elderly living alone",
  child_headed_household: "Child-headed household",
  refugee: "Refugee",
  internally_displaced: "Internally displaced",
  disaster_affected: "Disaster affected",
  chronic_illness: "Chronic illness",
  female_headed_household: "Female-headed household",
  no_stable_employment: "No stable employment",
});

export const VERIFIED_DOCUMENTS = options({
  national_id: "National ID",
  medical_report: "Medical report",
  disability_certificate: "Disability certificate",
  debt_documents: "Debt documents",
  school_certificate: "School certificate",
  other: "Other",
});

export const DOCUMENT_TYPES = [
  ...VERIFIED_DOCUMENTS,
  ...options({
    photo: "Photo",
    home_visit_report: "Home visit report",
    community_verification_form: "Community verification form",
  }),
];

export const OFFICER_RECOMMENDATION = options({
  approve: "Approve",
  conditional_approval: "Conditional approval",
  defer: "Defer",
  reject: "Reject",
});

export const COMMITTEE_DECISION = options({
  APPROVED: "Approve",
  CONDITIONALLY_APPROVED: "Conditionally approve",
  DEFERRED: "Defer",
  REJECTED: "Reject",
});

/** Label for a key in a list, falling back to a readable version of the key. */
export function labelFor(list: Option[], value: string | null | undefined): string {
  if (!value) return "—";
  return (
    list.find((option) => option.value === value)?.label ??
    value.replaceAll("_", " ").replace(/^\w/, (char) => char.toUpperCase())
  );
}
