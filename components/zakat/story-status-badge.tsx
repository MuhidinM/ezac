import { Badge } from "@/components/ui/badge";
import type { StoryStatus } from "@/lib/zakat/content";

export function StoryStatusBadge({ status }: { status: StoryStatus }) {
  if (status === "PUBLISHED") return <Badge tone="success">Published</Badge>;
  if (status === "ARCHIVED") return <Badge tone="neutral">Archived</Badge>;
  return <Badge tone="warning">Draft</Badge>;
}
