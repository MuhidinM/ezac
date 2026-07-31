"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, UserRound } from "lucide-react";

import { RegistrationShell } from "@/components/registration/registration-shell";
import { Button } from "@/components/ui/button";
import {
  beginRegistration,
  getSelectedBranch,
} from "@/lib/registration/session";
import type { RegistrationType } from "@/lib/registration/types";
import { cn } from "@/lib/utils";

export function WelcomeStep() {
  const router = useRouter();
  const [branchName, setBranchName] = useState<string | null>(null);

  useEffect(() => {
    const branch = getSelectedBranch();
    if (!branch) {
      router.replace("/dashboard/register");
      return;
    }
    setBranchName(branch.branchName);
  }, [router]);

  function onContinue(type: RegistrationType) {
    try {
      beginRegistration(type);
    } catch {
      router.replace("/dashboard/register");
      return;
    }

    router.push(
      type === "manual"
        ? "/dashboard/register/manual"
        : "/dashboard/register/institution",
    );
  }

  if (!branchName) {
    return (
      <RegistrationShell
        title="Register beneficiary"
        description="Checking branch selection..."
      >
        <p className="text-sm text-black/55">Loading...</p>
      </RegistrationShell>
    );
  }

  return (
    <RegistrationShell
      title="Register beneficiary"
      description="Choose how you want to register a new beneficiary account."
      branchName={branchName}
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
          <p className="mt-3 font-medium text-[#001539]">Manual registration</p>
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
          <p className="mt-3 font-medium text-[#001539]">Institution</p>
          <p className="mt-1 text-sm text-black/60">
            Register an organization and upload required KYC documents.
          </p>
        </button>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Button variant="outline" asChild>
          <a href="/dashboard/register">Change branch</a>
        </Button>
        <Button variant="outline" asChild>
          <a href="/dashboard/beneficiary">Cancel</a>
        </Button>
      </div>
    </RegistrationShell>
  );
}
