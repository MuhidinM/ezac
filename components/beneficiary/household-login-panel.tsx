"use client";

import { useState } from "react";
import { KeyRound, Phone, UserPlus } from "lucide-react";

import { CredentialsOnceDialog } from "@/components/branches/credentials-once-dialog";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { FormField } from "@/components/dashboard/form-field";
import { InlineAlert } from "@/components/dashboard/inline-alert";
import { Panel } from "@/components/dashboard/panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api/client";
import { householdLoginErrorMessage } from "@/lib/beneficiary/household-actions";
import type { HouseholdCredentials, HouseholdDetail } from "@/lib/beneficiary/types";
import { isValidEthiopianPhone, normalizePhoneToE164 } from "@/lib/registration/phone";

type Action = "create" | "reset" | "phone";

/** Rethrow with plain words for the known refusals; ConfirmDialog shows the message. */
function explain(error: unknown): never {
  const message = householdLoginErrorMessage(error);
  throw message ? new Error(message) : error;
}

/**
 * The household's app login: create it (households registered without one),
 * reset its password, or correct its login phone. ADMIN, and BRANCH for its
 * own households. The detail does not say whether a login exists, so both
 * create and reset are offered and the backend's 409 says which applies.
 */
export function HouseholdLoginPanel({
  household,
  onChanged,
}: {
  household: HouseholdDetail;
  onChanged: (updated: HouseholdDetail) => void;
}) {
  const base = `/bff/backoffice/beneficiaries/${encodeURIComponent(household.id)}`;
  const [action, setAction] = useState<Action | null>(null);
  const [credentials, setCredentials] = useState<HouseholdCredentials | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [reason, setReason] = useState("");
  const phoneProblem = phone.trim() && !isValidEthiopianPhone(phone) ? "Enter an Ethiopian mobile number, for example 0911 234 567." : null;

  function open(next: Action) {
    setNotice(null);
    setPhone("");
    setReason("");
    setAction(next);
  }

  async function createLogin() {
    const result = await apiClient<HouseholdCredentials>(`${base}/create-login`, { method: "POST" }).catch(explain);
    setCredentials(result);
  }

  async function resetPassword() {
    const result = await apiClient<HouseholdCredentials>(`${base}/reset-password`, { method: "POST" }).catch(explain);
    setCredentials(result);
  }

  async function changePhone() {
    const updated = await apiClient<HouseholdDetail>(`${base}/login-phone`, {
      method: "POST",
      body: JSON.stringify({ phone: normalizePhoneToE164(phone), reason: reason.trim() }),
    }).catch(explain);
    if (updated) onChanged(updated);
    setNotice("Login phone changed. The household was signed out and signs in with the new number.");
  }

  return (
    <Panel
      title="App login"
      description="The household signs in to the app with its phone number."
    >
      <div className="space-y-3">
        {notice ? <InlineAlert tone="success">{notice}</InlineAlert> : null}
        <p className="text-sm text-black/60">
          Login phone: <span className="text-navy tabular-nums">{household.phone ?? "none"}</span>
        </p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => open("create")}>
            <UserPlus />
            Create login
          </Button>
          <Button size="sm" variant="outline" onClick={() => open("reset")}>
            <KeyRound />
            Reset password
          </Button>
          <Button size="sm" variant="outline" onClick={() => open("phone")}>
            <Phone />
            Change login phone
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={action === "create"}
        onOpenChange={(next) => setAction(next ? "create" : null)}
        title="Create the household's login?"
        description="For a household registered without an app login. You get a temporary password to give to the household; it must be changed at the first sign-in."
        confirmLabel="Create login"
        onConfirm={createLogin}
      />
      <ConfirmDialog
        open={action === "reset"}
        onOpenChange={(next) => setAction(next ? "reset" : null)}
        title="Reset the household's password?"
        description="The household is signed out everywhere. You get a temporary password to give to them; it must be changed at the next sign-in."
        confirmLabel="Reset password"
        destructive
        onConfirm={resetPassword}
      />
      <ConfirmDialog
        open={action === "phone"}
        onOpenChange={(next) => setAction(next ? "phone" : null)}
        title="Change the login phone"
        description="The household then signs in with the new number and is signed out now. The old number is not told."
        confirmLabel="Change phone"
        confirmDisabled={!phone.trim() || !!phoneProblem || !reason.trim()}
        onConfirm={changePhone}
      >
        <div className="space-y-4">
          <FormField label="New phone" htmlFor="login-phone" required error={phoneProblem ?? undefined}>
            <Input id="login-phone" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} />
          </FormField>
          <FormField label="Reason" htmlFor="login-phone-reason" required hint="Kept with the change">
            <Textarea id="login-phone-reason" value={reason} onChange={(event) => setReason(event.target.value)} />
          </FormField>
        </div>
      </ConfirmDialog>

      {credentials ? (
        <CredentialsOnceDialog
          login={credentials.username}
          initialPassword={credentials.initialPassword}
          passwordChangeRequired={credentials.passwordChangeRequired ?? true}
          title="Household login"
          recipient="household"
          onClose={() => setCredentials(null)}
        />
      ) : null}
    </Panel>
  );
}
