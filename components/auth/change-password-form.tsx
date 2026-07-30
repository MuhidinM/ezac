"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { ApiError } from "@/lib/api/errors";
import { apiClient } from "@/lib/api/client";
import { clearSessionCache } from "@/lib/auth/use-session";

export function ChangePasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      await apiClient<unknown>("/api/auth/me/password", {
        method: "POST",
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmNewPassword,
        }),
      });

      clearSessionCache();

      const redirect = searchParams.get("redirect");
      const loginUrl = new URL("/login", window.location.origin);
      loginUrl.searchParams.set("passwordChanged", "1");
      if (redirect?.startsWith("/dashboard")) {
        loginUrl.searchParams.set("redirect", redirect);
      }
      router.push(`${loginUrl.pathname}${loginUrl.search}`);
      router.refresh();
    } catch (submitError) {
      if (submitError instanceof ApiError) {
        setError(submitError.message);
      } else {
        setError("Unable to change password. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-4">
      {error ? (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </p>
      ) : null}

      <label className="block">
        <span className="mb-2 block text-xs uppercase tracking-[0.12em] text-black/60">
          Current password
        </span>
        <input
          type="password"
          name="currentPassword"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          required
          className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-[#001539] placeholder:text-black/35 outline-none transition focus:border-[#007050] focus:ring-2 focus:ring-[#007050]/20"
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-xs uppercase tracking-[0.12em] text-black/60">
          New password
        </span>
        <input
          type="password"
          name="newPassword"
          autoComplete="new-password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          minLength={6}
          required
          className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-[#001539] placeholder:text-black/35 outline-none transition focus:border-[#007050] focus:ring-2 focus:ring-[#007050]/20"
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-xs uppercase tracking-[0.12em] text-black/60">
          Confirm new password
        </span>
        <input
          type="password"
          name="confirmNewPassword"
          autoComplete="new-password"
          value={confirmNewPassword}
          onChange={(event) => setConfirmNewPassword(event.target.value)}
          minLength={6}
          required
          className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-[#001539] placeholder:text-black/35 outline-none transition focus:border-[#007050] focus:ring-2 focus:ring-[#007050]/20"
        />
      </label>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-3 w-full rounded-full px-6 py-3 text-sm font-medium transition-transform duration-300 hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
        style={{
          backgroundColor: "#007050",
          color: "#FFFFFF",
        }}
      >
        {isSubmitting ? "Saving..." : "Change password"}
      </button>
    </form>
  );
}
