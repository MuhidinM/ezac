"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  isPasswordFormValid,
  PasswordForm,
} from "@/components/registration/password-form";
import { RegistrationShell } from "@/components/registration/registration-shell";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/errors";
import { registerApiJson } from "@/lib/registration/api";
import {
  clearRegistrationSession,
  getRegistrationSession,
  setRegistrationSuccessFlag,
} from "@/lib/registration/session";
import type { RegistrationType } from "@/lib/registration/types";

type SetPasswordStepProps = {
  registrationType: RegistrationType;
  steps: string[];
  currentStep: number;
  backHref: string;
  successHref: string;
};

export function SetPasswordStep({
  registrationType,
  steps,
  currentStep,
  backHref,
  successHref,
}: SetPasswordStepProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [branchName, setBranchName] = useState<string | null>(null);

  useEffect(() => {
    const session = getRegistrationSession();
    if (
      !session ||
      !session.branchId ||
      session.registrationType !== registrationType ||
      !session.passwordSetupToken
    ) {
      router.replace("/dashboard/register");
      return;
    }
    setBranchName(session.branchName);
    setSessionChecked(true);
  }, [registrationType, router]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!isPasswordFormValid(password, confirmPassword)) {
      setError("Please fix password validation errors.");
      return;
    }

    const session = getRegistrationSession();
    if (!session?.passwordSetupToken) {
      setError("Registration session expired. Please start again.");
      return;
    }

    setIsSubmitting(true);

    try {
      await registerApiJson<null>("/api/register/set-password", {
        method: "POST",
        headers: {
          "X-Password-Setup-Token": session.passwordSetupToken,
        },
        body: JSON.stringify({ password, confirmPassword }),
      });

      if (registrationType === "manual") {
        clearRegistrationSession();
        setRegistrationSuccessFlag();
        router.push("/dashboard/beneficiary");
        return;
      }

      router.push(successHref);
    } catch (submitError) {
      if (submitError instanceof ApiError && submitError.status === 401) {
        router.replace(`/login?redirect=${encodeURIComponent(backHref)}`);
        return;
      }

      setError(
        submitError instanceof ApiError
          ? submitError.message
          : "Unable to set password. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!sessionChecked) {
    return (
      <RegistrationShell title="Set password" description="Loading...">
        <p className="text-sm text-black/60">Checking registration session...</p>
      </RegistrationShell>
    );
  }

  return (
    <RegistrationShell
      title="Set password"
      description="Create a password for the new beneficiary account."
      branchName={branchName}
      steps={steps}
      currentStep={currentStep}
      error={error}
      footer={
        <div className="flex justify-between gap-3">
          <Button
            variant="outline"
            asChild
            className={isSubmitting ? "pointer-events-none opacity-50" : undefined}
          >
            <a href={backHref}>Back</a>
          </Button>
          <Button type="submit" form="set-password-form" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Continue"}
          </Button>
        </div>
      }
    >
      <form id="set-password-form" onSubmit={onSubmit}>
        <PasswordForm
          password={password}
          confirmPassword={confirmPassword}
          onPasswordChange={setPassword}
          onConfirmPasswordChange={setConfirmPassword}
          disabled={isSubmitting}
        />
      </form>
    </RegistrationShell>
  );
}
