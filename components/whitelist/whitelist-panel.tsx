"use client";

import { useState } from "react";
import { ChevronDown, Plus } from "lucide-react";

import { isFieldOfficer } from "@/components/dashboard/nav-config";
import { Panel } from "@/components/dashboard/panel";
import { WhitelistEntryCard } from "@/components/whitelist/whitelist-entry-card";
import { requestPath, WhitelistFormDialog } from "@/components/whitelist/whitelist-form-dialog";
import { Button } from "@/components/ui/button";
import type { BeneficiaryWhitelist } from "@/lib/api/backoffice-types";
import { useResource } from "@/lib/api/use-resource";
import { useSession } from "@/lib/auth/use-session";
import { cn } from "@/lib/utils";

/**
 * Whitelist state for one household. FIELD_OFFICER / BRANCH request it and
 * ADMIN decides; ADMIN can also add it directly. It never changes the score.
 */
export function WhitelistPanel({ beneficiaryId, beneficiaryName }: { beneficiaryId: string; beneficiaryName?: string | null }) {
  const { session } = useSession();
  const { data, error, reload } = useResource<BeneficiaryWhitelist>(requestPath(beneficiaryId));
  const [formOpen, setFormOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const canDecide = session?.isAdmin ?? false;
  const canRequest = (isFieldOfficer(session) || (session?.isBranch ?? false)) && !data?.current;
  const canAdd = canDecide && !data?.current;
  const history = (data?.history ?? []).filter((entry) => entry.id !== data?.current?.id);

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
        <p className="text-sm text-black/45">{error.message}</p>
      ) : data?.current ? (
        <WhitelistEntryCard entry={data.current} canDecide={canDecide} onChanged={() => reload()} />
      ) : (
        <p className="text-sm text-black/45">Not whitelisted.</p>
      )}

      {history.length > 0 ? (
        <div className="mt-4 border-t border-black/[0.06] pt-3">
          <button
            type="button"
            onClick={() => setShowHistory((value) => !value)}
            className="inline-flex items-center gap-1 text-xs font-medium text-black/55 hover:text-[#001539]"
            aria-expanded={showHistory}
          >
            <ChevronDown className={cn("size-3.5 transition", showHistory && "rotate-180")} />
            History ({history.length})
          </button>
          {showHistory ? (
            <ul className="mt-3 space-y-4">
              {history.map((entry) => (
                <li key={entry.id} className="border-l-2 border-black/10 pl-3">
                  <WhitelistEntryCard entry={entry} canDecide={false} onChanged={() => reload()} compact />
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
          reload();
        }}
      />
    </Panel>
  );
}

