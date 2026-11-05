"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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
  const passwordChanged = searchParams.get("passwordChanged") === "1";
  const signedOutIdle = searchParams.get("reason") === "idle";

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
    return session ? defaultDashboardPath(session.allRoles) : "/dashboard/beneficiary";
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
        return;
      }

      const requested = requestedPage();
      if (payload.data?.passwordChangeRequired) {
        const redirectQuery = requested ? `?redirect=${encodeURIComponent(requested)}` : "";
        router.push(`/login/change-password${redirectQuery}`);
        router.refresh();
        return;
      }

      const destination = await resolveDestination();
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
