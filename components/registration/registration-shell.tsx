"use client";

import type { ReactNode } from "react";
import { Check, Store } from "lucide-react";

import { InlineAlert } from "@/components/dashboard/inline-alert";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type RegistrationShellProps = {
  title: string;
  description?: string;
  branchName?: string | null;
  wide?: boolean;
  steps?: string[];
  currentStep?: number;
  error?: string | null;
  children: ReactNode;
  footer?: ReactNode;
};

export function RegistrationShell({
  title,
  description,
  branchName,
  wide = false,
  steps,
  currentStep = 0,
  error,
  children,
  footer,
}: RegistrationShellProps) {
  return (
    <section className={cn("mx-auto w-full space-y-6", wide ? "max-w-4xl" : "max-w-2xl")}>
      <PageHeader
        back={{ href: "/dashboard/beneficiary", label: "Beneficiaries" }}
        title={title}
        description={description}
        meta={
          branchName ? (
            <Badge tone="brand">
              <Store />
              {branchName}
            </Badge>
          ) : null
        }
      />

      {steps && steps.length > 0 ? (
        <ol className="flex flex-wrap items-center gap-2">
          {steps.map((step, index) => {
            const done = index < currentStep;
            const active = index === currentStep;
            return (
              <li key={step} className="flex items-center gap-2">
                {index > 0 ? <span className="h-px w-6 bg-black/15" aria-hidden /> : null}
                <span
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full text-xs font-semibold tabular-nums",
                    done && "bg-[#007050] text-white",
                    active && "bg-[#001539] text-white",
                    !done && !active && "bg-black/[0.06] text-black/45",
                  )}
                >
                  {done ? <Check className="size-3.5" /> : index + 1}
                </span>
                <span
                  className={cn(
                    "text-sm",
                    active ? "font-medium text-[#001539]" : "text-black/50",
                  )}
                >
                  {step}
                </span>
              </li>
            );
          })}
        </ol>
      ) : null}

      <div className="rounded-xl border border-black/[0.06] bg-white p-5 shadow-xs sm:p-6">
        {error ? <InlineAlert className="mb-5">{error}</InlineAlert> : null}
        {children}
        {footer ? <div className="mt-8 border-t border-black/[0.06] pt-6">{footer}</div> : null}
      </div>
    </section>
  );
}
