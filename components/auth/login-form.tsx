"use client";

import { FormEvent, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { forgetLoginName, rememberLoginName } from "@/components/auth/login-name";
import { RESUME_REASON, announceSignedIn, closeResumeTab } from "@/components/auth/resume-sign-in";
import { defaultDashboardPath } from "@/lib/auth/constants";
import { fetchSession } from "@/lib/auth/use-session";

type LoginResponse = {
  success?: boolean;
  message?: string;
  data?: { passwordChangeRequired?: boolean };
};

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const passwordInput = useRef<HTMLInputElement>(null);
  const passwordChanged = searchParams.get("passwordChanged") === "1";
  const signedOutIdle = searchParams.get("reason") === "idle";
  const sessionEnded = searchParams.get("reason") === "ended";
  // Opened from a form whose save met an ended session (sign-in-again.tsx).
  const resuming = searchParams.get("reason") === RESUME_REASON;

  function requestedPage(): string | null {
    const redirectTo = searchParams.get("redirect");
    return redirectTo?.startsWith("/dashboard") ? redirectTo : null;
  }

  async function resolveDestination(): Promise<string> {
    // Always reload the session: a cached one could belong to whoever used
    // this browser before.
    const session = await fetchSession({ force: true });
    const requested = requestedPage();
    if (requested) return requested;
    return session ? defaultDashboardPath(session.allRoles) : "/dashboard";
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/bff/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const payload = (await response.json().catch(() => null)) as LoginResponse | null;

      if (!response.ok || !payload?.success) {
        setError(payload?.message ?? "Sign-in failed. Try again.");
        // Start the password again; the username stays.
        setPassword("");
        passwordInput.current?.focus();
        return;
      }

      const requested = requestedPage();
      if (payload.data?.passwordChangeRequired) {
        // Lets the change-password form sign in with the new password straight away.
        rememberLoginName(username.trim());
        const next = new URLSearchParams();
        if (requested) next.set("redirect", requested);
        if (resuming) next.set("reason", RESUME_REASON);
        const query = next.toString();
        router.push(`/login/change-password${query ? `?${query}` : ""}`);
        router.refresh();
        return;
      }

      forgetLoginName();
      const destination = await resolveDestination();
      // Other tabs waiting on a sign-in (an unsaved form) can carry on now.
      announceSignedIn();
      if (closeResumeTab(searchParams.get("reason"))) return;
      router.push(destination);
      router.refresh();
    } catch {
      setError("We couldn't reach EZAC. Check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-4">
      {passwordChanged ? (
        <p
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          Password updated. Please sign in with your new password.
        </p>
      ) : null}

      {signedOutIdle && !passwordChanged ? (
        <p
          role="status"
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        >
          You were signed out after 15 minutes without activity.
        </p>
      ) : null}

      {resuming && !passwordChanged ? (
        <p
          role="status"
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        >
          Your session has ended. Sign in to carry on: this tab closes afterwards and your
          unsaved work is still in the other tab.
        </p>
      ) : null}

      {sessionEnded && !passwordChanged ? (
        <p
          role="status"
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        >
          Your session has ended. Sign in again to continue.
        </p>
      ) : null}

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
          Username
        </span>
        <input
          type="text"
          name="username"
          autoComplete="username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="your.username"
          required
          className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-[#001539] placeholder:text-black/35 outline-none transition focus:border-[#007050] focus:ring-2 focus:ring-[#007050]/20"
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-xs uppercase tracking-[0.12em] text-black/60">
          Password
        </span>
        <input
          ref={passwordInput}
          type="password"
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Enter your password"
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
        {isSubmitting ? "Signing in..." : "Log In"}
      </button>

      <p className="text-center text-sm text-black/60">
        Forgot your password? Ask your administrator to reset it.
      </p>
    </form>
  );
}
