"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { BranchCodesPanel } from "@/components/branches/branch-codes-panel";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/errors";
import { apiClient } from "@/lib/api/client";
import type { Branch, CodeStats } from "@/lib/api/types";
import { fetchSession } from "@/lib/auth/use-session";

function formatCodeStats(stats: CodeStats | null): string {
  if (!stats) return "—";
  return `${stats.available} available · ${stats.reserved} reserved · ${stats.consumed} consumed · ${stats.revoked} revoked`;
}

export default function BranchDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const branchId = params.id;

  const [branch, setBranch] = useState<Branch | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isToggling, setIsToggling] = useState(false);
  const [toggleError, setToggleError] = useState<string | null>(null);

  const loadBranch = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const session = await fetchSession();
      if (session && !session.isAdmin) {
        router.replace("/dashboard/beneficiary");
        return;
      }

      const data = await apiClient<Branch>(`/api/admin/branches/${branchId}`);
      setBranch(data);
    } catch (loadError) {
      if (loadError instanceof ApiError && loadError.status === 401) {
        router.replace(`/login?redirect=/dashboard/branches/${branchId}`);
        return;
      }
      setError(
        loadError instanceof ApiError
          ? loadError.message
          : "Failed to load branch",
      );
    } finally {
      setIsLoading(false);
    }
  }, [branchId, router]);

  useEffect(() => {
    void loadBranch();
  }, [loadBranch]);

  async function toggleActive() {
    if (!branch) return;
    setIsToggling(true);
    setToggleError(null);
    try {
      const updated = await apiClient<Branch>(
        `/api/admin/branches/${branch.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({ active: !branch.active }),
        },
      );
      setBranch(updated);
    } catch (err) {
      setToggleError(
        err instanceof ApiError ? err.message : "Failed to update branch",
      );
    } finally {
      setIsToggling(false);
    }
  }

  if (isLoading) {
    return (
      <section className="space-y-4">
        <p className="text-sm text-black/60">Loading branch...</p>
      </section>
    );
  }

  if (error || !branch) {
    return (
      <section className="space-y-4">
        <Link
          href="/dashboard/branches"
          className="inline-flex items-center gap-2 text-sm text-black/60 hover:text-[#001539]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to branches
        </Link>
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error ?? "Branch not found"}
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/dashboard/branches"
            className="inline-flex items-center gap-2 text-sm text-black/60 hover:text-[#001539]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to branches
          </Link>
          <h1 className="mt-3 font-serif-display text-4xl tracking-tight text-[#001539]">
            {branch.name}
          </h1>
          <p className="mt-1 text-sm text-black/60">
            {branch.active ? "Active" : "Inactive"} ·{" "}
            {formatCodeStats(branch.codeStats)}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => void toggleActive()}
          disabled={isToggling}
        >
          {isToggling
            ? "Updating..."
            : branch.active
              ? "Deactivate"
              : "Activate"}
        </Button>
      </div>

      {toggleError ? (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {toggleError}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <DetailCard title="Location">
          <DetailRow label="Region" value={branch.region} />
          <DetailRow label="Zone" value={branch.zone} />
          <DetailRow label="Woreda" value={branch.woreda} />
        </DetailCard>
        <DetailCard title="Officer">
          <DetailRow label="Full name" value={branch.branchFullName} />
          <DetailRow label="Phone" value={branch.branchPhone} />
          <DetailRow label="Email" value={branch.branchEmail} />
        </DetailCard>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-medium text-[#001539]">
          Registration codes
        </h2>
        <BranchCodesPanel
          listPath={`/api/admin/branches/${branch.id}/codes`}
          generatePath={`/api/admin/branches/${branch.id}/codes`}
          onUnauthorized={() =>
            router.replace(`/login?redirect=/dashboard/branches/${branch.id}`)
          }
          onGenerated={() => {
            void apiClient<Branch>(`/api/admin/branches/${branch.id}`)
              .then(setBranch)
              .catch(() => {
                /* keep existing branch details if refresh fails */
              });
          }}
        />
      </div>
    </section>
  );
}

function DetailCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm shadow-black/5">
      <h2 className="text-sm font-medium uppercase tracking-[0.12em] text-black/45">
        {title}
      </h2>
      <dl className="mt-4 space-y-3">{children}</dl>
    </div>
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
    <div className="grid gap-1 sm:grid-cols-[120px_1fr]">
      <dt className="text-sm text-black/50">{label}</dt>
      <dd className="text-sm text-[#001539]">{value?.trim() ? value : "—"}</dd>
    </div>
  );
}
