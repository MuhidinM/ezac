"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Pencil, Power } from "lucide-react";

import { BranchCodesPanel } from "@/components/branches/branch-codes-panel";
import { CodeStatTiles } from "@/components/branches/code-stats";
import { EditBranchDialog } from "@/components/branches/edit-branch-dialog";
import { ResetPasswordButton } from "@/components/dashboard/reset-password-button";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { InlineAlert } from "@/components/dashboard/inline-alert";
import { PageHeader } from "@/components/dashboard/page-header";
import { DetailList, Panel } from "@/components/dashboard/panel";
import { RequireRole } from "@/components/dashboard/require-role";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api/client";
import type { Branch } from "@/lib/api/types";
import { useResource } from "@/lib/api/use-resource";

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
  const [editOpen, setEditOpen] = useState(false);

  if (isLoading && !branch) {
    return <div className="h-72 animate-pulse rounded-xl bg-black/[0.04]" />;
  }

  if (!branch) {
    return (
      <section className="space-y-6">
        <PageHeader title="Branch" back={{ href: "/dashboard/branches", label: "Branches" }} />
        <InlineAlert action={<Button variant="outline" size="sm" onClick={reload}>Retry</Button>}>
          {error?.message ?? "Branch not found"}
        </InlineAlert>
      </section>
    );
  }

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
        title={branch.active ? "Deactivate branch?" : "Activate branch?"}
        description={
          branch.active
            ? "The branch officer can no longer sign in to the branch portal and its codes can't be used for new registrations."
            : "The branch officer regains access and its available codes can be used again."
        }
        confirmLabel={branch.active ? "Deactivate" : "Activate"}
        destructive={branch.active}
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
              login={branch.branchPhone ?? ""}
              recipient="branch officer"
            />
            <Button variant="outline" onClick={() => setConfirmToggle(true)}>
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
              { label: "Full name", value: branch.officerName ?? branch.branchFullName },
              { label: "Phone (login)", value: branch.branchPhone },
              { label: "Email", value: branch.branchEmail },
            ]}
          />
        </Panel>
      </div>

      <BranchCodesPanel
        listPath={`${path}/codes`}
        generatePath={`${path}/codes`}
        linkBeneficiaries
        revokeBasePath={`/bff/backoffice/admin/branches/${encodeURIComponent(branch.id)}/codes`}
        onGenerated={reload}
      />
    </section>
  );
}
