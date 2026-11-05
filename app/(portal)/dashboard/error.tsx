"use client"; // Error boundaries must be Client Components.

import Link from "next/link";
import { TriangleAlert } from "lucide-react";

import { PortalErrorState } from "@/components/errors/portal-error-state";
import { useLoggedError } from "@/components/errors/use-logged-error";
import { Button } from "@/components/ui/button";

/**
 * Catches render errors in any portal page. The dashboard layout (sidebar and
 * header) stays in place, so staff can move on to another page.
 */
export default function DashboardError({ error, retry }: { error: unknown; retry: () => void }) {
  const reference = useLoggedError("dashboard", error);

  return (
    <PortalErrorState
      icon={TriangleAlert}
      title="This page didn't load"
      reference={reference}
      actions={
        <>
          {/* retry() fetches the page again, so it also recovers from a brief outage. */}
          <Button onClick={() => retry()}>Try again</Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard">Go to the dashboard</Link>
          </Button>
        </>
      }
    >
      <p>Something went wrong on our side. Try again in a moment.</p>
      {reference ? <p>If it keeps happening, tell your system administrator and give them the reference below.</p> : null}
    </PortalErrorState>
  );
}
