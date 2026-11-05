"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Save } from "lucide-react";

import { FormField } from "@/components/dashboard/form-field";
import { InlineAlert } from "@/components/dashboard/inline-alert";
import { Panel } from "@/components/dashboard/panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";
import type { MeProfile } from "@/lib/api/types";
import { useResource } from "@/lib/api/use-resource";
import { STAFF_PASSWORD_HINT, staffPasswordProblems } from "@/lib/auth/password-policy";
import { fetchSession, resetSessionCache } from "@/lib/auth/use-session";
import { isValidEthiopianPhone } from "@/lib/registration/phone";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrator",
  FIELD_OFFICER: "Field officer",
  BRANCH: "Branch officer",
};

export function ProfileForm() {
  const { data: profile, error, isLoading, reload } = useResource<MeProfile>("/bff/auth/me");

  if (isLoading && !profile) {
    return <div className="h-64 animate-pulse rounded-xl bg-black/[0.04]" />;
  }

  if (!profile) {
    return (
      <InlineAlert action={<Button variant="outline" size="sm" onClick={reload}>Retry</Button>}>
        {error?.message ?? "Profile not available"}
      </InlineAlert>
    );
  }

  // Keyed so the form re-initialises after a save returns new values.
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <AccountDetails key={`${profile.displayName}|${profile.phone}`} profile={profile} onSaved={reload} />
      <ChangePassword />
    </div>
  );
}

function AccountDetails({ profile, onSaved }: { profile: MeProfile; onSaved: () => void }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(profile.displayName ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    // Send only what changed: the API leaves out fields alone, and a blank
    // phone must never overwrite the one staff may sign in with.
    const changes: { displayName?: string; phone?: string } = {};
    const nextName = displayName.trim();
    const nextPhone = phone.trim();
    if (nextName !== (profile.displayName ?? "").trim()) changes.displayName = nextName;
    if (nextPhone !== (profile.phone ?? "").trim()) {
      if (!nextPhone) {
        setError("Enter a phone number. To keep the current one, leave the field as it is.");
        return;
      }
      if (!isValidEthiopianPhone(nextPhone)) {
        setError("Enter an Ethiopian mobile number, for example +251911223344.");
        return;
      }
      changes.phone = nextPhone;
    }
    if (Object.keys(changes).length === 0) {
      setMessage("Nothing to save. Change your name or phone first.");
      return;
    }

    setIsSaving(true);
    try {
      await apiClient<MeProfile>("/bff/auth/me", {
        method: "PATCH",
        body: JSON.stringify(changes),
      });
      setMessage("Profile updated.");
      // Refresh the name in the sidebar and menu.
      void fetchSession({ force: true });
      router.refresh();
      onSaved();
    } catch (saveError) {
      setError(errorMessage(saveError, "Failed to update profile"));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Panel title="Account details" description="How your name and phone appear across EZAC.">
      <form onSubmit={onSubmit} className="space-y-4">
        {message ? <InlineAlert tone="success">{message}</InlineAlert> : null}
        {error ? <InlineAlert>{error}</InlineAlert> : null}
        <FormField label="Display name" htmlFor="displayName">
          <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" />
        </FormField>
        <FormField label="Phone" htmlFor="phone">
          <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+2519…" />
        </FormField>
        <FormField label="Email" htmlFor="email" hint="Managed by your administrator">
          <Input id="email" value={profile.email ?? "—"} disabled readOnly />
        </FormField>
        <div className="space-y-1.5">
          <p className="text-[13px] font-medium text-[#001539]">Roles</p>
          <div className="flex flex-wrap gap-1.5">
            {profile.roles.length > 0 ? (
              profile.roles.map((role) => (
                <Badge key={role} tone="navy">
                  {ROLE_LABELS[role] ?? role}
                </Badge>
              ))
            ) : (
              <span className="text-sm text-black/45">—</span>
            )}
          </div>
        </div>
        <div className="flex justify-end border-t border-black/[0.06] pt-4">
          <Button type="submit" disabled={isSaving}>
            <Save />
            {isSaving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>
    </Panel>
  );
}

function ChangePassword() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const problems = staffPasswordProblems(currentPassword, newPassword, confirmNewPassword);
    if (problems.length > 0) {
      setError(`${problems[0]}.`);
      return;
    }
    setIsSaving(true);
    try {
      await apiClient<unknown>("/bff/auth/me/password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword, confirmNewPassword }),
      });
      resetSessionCache();
      router.push("/login?passwordChanged=1&redirect=/dashboard/profile");
      router.refresh();
    } catch (saveError) {
      setError(errorMessage(saveError, "Failed to change password"));
      setIsSaving(false);
    }
  }

  return (
    <Panel title="Password" description="You'll be signed out and asked to sign in with the new password.">
      <form onSubmit={onSubmit} className="space-y-4">
        {error ? <InlineAlert>{error}</InlineAlert> : null}
        <FormField label="Current password" htmlFor="currentPassword" required>
          <Input id="currentPassword" type="password" autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
        </FormField>
        <FormField label="New password" htmlFor="newPassword" hint={STAFF_PASSWORD_HINT} required>
          <Input id="newPassword" type="password" autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={10} required />
        </FormField>
        <FormField label="Confirm new password" htmlFor="confirmNewPassword" required>
          <Input id="confirmNewPassword" type="password" autoComplete="new-password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} minLength={10} required />
        </FormField>
        <div className="flex justify-end border-t border-black/[0.06] pt-4">
          <Button type="submit" disabled={isSaving}>
            <KeyRound />
            {isSaving ? "Updating…" : "Update password"}
          </Button>
        </div>
      </form>
    </Panel>
  );
}
