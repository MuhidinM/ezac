import { Suspense } from "react";
import Link from "next/link";

import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-white px-6 py-24 sm:px-8 md:py-0 md:flex md:items-center">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(circle at 20% 20%, rgba(0,112,80,0.06), transparent 35%), radial-gradient(circle at 80% 10%, rgba(225,143,53,0.05), transparent 40%), radial-gradient(circle at 50% 100%, rgba(0,21,57,0.05), transparent 45%)",
        }}
      />

      <section className="relative mx-auto w-full max-w-7xl">
        <Link
          href="/"
          className="inline-flex items-center gap-3 leading-none transition-opacity hover:opacity-80"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- brand mark served as a static asset */}
          <img src="/logo.svg" alt="EZAC" className="h-10 w-auto" />
          <span className="flex flex-col">
            <span
              className="font-serif-display text-xl tracking-tight"
              style={{ color: "#001539", lineHeight: 1.1 }}
            >
              EZAC
            </span>
            <span
              className="text-[10px] uppercase tracking-[0.18em]"
              style={{ color: "#6F6F6F", lineHeight: 1.4 }}
            >
              Ethiopian Zakat &amp; Awqaf Commission
            </span>
          </span>
        </Link>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p
              className="text-xs uppercase tracking-[0.16em]"
              style={{ color: "#6F6F6F" }}
            >
              Staff portal
            </p>
            <h1
              className="mt-4 max-w-xl font-serif-display text-5xl leading-[0.98] tracking-tight md:text-6xl"
              style={{ color: "#001539" }}
            >
              Log in to review and manage beneficiaries.
            </h1>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-black/70 md:text-lg">
              Admin and field officer accounts can list beneficiaries, review
              registrations, and update verification status from one secure
              dashboard.
            </p>
          </div>

          <div className="rounded-3xl border border-black/5 bg-white/80 p-6 shadow-xl shadow-black/5 backdrop-blur-xl sm:p-8">
            <h2 className="text-2xl font-medium tracking-tight text-[#001539]">
              Welcome back
            </h2>
            <p className="mt-1 text-sm text-black/60">
              Sign in with your staff username and password.
            </p>

            <Suspense fallback={<p className="mt-8 text-sm text-black/60">Loading...</p>}>
              <LoginForm />
            </Suspense>
          </div>
        </div>
      </section>
    </main>
  );
}
