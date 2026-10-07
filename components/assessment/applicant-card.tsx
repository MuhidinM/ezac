import { Pencil, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { AssessmentApplicant } from "@/lib/api/backoffice-types";
import { MARITAL_STATUS, PRIMARY_LANGUAGE, SEX, labelFor } from "@/lib/backoffice/options";
import { formatDate } from "@/lib/backoffice/format";

/** Section B, read-only at the top of every step. */
export function ApplicantCard({
  applicant,
  onEdit,
  missingCount = 0,
}: {
  applicant?: AssessmentApplicant | null;
  onEdit?: () => void;
  missingCount?: number;
}) {
  const a = applicant ?? {};
  const language =
    a.primaryLanguage === "other" ? a.primaryLanguageOther : a.primaryLanguage ? labelFor(PRIMARY_LANGUAGE, a.primaryLanguage) : null;
  const age = a.dateOfBirth ? formatDate(a.dateOfBirth) : a.estimatedAge != null ? `≈ ${a.estimatedAge} yrs` : null;

  const items = [
    { label: "BIN", value: a.bin },
    { label: "Phone", value: a.phone },
    {
      label: "Bank account",
      value: a.bankAccount?.accountNumber
        ? `${a.bankAccount.bankName ?? a.bankAccount.bankCode ?? ""} · ${a.bankAccount.accountNumber}`
        : null,
    },
    { label: "Sex", value: a.gender ? labelFor(SEX, a.gender) : null },
    { label: "Born", value: age },
    { label: "Marital status", value: a.maritalStatus ? labelFor(MARITAL_STATUS, a.maritalStatus) : null },
    { label: "Religion", value: a.religion },
    { label: "Language", value: language },
    { label: "Location", value: [a.kebele, a.woreda, a.zone, a.region].filter(Boolean).join(", ") || null },
  ];

  return (
    <section className="rounded-xl border border-black/[0.06] bg-white shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/[0.06] px-5 py-3">
        <div className="flex items-center gap-3">
          <span className="flex size-7 items-center justify-center rounded-md bg-[#007050] text-xs font-semibold text-white">
            B
          </span>
          <div>
            <p className="text-sm font-semibold text-[#001539]">{a.fullName ?? "Applicant"}</p>
            <p className="text-xs text-black/50">Basic details</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {missingCount > 0 ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700">
              <TriangleAlert className="size-3.5" />
              {missingCount} missing
            </span>
          ) : null}
          {onEdit ? (
            <Button type="button" variant="ghost" size="sm" onClick={onEdit}>
              <Pencil />
              Edit
            </Button>
          ) : null}
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 px-5 py-4 sm:grid-cols-3 lg:grid-cols-5">
        {items.map((item) => (
          <div key={item.label} className="min-w-0">
            <dt className="text-[11px] font-medium text-black/45">{item.label}</dt>
            <dd className="truncate text-sm text-[#001539]">{item.value || "—"}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
