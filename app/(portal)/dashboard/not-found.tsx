import Link from "next/link";
import { SearchX } from "lucide-react";

import { PortalErrorState } from "@/components/errors/portal-error-state";
import { Button } from "@/components/ui/button";

/** Portal 404: keeps the dashboard layout so staff can carry on from the sidebar. */
export default function DashboardNotFound() {
  return (
    <PortalErrorState
      icon={SearchX}
      title="We couldn't find that page"
      actions={
        <Button asChild>
          <Link href="/dashboard">Go to the dashboard</Link>
        </Button>
      }
    >
      <p>The link may be wrong, or the record may have been moved or removed.</p>
    </PortalErrorState>
  );
}
