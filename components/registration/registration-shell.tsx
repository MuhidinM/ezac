"use client";

import type { ReactNode } from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";

type RegistrationShellProps = {
  title: string;
  description?: string;
  steps?: string[];
  currentStep?: number;
  error?: string | null;
  children: ReactNode;
  footer?: ReactNode;
};

export function RegistrationShell({
  title,
  description,
  steps,
  currentStep = 0,
  error,
  children,
  footer,
}: RegistrationShellProps) {
  return (
    <section className="mx-auto w-full max-w-xl space-y-6">
      <div>
        <Link
          href="/dashboard/beneficiary"
          className="text-xs uppercase tracking-[0.12em] text-black/45 transition hover:text-[#001539]"
        >
          Back to beneficiaries
        </Link>
        <h1 className="mt-3 font-serif-display text-3xl tracking-tight text-[#001539]">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-sm text-black/60">{description}</p>
        ) : null}
      </div>

      {steps && steps.length > 0 ? (
        <ol className="flex flex-wrap gap-2">
          {steps.map((step, index) => (
            <li
              key={step}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium",
                index === currentStep
                  ? "bg-[#007050] text-white"
                  : index < currentStep
                    ? "bg-black/10 text-black/70"
                    : "bg-black/[0.04] text-black/40",
              )}
            >
              {step}
            </li>
          ))}
        </ol>
      ) : null}

      <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm shadow-black/5 sm:p-6">
        {error ? (
          <p
            role="alert"
            className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </p>
        ) : null}

        {children}
      </div>

      {footer ? (
        <div className="sticky bottom-0 -mx-1 rounded-2xl border border-black/5 bg-white/95 px-1 py-3 backdrop-blur-sm">
          {footer}
        </div>
      ) : null}
    </section>
  );
}
