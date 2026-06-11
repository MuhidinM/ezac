import type { VerificationStatus } from "@/lib/api/types";
import { formatVerificationStatus } from "@/lib/beneficiary/format";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<VerificationStatus, string> = {
  pending: "bg-amber-50 text-amber-800 border-amber-200",
  pending_third_party: "bg-sky-50 text-sky-800 border-sky-200",
  verified: "bg-emerald-50 text-emerald-800 border-emerald-200",
  rejected: "bg-rose-50 text-rose-800 border-rose-200",
};

type VerificationStatusBadgeProps = {
  status: VerificationStatus;
};

export function VerificationStatusBadge({ status }: VerificationStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium",
        STATUS_STYLES[status],
      )}
    >
      {formatVerificationStatus(status)}
    </span>
  );
}
