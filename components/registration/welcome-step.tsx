"use client";

import { useRouter } from "next/navigation";
import { Building2, UserRound } from "lucide-react";

import { RegistrationShell } from "@/components/registration/registration-shell";
import { Button } from "@/components/ui/button";
import { clearRegistrationSession } from "@/lib/registration/session";
import { cn } from "@/lib/utils";

type RegistrationChoice = "manual" | "institution";

export function WelcomeStep() {
  const router = useRouter();

  function onContinue(type: RegistrationChoice) {
    clearRegistrationSession();
    router.push(
      type === "manual"
        ? "/dashboard/register/manual"
        : "/dashboard/register/institution",
    );
  }

  return (
    <RegistrationShell
      title="Register beneficiary"
      description="Choose how you want to register a new beneficiary account."
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onContinue("manual")}
          className={cn(
            "rounded-xl border border-black/10 p-4 text-left transition hover:border-black/25 hover:bg-black/[0.02]",
          )}
        >
          <UserRound className="h-5 w-5 text-black/70" />
          <p className="mt-3 font-medium text-black">Manual registration</p>
          <p className="mt-1 text-sm text-black/60">
            Register an individual beneficiary with identity details.
          </p>
        </button>

        <button
          type="button"
          onClick={() => onContinue("institution")}
          className={cn(
            "rounded-xl border border-black/10 p-4 text-left transition hover:border-black/25 hover:bg-black/[0.02]",
          )}
        >
          <Building2 className="h-5 w-5 text-black/70" />
          <p className="mt-3 font-medium text-black">Institution</p>
          <p className="mt-1 text-sm text-black/60">
            Register an organization and upload required KYC documents.
          </p>
        </button>
      </div>

      <div className="mt-6">
        <Button variant="outline" asChild>
          <a href="/dashboard/beneficiary">Cancel</a>
        </Button>
      </div>
    </RegistrationShell>
  );
}
