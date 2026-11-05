"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  isPasswordFormValid,
  PasswordForm,
} from "@/components/registration/password-form";
import { InlineAlert } from "@/components/dashboard/inline-alert";
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
  successHref: string;
};

type Registered = { id: string; name: string | null; bin: string | null };

/**
 * The record already exists at this step, so there is no "Back": going back
 * to the form would register the household a second time. The way out is the
 * household's profile, which offers this step again while the tab is open.
 */
export function SetPasswordStep({
  registrationType,
  steps,
  currentStep,
  successHref,
}: SetPasswordStepProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [branchName, setBranchName] = useState<string | null>(null);
  const [registered, setRegistered] = useState<Registered | null>(null);

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
    // Registration state lives in sessionStorage, readable only after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBranchName(session.branchName);
    setRegistered(
      session.entityId
        ? { id: session.entityId, name: session.fullName?.trim() || null, bin: session.bin ?? null }
        : null,
    );
    setSessionChecked(true);
  }, [registrationType, router]);

  const profileHref = registered ? `/dashboard/beneficiary/${encodeURIComponent(registered.id)}` : null;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!isPasswordFormValid(password, confirmPassword)) {
      setError("Fix the password problems listed under the form.");
      return;
    }

    const session = getRegistrationSession();
    if (!session?.passwordSetupToken) {
      setError("This page has expired. Open the household's profile to check the registration.");
      return;
    }

    setIsSubmitting(true);

    try {
      await registerApiJson<null>("/bff/register/set-password", {
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
        router.replace(`/login?redirect=${encodeURIComponent(profileHref ?? "/dashboard/beneficiary")}`);
        return;
      }

      setError(
        submitError instanceof ApiError
          ? submitError.message
          : "The password wasn't saved. Try again.",
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
      description="Create a password so the household can sign in."
      branchName={branchName}
      steps={steps}
      currentStep={currentStep}
      error={error}
      footer={
        <div className="flex flex-wrap justify-between gap-3">
          {profileHref ? (
            <Button
              variant="outline"
              asChild
              className={isSubmitting ? "pointer-events-none opacity-50" : undefined}
            >
              <Link href={profileHref}>Open the household&apos;s profile</Link>
            </Button>
          ) : (
            <span />
          )}
          <Button type="submit" form="set-password-form" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Save password"}
          </Button>
        </div>
      }
    >
      {registered ? (
        <InlineAlert
          tone="success"
          className="mb-5"
          title={`${registered.name ?? "The household"} is registered${registered.bin ? ` (BIN ${registered.bin})` : ""}.`}
        >
          Don&apos;t register them again. To set the password later, open their profile: it offers this step
          until you close this browser tab.
        </InlineAlert>
      ) : null}
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
