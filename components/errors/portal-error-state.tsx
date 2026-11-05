import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { ErrorReference } from "@/components/errors/error-reference";

/**
 * Full-width message for the staff portal's error and not-found pages. It sits
 * inside the dashboard layout, so the sidebar and header stay usable.
 */
export function PortalErrorState({
  icon: Icon,
  title,
  children,
  actions,
  reference = null,
}: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
  actions?: ReactNode;
  reference?: string | null;
}) {
  return (
    <section className="mx-auto flex w-full max-w-xl flex-col items-center gap-4 rounded-xl border border-black/[0.06] bg-white px-6 py-12 text-center shadow-xs">
      <span className="flex size-11 items-center justify-center rounded-full bg-[#007050]/10 text-[#007050]">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <h1 className="text-xl font-semibold tracking-tight text-[#001539]">{title}</h1>
      <div className="max-w-md space-y-2 text-sm text-black/60">{children}</div>
      {actions ? <div className="mt-2 flex flex-wrap justify-center gap-2">{actions}</div> : null}
      <ErrorReference digest={reference} className="mt-2" />
    </section>
  );
}
