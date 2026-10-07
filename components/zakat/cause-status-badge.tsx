import { Badge } from "@/components/ui/badge";
import type { CauseStatus } from "@/lib/zakat/content";

export function CauseStatusBadge({ status, ended }: { status: CauseStatus; ended?: boolean }) {
  if (status === "ACTIVE" && ended) return <Badge tone="neutral">Ended</Badge>;
  if (status === "ACTIVE") return <Badge tone="success">Active</Badge>;
  if (status === "CLOSED") return <Badge tone="neutral">Closed</Badge>;
  return <Badge tone="warning">Draft</Badge>;
}
