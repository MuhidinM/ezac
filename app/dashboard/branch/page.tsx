"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { BranchCodesPanel } from "@/components/branches/branch-codes-panel";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/errors";
import { apiClient } from "@/lib/api/client";
import type { BranchPortalProfile, CodeStats } from "@/lib/api/types";
import { fetchSession } from "@/lib/auth/use-session";

function formatCodeStats(stats: CodeStats | null): string {
  if (!stats) return "—";
  return `${stats.available} available · ${stats.reserved} reserved · ${stats.consumed} consumed · ${stats.revoked} revoked`;
}

export default function BranchPortalPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<BranchPortalProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const session = await fetchSession();

      if (session && !session.isBranch) {
        router.replace("/dashboard/beneficiary");
        return;
      }

      const data = await apiClient<BranchPortalProfile>("/api/branch/me");
      setProfile(data);
    } catch (loadError) {
      if (loadError instanceof ApiError && loadError.status === 401) {
        router.replace("/login?redirect=/dashboard/branch");
        return;
      }
      setError(
        loadError instanceof ApiError
          ? loadError.message
          : "Failed to load branch profile",
      );
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  if (isLoading) {
    return (
      <section className="space-y-4">
        <p className="text-sm text-black/60">Loading your branch...</p>
      </section>
    );
  }

  if (error || !profile) {
    return (
      <section className="space-y-4">
        <h1 className="font-serif-display text-4xl tracking-tight text-[#001539]">
          My branch
        </h1>
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error ?? "Branch profile not available"}
        </p>
        <Button variant="outline" onClick={() => void loadProfile()}>
          Retry
        </Button>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-serif-display text-4xl tracking-tight text-[#001539]">
            {profile.name}
          </h1>
          <p className="mt-1 text-sm text-black/60">
            {formatCodeStats(profile.codeStats)}
          </p>
        </div>
        <Button variant="outline" onClick={() => void loadProfile()}>
          Refresh
        </Button>
      </div>

      <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm shadow-black/5">
        <h2 className="text-sm font-medium uppercase tracking-[0.12em] text-black/45">
          Location
        </h2>
        <dl className="mt-4 grid gap-3 sm:grid-cols-3">
          <DetailRow label="Region" value={profile.region} />
          <DetailRow label="Zone" value={profile.zone} />
          <DetailRow label="Woreda" value={profile.woreda} />
        </dl>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-medium text-[#001539]">
          Registration codes
        </h2>
        <p className="mb-3 text-sm text-black/60">
          View codes assigned to your branch. Generating new codes is managed by
          HQ administrators.
        </p>
        <BranchCodesPanel
          listPath="/api/branch/codes"
          onUnauthorized={() =>
            router.replace("/login?redirect=/dashboard/branch")
          }
        />
      </div>
    </section>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div>
      <dt className="text-sm text-black/50">{label}</dt>
      <dd className="mt-1 text-sm text-[#001539]">
        {value?.trim() ? value : "—"}
      </dd>
    </div>
  );
}
