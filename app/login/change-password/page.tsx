import { Suspense } from "react";
import Link from "next/link";

import { ChangePasswordForm } from "@/components/auth/change-password-form";

export default function ChangePasswordPage() {
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

      <section className="relative mx-auto w-full max-w-xl">
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

        <div className="mt-10 rounded-3xl border border-black/5 bg-white/80 p-6 shadow-xl shadow-black/5 backdrop-blur-xl sm:p-8">
          <h1 className="text-2xl font-medium tracking-tight text-[#001539]">
            Change your password
          </h1>
          <p className="mt-1 text-sm text-black/60">
            Your account requires a new password before you can continue.
          </p>

          <Suspense
            fallback={<p className="mt-8 text-sm text-black/60">Loading...</p>}
          >
            <ChangePasswordForm />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
