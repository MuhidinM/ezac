"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Building2, UserRound, type LucideIcon } from "lucide-react";

import { RegistrationShell } from "@/components/registration/registration-shell";
import { Button } from "@/components/ui/button";
import {
  beginRegistration,
  getSelectedBranch,
} from "@/lib/registration/session";
import type { RegistrationType } from "@/lib/registration/types";

const OPTIONS: {
  type: RegistrationType;
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
}[] = [
  {
    type: "manual",
    title: "Individual",
    description: "A person or household head. The household assessment follows once they're registered.",
    icon: UserRound,
    href: "/dashboard/register/manual",
  },
  {
    type: "institution",
    title: "Institution",
    description: "An NGO or organisation applying for cash aid, with KYC documents.",
    icon: Building2,
    href: "/dashboard/register/institution",
  },
];

export function WelcomeStep() {
  const router = useRouter();
  const [branchName, setBranchName] = useState<string | null>(null);

  useEffect(() => {
    const branch = getSelectedBranch();
    if (!branch) {
      router.replace("/dashboard/register");
      return;
    }
    // Branch lives in sessionStorage, so it can only be read after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBranchName(branch.branchName);
  }, [router]);

  function onContinue(type: RegistrationType, href: string) {
    try {
      beginRegistration(type);
    } catch {
      router.replace("/dashboard/register");
      return;
    }
    router.push(href);
  }

  return (
    <RegistrationShell
      title="Register beneficiary"
      description="Choose what kind of beneficiary you're registering."
      branchName={branchName}
      wide
    >
      {!branchName ? (
        <div className="h-32 animate-pulse rounded-lg bg-black/[0.04]" />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {OPTIONS.map((option) => (
              <button
                key={option.type}
                type="button"
                onClick={() => onContinue(option.type, option.href)}
                className="group flex items-start gap-4 rounded-xl border border-black/[0.08] bg-white p-5 text-left transition hover:border-[#007050]/40 hover:shadow-sm"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-[#007050]/[0.08] text-[#007050]">
                  <option.icon className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-[#001539]">{option.title}</span>
                  <span className="mt-1 block text-sm text-black/55">{option.description}</span>
                </span>
                <ArrowRight className="mt-1 size-4 text-black/30 transition group-hover:translate-x-0.5 group-hover:text-[#007050]" />
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 border-t border-black/[0.06] pt-5">
            <Button variant="outline" asChild>
              <Link href="/dashboard/register">Change branch</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/dashboard/beneficiary">Cancel</Link>
            </Button>
          </div>
        </div>
      )}
    </RegistrationShell>
  );
}
