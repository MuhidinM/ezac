"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api/errors";
import { apiClient } from "@/lib/api/client";
import type { MeProfile } from "@/lib/api/types";

export function ProfileForm() {
  const router = useRouter();
  const [profile, setProfile] = useState<MeProfile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setLoadError(null);
      try {
        const data = await apiClient<MeProfile>("/api/auth/me");
        if (cancelled) return;
        setProfile(data);
        setDisplayName(data.displayName ?? "");
        setPhone(data.phone ?? "");
      } catch (error) {
        if (cancelled) return;
        if (error instanceof ApiError && error.status === 401) {
          router.replace("/login?redirect=/dashboard/profile");
          return;
        }
        setLoadError(
          error instanceof ApiError
            ? error.message
            : "Failed to load profile",
        );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function onSaveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfileError(null);
    setProfileMessage(null);
    setIsSavingProfile(true);

    try {
      const updated = await apiClient<MeProfile>("/api/auth/me", {
        method: "PATCH",
        body: JSON.stringify({
          displayName: displayName.trim(),
          phone: phone.trim(),
        }),
      });
      setProfile(updated);
      setDisplayName(updated.displayName ?? "");
      setPhone(updated.phone ?? "");
      setProfileMessage("Profile updated successfully.");
    } catch (error) {
      setProfileError(
        error instanceof ApiError ? error.message : "Failed to update profile",
      );
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function onChangePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordError(null);
    setPasswordMessage(null);

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError("New password and confirmation do not match.");
      return;
    }

    setIsSavingPassword(true);

    try {
      await apiClient<unknown>("/api/auth/me/password", {
        method: "POST",
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmNewPassword,
        }),
      });
      router.push("/login?passwordChanged=1&redirect=/dashboard/profile");
      router.refresh();
    } catch (error) {
      setPasswordError(
        error instanceof ApiError
          ? error.message
          : "Failed to change password",
      );
    } finally {
      setIsSavingPassword(false);
    }
  }

  if (isLoading) {
    return <p className="text-sm text-black/60">Loading profile...</p>;
  }

  if (loadError || !profile) {
    return (
      <p
        role="alert"
        className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
      >
        {loadError ?? "Profile not available"}
      </p>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <form
        onSubmit={onSaveProfile}
        className="space-y-4 rounded-2xl border border-black/5 bg-white p-5 shadow-sm shadow-black/5"
      >
        <div>
          <h2 className="text-lg font-medium text-[#001539]">Account details</h2>
          <p className="mt-1 text-sm text-black/60">
            Update how your name and phone appear in EZAC.
          </p>
        </div>

        {profileMessage ? (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {profileMessage}
          </p>
        ) : null}
        {profileError ? (
          <p
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {profileError}
          </p>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="displayName">Display name</Label>
          <Input
            id="displayName"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="Your name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="+2519..."
          />
        </div>

        <div className="space-y-2">
          <Label>Email</Label>
          <Input value={profile.email ?? "—"} disabled readOnly />
        </div>

        <div className="space-y-2">
          <Label>Roles</Label>
          <p className="rounded-md border border-black/10 bg-black/[0.02] px-3 py-2 text-sm text-[#001539]">
            {profile.roles.length > 0 ? profile.roles.join(", ") : "—"}
          </p>
        </div>

        <Button type="submit" disabled={isSavingProfile}>
          {isSavingProfile ? "Saving..." : "Save profile"}
        </Button>
      </form>

      <form
        onSubmit={onChangePassword}
        className="space-y-4 rounded-2xl border border-black/5 bg-white p-5 shadow-sm shadow-black/5"
      >
        <div>
          <h2 className="text-lg font-medium text-[#001539]">Change password</h2>
          <p className="mt-1 text-sm text-black/60">
            After changing your password you will need to sign in again.
          </p>
        </div>

        {passwordMessage ? (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {passwordMessage}
          </p>
        ) : null}
        {passwordError ? (
          <p
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {passwordError}
          </p>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="currentPassword">Current password</Label>
          <Input
            id="currentPassword"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="newPassword">New password</Label>
          <Input
            id="newPassword"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            minLength={6}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmNewPassword">Confirm new password</Label>
          <Input
            id="confirmNewPassword"
            type="password"
            autoComplete="new-password"
            value={confirmNewPassword}
            onChange={(event) => setConfirmNewPassword(event.target.value)}
            minLength={6}
            required
          />
        </div>

        <Button type="submit" disabled={isSavingPassword}>
          {isSavingPassword ? "Updating..." : "Update password"}
        </Button>
      </form>
    </div>
  );
}
