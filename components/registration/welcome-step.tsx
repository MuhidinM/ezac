"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, UserRound, type LucideIcon } from "lucide-react";

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
  // While "Individual" is the only option, the branch step skips this page
  // (FIRST_DETAILS_STEP in lib/registration/constants.ts); point it back here
  // when a second option returns.
  // "Institution" is hidden until the NGO wizard (components/ngo-registration)
  // submits to the backend: today it only logs the application in the browser
  // and shows a made-up reference number, so the application is lost. Restore
  // the option (type "institution", href "/dashboard/register/institution")
  // together with the pages under app/dashboard/register/institution.
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
                className="group flex items-start gap-4 rounded-xl border border-black/[0.08] bg-white p-5 text-left transition hover:border-brand/40 hover:shadow-sm"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-brand/[0.08] text-brand">
                  <option.icon className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-navy">{option.title}</span>
                  <span className="mt-1 block text-sm text-black/60">{option.description}</span>
                </span>
                <ArrowRight className="mt-1 size-4 text-black/30 transition group-hover:translate-x-0.5 group-hover:text-brand" />
              </button>
            ))}
          </div>

          <p className="text-sm text-black/60">
            Institutions (NGOs and organisations) can&apos;t be registered here yet.
          </p>

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
