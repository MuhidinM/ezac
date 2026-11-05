import Link from "next/link";

import { InlineAlert } from "@/components/dashboard/inline-alert";
import { RegistrationShell } from "@/components/registration/registration-shell";
import { Button } from "@/components/ui/button";

/**
 * Shown instead of the institution (NGO) wizard and its later steps. The
 * wizard doesn't send applications to the backend yet: it would show a
 * reference number for an application that was never saved. The wizard code
 * stays in components/ngo-registration for when the backend is wired up;
 * restore each page's original component then, and the "Institution" option
 * in components/registration/welcome-step.tsx.
 */
export function InstitutionRegistrationUnavailable() {
  return (
    <RegistrationShell title="Register an institution">
      <InlineAlert tone="info" title="Institution registration isn't available yet.">
        Applications from NGOs and other organisations can&apos;t be saved from here yet. You can still register
        individuals and households.
      </InlineAlert>
      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <Link href="/dashboard/register">Register an individual</Link>
        </Button>
        <Button variant="ghost" asChild>
          <Link href="/dashboard/beneficiary">Back to beneficiaries</Link>
        </Button>
      </div>
    </RegistrationShell>
  );
}
