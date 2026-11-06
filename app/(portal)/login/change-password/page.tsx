import { Suspense } from "react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { SignOutLink } from "@/components/auth/sign-out-link";
import { PASSWORD_CHANGE_COOKIE } from "@/lib/auth/constants";

export const metadata: Metadata = {
  title: "Change your password — EZAC",
  robots: { index: false, follow: false },
};

export default async function ChangePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // This screen is only for an account that must replace a temporary
  // password (proxy.ts sends those here). Anyone else changes their password
  // on Profile & security. proxy.ts already sends signed-out visitors to /login.
  const pending = (await cookies()).get(PASSWORD_CHANGE_COOKIE)?.value;
  if (!pending) {
    const requested = (await searchParams).redirect;
    const back = typeof requested === "string" && requested.startsWith("/dashboard") ? requested : null;
    redirect(back ?? "/dashboard/profile");
  }

  return (
    <main
      id="main"
      tabIndex={-1}
      className="relative min-h-screen overflow-hidden bg-white px-6 py-24 outline-none sm:px-8 md:py-0 md:flex md:items-center"
    >
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(circle at 20% 20%, rgba(0,112,80,0.06), transparent 35%), radial-gradient(circle at 80% 10%, rgba(225,143,53,0.05), transparent 40%), radial-gradient(circle at 50% 100%, rgba(0,21,57,0.05), transparent 45%)",
        }}
      />

      <section className="relative mx-auto w-full max-w-xl">
        <Link
          href="/"
          className="inline-flex items-center gap-3 leading-none transition-opacity hover:opacity-80"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- brand mark served as a static asset */}
          <img src="/logo.svg" alt="EZAC" className="h-10 w-auto" />
          <span className="flex flex-col">
            <span
              className="font-serif-display text-xl tracking-tight text-navy"
              style={{ lineHeight: 1.1 }}
            >
              EZAC
            </span>
            <span
              className="text-xs uppercase tracking-[0.18em] text-muted-ink"
              style={{ lineHeight: 1.4 }}
            >
              Ethiopian Zakat &amp; Awqaf Commission
            </span>
          </span>
        </Link>

        <div className="mt-10 rounded-3xl border border-black/5 bg-white/80 p-6 shadow-xl shadow-black/5 backdrop-blur-xl sm:p-8">
          <h1 className="text-2xl font-medium tracking-tight text-navy">
            Change your password
          </h1>
          <p className="mt-1 text-sm text-black/60">
            You signed in with a temporary password. Choose your own password to continue; you only need to do this once.
          </p>

          <Suspense
            fallback={<p className="mt-8 text-sm text-black/60">Loading...</p>}
          >
            <ChangePasswordForm />
          </Suspense>

          <div className="mt-6 space-y-2 text-center text-sm text-black/60">
            <p>Forgot your password? Ask your administrator to reset it.</p>
            <p>
              Not your account? <SignOutLink />
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
