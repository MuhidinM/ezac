import type { HouseholdSummary } from "@/lib/api/backoffice-types";

const LABELS: Record<string, string> = {
  totalMembers: "Members",
  childrenCount: "Children",
  olderPersonsCount: "Older persons",
  workingAgeCount: "Working age",
  disabledCount: "With disability",
  chronicallyIllCount: "Chronically ill",
  pregnantLactatingCount: "Pregnant / lactating",
  schoolAgeChildrenCount: "School-age children",
  dependentsCount: "Dependents",
  dependencyRatio: "Dependency ratio",
};

function humanize(key: string) {
  const label = LABELS[key];
  if (label) return label;
  return key
    .replace(/Count$/, "")
    .replace(/([A-Z])/g, " $1")
    .replace(/^\w/, (char) => char.toUpperCase());
}

/** Read-only, backend-calculated household counts. */
export function HouseholdSummaryGrid({ summary }: { summary?: HouseholdSummary | null }) {
  const entries = Object.entries(summary ?? {}).filter(
    ([, value]) => typeof value === "number",
  );

  if (entries.length === 0) {
    return <p className="text-sm text-black/45">Save this step to see the household summary.</p>;
  }

  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-black/[0.06] bg-black/[0.06] sm:grid-cols-4">
      {entries.map(([key, value]) => (
        <div key={key} className="bg-white px-4 py-3">
          <dt className="text-xs text-black/50">{humanize(key)}</dt>
          <dd className="mt-0.5 text-lg font-semibold text-[#001539] tabular-nums">
            {Number.isInteger(value) ? value : (value as number).toFixed(2)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function summaryCount(summary: HouseholdSummary | null | undefined, key: string) {
  const value = summary?.[key];
  return typeof value === "number" ? value : 0;
}
