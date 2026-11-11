"use client";

import { useState } from "react";
import { ChevronDown, Plus } from "lucide-react";

import { isFieldOfficer } from "@/components/dashboard/nav-config";
import { Panel } from "@/components/dashboard/panel";
import { useMyUserId } from "@/lib/auth/use-my-user-id";
import { WhitelistEntryCard } from "@/components/whitelist/whitelist-entry-card";
import { requestPath, WhitelistFormDialog } from "@/components/whitelist/whitelist-form-dialog";
import { Button } from "@/components/ui/button";
import type { BeneficiaryWhitelist, PoolStatus, WhitelistEntry } from "@/lib/api/backoffice-types";
import type { BeneficiaryDetail } from "@/lib/api/types";
import { useResource } from "@/lib/api/use-resource";
import { useSession } from "@/lib/auth/use-session";
import { isLivePoolStatus, whitelistBlockedReason, type HouseholdState } from "@/lib/backoffice/assessment-steps";
import { cn } from "@/lib/utils";

/**
 * Whitelist state for one household. FIELD_OFFICER / BRANCH request it and
 * ADMIN decides; ADMIN can also add it directly. It never changes the score.
 *
 * `household` (verification, lifecycle and duplicate status) hides Request
 * and Add for households the backend refuses. Without it, staff load it here;
 * BRANCH can't read beneficiary records, so for them the backend decides.
 *
 * `livePoolStatus` (an assessment's pool status) and the household's own pool
 * status tell whether an assessment row is the household's live pool row; a
 * declined or removed fast-track entry then doesn't show its old pool badge.
 *
 * `onChanged` runs after a request, decision or revocation, for pages that
 * read the whitelist too.
 */
export function WhitelistPanel({
  beneficiaryId,
  beneficiaryName,
  household,
  livePoolStatus,
  onChanged,
}: {
  beneficiaryId: string;
  beneficiaryName?: string | null;
  household?: HouseholdState | null;
  livePoolStatus?: PoolStatus | null;
  onChanged?: () => void;
}) {
  const { session } = useSession();
  const { data, error, reload } = useResource<BeneficiaryWhitelist>(requestPath(beneficiaryId));
  const { data: loadedHousehold } = useResource<BeneficiaryDetail>(
    household === undefined && session?.isStaff
      ? `/bff/beneficiaries/${encodeURIComponent(beneficiaryId)}`
      : null,
  );
  const [formOpen, setFormOpen] = useState(false);
  const myId = useMyUserId();
  const [showHistory, setShowHistory] = useState(false);

  const canDecide = session?.isAdmin ?? false;
  const mayAsk = canDecide || isFieldOfficer(session) || (session?.isBranch ?? false);
  // Only offer a new entry once we know there isn't one already.
  const loaded = !!data && !error;
  const householdState = household === undefined ? loadedHousehold : household;
  const blockedReason = whitelistBlockedReason(householdState);
  const pooledElsewhere = isLivePoolStatus(livePoolStatus) || isLivePoolStatus(householdState?.poolStatus);
  // An entry's Pool declined / Removed from pool is stale once another row is the live one.
  const stalePool = (entry: WhitelistEntry) =>
    pooledElsewhere && (entry.poolStatus === "DECLINED" || entry.poolStatus === "REMOVED");
  const canOpenForm = mayAsk && loaded && !data.current && !blockedReason;
  const canAdd = canDecide && canOpenForm;
  const canRequest = !canDecide && canOpenForm;
  const history = (data?.history ?? []).filter((entry) => entry.id !== data?.current?.id);
  const changed = () => {
    reload();
    onChanged?.();
  };

  return (
    <Panel
      title="Whitelist"
      description="A verified need outside the score. It changes pool order, never the score."
      actions={
        canRequest || canAdd ? (
          <Button size="sm" variant="outline" onClick={() => setFormOpen(true)}>
            <Plus />
            {canAdd ? "Add" : "Request"}
          </Button>
        ) : null
      }
    >
      {error ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-black/60">
          <span>Couldn&apos;t load the whitelist status. {error.message}</span>
          <Button size="sm" variant="ghost" onClick={reload}>
            Try again
          </Button>
        </div>
      ) : data?.current ? (
        <WhitelistEntryCard
          entry={data.current}
          canDecide={canDecide}
          myId={myId}
          onReload={reload}
          onChanged={changed}
          hidePoolStatus={stalePool(data.current)}
        />
      ) : data ? (
        <p className="text-sm text-black/60">Not whitelisted.</p>
      ) : (
        <div className="h-5 w-32 animate-pulse rounded bg-black/[0.05]" role="status" aria-label="Loading" />
      )}

      {mayAsk && loaded && !data.current && blockedReason ? (
        <p className="mt-2 text-xs text-black/60">{blockedReason}</p>
      ) : null}

      {history.length > 0 ? (
        <div className="mt-4 border-t border-black/[0.06] pt-3">
          <button
            type="button"
            onClick={() => setShowHistory((value) => !value)}
            className="inline-flex items-center gap-1 text-xs font-medium text-black/60 hover:text-navy"
            aria-expanded={showHistory}
          >
            <ChevronDown className={cn("size-3.5 transition", showHistory && "rotate-180")} />
            History ({history.length})
          </button>
          {showHistory ? (
            <ul className="mt-3 space-y-4">
              {history.map((entry) => (
                <li key={entry.id} className="border-l-2 border-black/10 pl-3">
                  <WhitelistEntryCard
                    entry={entry}
                    canDecide={false}
                    onChanged={changed}
                    hidePoolStatus={stalePool(entry)}
                    compact
                  />
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <WhitelistFormDialog
        mode={canAdd ? "admin" : "request"}
        beneficiary={{ id: beneficiaryId, name: beneficiaryName ?? `Beneficiary #${beneficiaryId}` }}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSaved={() => {
          setFormOpen(false);
          changed();
        }}
      />
    </Panel>
  );
}
