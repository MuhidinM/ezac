"use client";

import type { ReactNode } from "react";
import { CloudOff, ShieldAlert } from "lucide-react";

import { canSee, type NavAudience } from "@/components/dashboard/nav-config";
import { Button } from "@/components/ui/button";
import { fetchSession, useSession } from "@/lib/auth/use-session";

/** Render children only for the given audiences; explain otherwise. */
export function RequireRole({
  audience,
  children,
}: {
  audience: NavAudience[];
  children: ReactNode;
}) {
  const { session, isLoading, signedOut, unavailable, provisional } = useSession();

  // Still loading, or on the way to sign-in: "no access" would be wrong in both cases.
  if (isLoading || signedOut) {
    return <div className="h-40 animate-pulse rounded-xl bg-black/[0.04]" role="status" aria-label="Loading" />;
  }

  // The session couldn't be read at all (offline, sign-in service down).
  if (!session && unavailable) {
    return (
      <div className="flex flex-col items-center rounded-xl border border-black/[0.06] bg-white px-6 py-16 text-center shadow-xs" role="status">
        <span className="flex size-11 items-center justify-center rounded-full bg-black/[0.04] text-black/50">
          <CloudOff className="size-5" />
        </span>
        <h2 className="mt-4 text-base font-semibold text-navy">We couldn&apos;t load your account</h2>
        <p className="mt-1 max-w-sm text-sm text-black/60">
          Check your connection. We&apos;ll keep trying, or try again now.
        </p>
        <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => void fetchSession({ force: true })}>
          Try again
        </Button>
      </div>
    );
  }

  if (!canSee(audience, session)) {
    // The token's roles are only a first guess (/me can add roles): wait for
    // the server's answer before saying "no access".
    if (provisional) {
      return <div className="h-40 animate-pulse rounded-xl bg-black/[0.04]" role="status" aria-label="Loading" />;
    }
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
      <h2 className="mt-4 text-base font-semibold text-navy">
        You don&apos;t have access to this page
      </h2>
      <p className="mt-1 max-w-sm text-sm text-black/60">
        {message ?? "Your role or branch assignment doesn't include this area. Contact an administrator if you think this is wrong."}
      </p>
    </div>
  );
}
