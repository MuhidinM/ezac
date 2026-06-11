import type { VerificationStatus } from "@/lib/api/types";

const VERIFICATION_LABELS: Record<VerificationStatus, string> = {
  pending: "Pending review",
  pending_third_party: "Fayda in progress",
  verified: "Verified",
  rejected: "Rejected",
};

const CATEGORY_LABELS: Record<string, string> = {
  poor: "Poor",
  needy: "Needy",
  zakat_administrator: "Zakat administrator",
  muallaf: "Muallaf",
  freeing_captives: "Freeing captives",
  debtor: "Debtor",
  fi_sabilillah: "Fi sabilillah",
  stranded_traveler: "Stranded traveler",
};

export function formatVerificationStatus(status: VerificationStatus): string {
  return VERIFICATION_LABELS[status] ?? status;
}

export function formatBeneficiaryCategory(category: string | null): string {
  if (!category) return "—";
  return CATEGORY_LABELS[category] ?? category.replaceAll("_", " ");
}

export function formatDateTime(value: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-ET", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatAddress(parts: {
  region?: string | null;
  city?: string | null;
  addressLine?: string | null;
}): string {
  const values = [parts.addressLine, parts.city, parts.region].filter(Boolean);
  return values.length > 0 ? values.join(", ") : "—";
}
