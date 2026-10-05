"use client";

import type { ReactNode } from "react";
import { ShieldAlert } from "lucide-react";

import { canSee, type NavAudience } from "@/components/dashboard/nav-config";
import { useSession } from "@/lib/auth/use-session";

/** Render children only for the given audiences; explain otherwise. */
export function RequireRole({
  audience,
  children,
}: {
  audience: NavAudience[];
  children: ReactNode;
}) {
  const { session, isLoading } = useSession();

  if (isLoading) {
    return <div className="h-40 animate-pulse rounded-xl bg-black/[0.04]" />;
  }

  if (!canSee(audience, session)) {
    return <NoAccess />;
  }

  return children;
}

export function NoAccess({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-black/[0.06] bg-white px-6 py-16 text-center shadow-xs">
      <span className="flex size-11 items-center justify-center rounded-full bg-black/[0.04] text-black/50">
        <ShieldAlert className="size-5" />
      </span>
      <h2 className="mt-4 text-base font-semibold text-[#001539]">
        You don&apos;t have access to this page
      </h2>
      <p className="mt-1 max-w-sm text-sm text-black/55">
        {message ?? "Your role or branch assignment doesn't include this area. Contact an administrator if you think this is wrong."}
      </p>
    </div>
  );
}
