"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Save } from "lucide-react";

import { PasswordProblems, passwordProblemsFrom } from "@/components/auth/password-problems";
import { FormField } from "@/components/dashboard/form-field";
import { InlineAlert } from "@/components/dashboard/inline-alert";
import { Panel } from "@/components/dashboard/panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api/client";
import { ApiError, errorMessage } from "@/lib/api/errors";
import type { AppRole, MeProfile } from "@/lib/api/types";
import { useResource } from "@/lib/api/use-resource";
import { sendToSignIn } from "@/lib/auth/client-session";
import { filterAppRoles } from "@/lib/auth/constants";
import { STAFF_PASSWORD_HINT, staffPasswordProblems } from "@/lib/auth/password-policy";
import { fetchSession, resetSessionCache, useSession } from "@/lib/auth/use-session";
import { canEditOwnName } from "@/lib/branches/staff-accounts";
import { isValidEthiopianPhone } from "@/lib/registration/phone";

const ROLE_LABELS: Record<AppRole, string> = {
  ADMIN: "Administrator",
  FIELD_OFFICER: "Field officer",
  BRANCH: "Branch officer",
};

const NAME_MAX_LENGTH = 120;

/**
 * The sign-in phone to show, or "" when /me holds something else in that
 * field (an administrator's username, such as platform.admin).
 */
function shownPhone(phone: string | null): string {
  const value = phone?.trim() ?? "";
  return value && isValidEthiopianPhone(value) ? value : "";
}

function sameName(a: string, b: string): boolean {
  return a.replace(/\s+/g, " ").trim() === b.replace(/\s+/g, " ").trim();
}

export function ProfileForm() {
  const { data: profile, error, isLoading, reload } = useResource<MeProfile>("/bff/auth/me");
  // Kept here: AccountDetails remounts after a save and would lose it.
  const [notice, setNotice] = useState<string | null>(null);

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
      <AccountDetails
        key={profile.displayName ?? ""}
        profile={profile}
        notice={notice}
        onNotice={setNotice}
        onSaved={reload}
      />
      <ChangePassword />
    </div>
  );
}

function AccountDetails({
  profile,
  notice,
  onNotice,
  onSaved,
}: {
  profile: MeProfile;
  notice: string | null;
  onNotice: (message: string | null) => void;
  onSaved: () => void;
}) {
  const router = useRouter();
  const { session } = useSession();
  const [displayName, setDisplayName] = useState(profile.displayName ?? "");
  const [nameError, setNameError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const phone = shownPhone(profile.phone);
  // /me can leave out roles that are on the sign-in token, so show both.
  // Only EZAC roles: the sign-in service adds technical ones of its own.
  const roles = filterAppRoles([...profile.roles, ...(session?.roles ?? [])]);
  const nameEditable = canEditOwnName(roles);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!nameEditable) return;
    setError(null);
    setNameError(null);
    onNotice(null);

    const nextName = displayName.trim();
    if (!nextName) {
      setNameError("Enter your name.");
      return;
    }
    if (nextName.length > NAME_MAX_LENGTH) {
      setNameError(`Keep your name under ${NAME_MAX_LENGTH} characters.`);
      return;
    }
    if (sameName(nextName, profile.displayName ?? "")) {
      onNotice("Nothing to save. Change your name first.");
      return;
    }

    setIsSaving(true);
    try {
      const saved = await apiClient<MeProfile | null>("/bff/auth/me", {
        method: "PATCH",
        body: JSON.stringify({ displayName: nextName }),
      });
      if (typeof saved?.displayName === "string" && !sameName(saved.displayName, nextName)) {
        setError("Your name was not saved. Try again.");
        return;
      }
      onNotice("Profile updated.");
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
    <Panel
      title="Account details"
      description={
        nameEditable
          ? "How your name appears across EZAC. An administrator manages your phone and email."
          : "How your name appears across EZAC. An administrator manages these details."
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {notice ? <InlineAlert tone="success">{notice}</InlineAlert> : null}
        {error ? <InlineAlert>{error}</InlineAlert> : null}
        <FormField
          label="Display name"
          htmlFor="displayName"
          required={nameEditable}
          error={nameError ?? undefined}
          hint={
            nameEditable
              ? undefined
              : roles.includes("BRANCH")
                ? "Managed by an administrator on your branch record."
                : "Managed by an administrator on your field officer record."
          }
        >
          <Input
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
            maxLength={NAME_MAX_LENGTH}
            autoComplete="name"
            aria-invalid={nameError ? true : undefined}
            disabled={!nameEditable}
            readOnly={!nameEditable}
          />
        </FormField>
        <FormField
          label="Phone"
          htmlFor="phone"
          hint={phone ? "Your sign-in phone is managed by an administrator." : "Managed by your administrator"}
        >
          <Input id="phone" type="tel" value={phone} placeholder="No phone on file" disabled readOnly />
        </FormField>
        <FormField label="Email" htmlFor="email" hint="Managed by your administrator">
          <Input id="email" value={profile.email ?? ""} placeholder="No email on file" disabled readOnly />
        </FormField>
        <div className="space-y-1.5">
          <p className="text-[13px] font-medium text-navy">Roles</p>
          <div className="flex flex-wrap gap-1.5">
            {roles.length > 0 ? (
              roles.map((role) => (
                <Badge key={role} tone="navy">
                  {ROLE_LABELS[role]}
                </Badge>
              ))
            ) : (
              <span className="text-sm text-black/60">No role assigned yet</span>
            )}
          </div>
        </div>
        {nameEditable ? (
          <div className="flex justify-end border-t border-black/[0.06] pt-4">
            <Button type="submit" disabled={isSaving}>
              <Save />
              {isSaving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        ) : null}
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
  const [problems, setProblems] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setProblems([]);
    const found = staffPasswordProblems(currentPassword, newPassword, confirmNewPassword);
    if (found.length > 0) {
      setProblems(found);
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
      if (saveError instanceof ApiError && saveError.status === 401) {
        // The session itself is over (a wrong current password is a 400).
        void sendToSignIn("/dashboard/profile", { reason: "ended" });
        return;
      }
      const listed = passwordProblemsFrom(saveError);
      if (listed.length > 0) setProblems(listed);
      else setError(errorMessage(saveError, "Failed to change password"));
      setIsSaving(false);
    }
  }

  return (
    <Panel title="Password" description="You'll be signed out and asked to sign in with the new password.">
      <form onSubmit={onSubmit} className="space-y-4">
        {problems.length > 0 ? (
          <InlineAlert>
            <PasswordProblems problems={problems} />
          </InlineAlert>
        ) : error ? (
          <InlineAlert>{error}</InlineAlert>
        ) : null}
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
