"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Pencil, Power } from "lucide-react";

import { BranchCodesPanel } from "@/components/branches/branch-codes-panel";
import { CodeStatTiles } from "@/components/branches/code-stats";
import { EditBranchDialog } from "@/components/branches/edit-branch-dialog";
import { ResetPasswordButton } from "@/components/dashboard/reset-password-button";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { useBreadcrumbLabel } from "@/components/dashboard/dashboard-header";
import { InlineAlert } from "@/components/dashboard/inline-alert";
import { PageHeader } from "@/components/dashboard/page-header";
import { DetailList, Panel } from "@/components/dashboard/panel";
import { RequireRole } from "@/components/dashboard/require-role";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api/client";
import type { Branch } from "@/lib/api/types";
import { useResource } from "@/lib/api/use-resource";
import { branchContact } from "@/lib/branches/contact";

export default function BranchDetailPage() {
  return (
    <RequireRole audience={["admin"]}>
      <BranchDetail />
    </RequireRole>
  );
}

function BranchDetail() {
  const { id } = useParams<{ id: string }>();
  const path = `/bff/admin/branches/${encodeURIComponent(id)}`;
  const { data: branch, error, isLoading, reload, mutate } = useResource<Branch>(path);
  const [confirmToggle, setConfirmToggle] = useState(false);
  // The status when the dialog opened, so its text doesn't flip while it closes.
  const [wasActive, setWasActive] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  useBreadcrumbLabel(branch?.name);

  if (isLoading && !branch) {
    return <div className="h-72 animate-pulse rounded-xl bg-black/[0.04]" />;
  }

  if (!branch) {
    const missing = error?.status === 404;
    return (
      <section className="space-y-6">
        <PageHeader title="Branch" back={{ href: "/dashboard/branches", label: "Branches" }} />
        <InlineAlert action={missing ? undefined : <Button variant="outline" size="sm" onClick={reload}>Retry</Button>}>
          {missing ? "This branch doesn't exist. Check the link, or find the branch in the list." : (error?.message ?? "Branch not found")}
        </InlineAlert>
      </section>
    );
  }

  const contact = branchContact(branch);

  async function toggleActive() {
    if (!branch) return;
    const updated = await apiClient<Branch>(path, {
      method: "PATCH",
      body: JSON.stringify({ active: !branch.active }),
    });
    mutate(updated);
  }

  return (
    <section className="space-y-6">
      <ConfirmDialog
        open={confirmToggle}
        onOpenChange={setConfirmToggle}
        title={wasActive ? "Deactivate branch?" : "Activate branch?"}
        description={
          wasActive
            ? "The branch is marked inactive and you can't generate new codes for it. For now this doesn't stop the branch officer signing in: to stop their access, also reset their password. To stop its unused codes being used, revoke them below."
            : "The branch is marked active again and you can generate codes for it."
        }
        confirmLabel={wasActive ? "Deactivate" : "Activate"}
        destructive={wasActive}
        onConfirm={toggleActive}
      />

      <PageHeader
        back={{ href: "/dashboard/branches", label: "Branches" }}
        title={branch.name}
        meta={<Badge tone={branch.active ? "success" : "neutral"}>{branch.active ? "Active" : "Inactive"}</Badge>}
        description={[branch.woreda, branch.zone, branch.region].filter(Boolean).join(", ")}
        actions={
          <>
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil />
              Edit
            </Button>
            <ResetPasswordButton
              path={`/bff/backoffice/admin/branches/${encodeURIComponent(branch.id)}/reset-password`}
              login={contact.phone ?? ""}
              recipient="branch officer"
            />
            <Button
              variant="outline"
              onClick={() => {
                setWasActive(branch.active);
                setConfirmToggle(true);
              }}
            >
              <Power />
              {branch.active ? "Deactivate" : "Activate"}
            </Button>
          </>
        }
      />

      <EditBranchDialog branch={branch} open={editOpen} onOpenChange={setEditOpen} onSaved={mutate} />

      <CodeStatTiles stats={branch.codeStats} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Location">
          <DetailList
            items={[
              { label: "Region", value: branch.region },
              { label: "Zone", value: branch.zone },
              { label: "Woreda", value: branch.woreda },
            ]}
          />
        </Panel>
        <Panel title="Branch officer" description="Signs in to the branch portal with this phone number.">
          <DetailList
            items={[
              { label: "Full name", value: contact.fullName },
              { label: "Phone (login)", value: contact.phone },
              { label: "Email", value: contact.email },
            ]}
          />
        </Panel>
      </div>

      <BranchCodesPanel
        listPath={`${path}/codes`}
        generatePath={branch.active ? `${path}/codes` : undefined}
        generateBlockedNote={branch.active ? undefined : "This branch is inactive. Activate it to generate new codes."}
        linkBeneficiaries
        revokeBasePath={`/bff/backoffice/admin/branches/${encodeURIComponent(branch.id)}/codes`}
        availableCount={branch.codeStats?.available ?? null}
        onGenerated={reload}
      />
    </section>
  );
}
