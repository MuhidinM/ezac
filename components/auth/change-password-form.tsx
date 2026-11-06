"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { forgetLoginName, readLoginName } from "@/components/auth/login-name";
import { PasswordProblems, passwordProblemsFrom } from "@/components/auth/password-problems";
import { announceSignedIn, closeResumeTab } from "@/components/auth/resume-sign-in";
import { ApiError } from "@/lib/api/errors";
import { apiClient } from "@/lib/api/client";
import { sendToSignIn } from "@/lib/auth/client-session";
import { defaultDashboardPath } from "@/lib/auth/constants";
import { STAFF_PASSWORD_HINT, staffPasswordProblems } from "@/lib/auth/password-policy";
import { fetchSession, resetSessionCache } from "@/lib/auth/use-session";

/**
 * Sign in with the password just set. The change ends the old session (the
 * BFF clears its cookies), so without this the user would have to sign in a
 * second time. False when it didn't work; the caller then sends them to /login.
 */
async function signInWithNewPassword(username: string | null, password: string): Promise<boolean> {
  if (!username) return false;
  try {
    const response = await fetch("/bff/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const payload = (await response.json().catch(() => null)) as {
      success?: boolean;
      data?: { passwordChangeRequired?: boolean };
    } | null;
    return response.ok && payload?.success === true && !payload.data?.passwordChangeRequired;
  } catch {
    return false;
  }
}

export function ChangePasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [problems, setProblems] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setProblems([]);

    const found = staffPasswordProblems(currentPassword, newPassword, confirmNewPassword);
    if (found.length > 0) {
      setProblems(found);
      return;
    }

    setIsSubmitting(true);

    try {
      await apiClient<unknown>("/bff/auth/me/password", {
        method: "POST",
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmNewPassword,
        }),
      });

      resetSessionCache();

      const redirect = searchParams.get("redirect");
      const requested = redirect?.startsWith("/dashboard") ? redirect : null;
      const loginName = readLoginName();
      forgetLoginName();
      if (await signInWithNewPassword(loginName, newPassword)) {
        announceSignedIn();
        if (closeResumeTab(searchParams.get("reason"))) return;
        const session = await fetchSession({ force: true });
        router.push(requested ?? (session ? defaultDashboardPath(session.allRoles) : "/dashboard"));
        router.refresh();
        return;
      }

      const loginUrl = new URL("/login", window.location.origin);
      loginUrl.searchParams.set("passwordChanged", "1");
      if (redirect?.startsWith("/dashboard")) {
        loginUrl.searchParams.set("redirect", redirect);
      }
      router.push(`${loginUrl.pathname}${loginUrl.search}`);
      router.refresh();
    } catch (submitError) {
      if (submitError instanceof ApiError && submitError.status === 401) {
        // The session itself is over (a wrong current password is a 400).
        void sendToSignIn(searchParams.get("redirect") ?? undefined, { reason: "ended" });
        return;
      }
      const listed = passwordProblemsFrom(submitError);
      if (listed.length > 0) {
        setProblems(listed);
      } else if (submitError instanceof ApiError) {
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
      {error || problems.length > 0 ? (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {problems.length > 0 ? <PasswordProblems problems={problems} /> : error}
        </div>
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
          minLength={10}
          required
          aria-describedby="new-password-hint"
          className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-[#001539] placeholder:text-black/35 outline-none transition focus:border-[#007050] focus:ring-2 focus:ring-[#007050]/20"
        />
        <span id="new-password-hint" className="mt-1.5 block text-xs text-black/55">
          {STAFF_PASSWORD_HINT}
        </span>
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
          minLength={10}
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
