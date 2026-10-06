"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { MapPin, Pencil, Plus, Power, Store } from "lucide-react";

import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { InlineAlert } from "@/components/dashboard/inline-alert";
import { PageHeader } from "@/components/dashboard/page-header";
import { DetailList, Panel } from "@/components/dashboard/panel";
import { RequireRole } from "@/components/dashboard/require-role";
import { TableMessageRow } from "@/components/dashboard/table-states";
import { ResetPasswordButton } from "@/components/dashboard/reset-password-button";
import { assignmentLabel } from "@/components/field-officers/assignment-badges";
import { EditOfficerDialog } from "@/components/field-officers/edit-officer-dialog";
import { OfficerStatsPanel } from "@/components/field-officers/officer-stats";
import {
  EMPTY_SCOPE,
  ScopePicker,
  scopeBody,
  type ScopeValue,
} from "@/components/field-officers/scope-picker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { FieldOfficer, StaffAssignment } from "@/lib/api/backoffice-types";
import { apiClient } from "@/lib/api/client";
import { ApiError, errorMessage, fieldErrorMap } from "@/lib/api/errors";
import { useResource } from "@/lib/api/use-resource";
import { formatDateTime } from "@/lib/beneficiary/format";

export default function FieldOfficerDetailPage() {
  return (
    <RequireRole audience={["admin"]}>
      <FieldOfficerDetail />
    </RequireRole>
  );
}

function FieldOfficerDetail() {
  const { id } = useParams<{ id: string }>();
  const path = `/api/backoffice/admin/field-officers/${encodeURIComponent(id)}`;
  const { data: officer, error, isLoading, reload, mutate } = useResource<FieldOfficer>(path);

  const [confirmToggle, setConfirmToggle] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [scope, setScope] = useState<ScopeValue>(EMPTY_SCOPE);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [assignFieldErrors, setAssignFieldErrors] = useState<Record<string, string>>({});
  const [isAssigning, setIsAssigning] = useState(false);
  const [busyAssignment, setBusyAssignment] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);

  if (isLoading && !officer) {
    return <div className="h-64 animate-pulse rounded-xl bg-black/[0.04]" />;
  }

  if (!officer) {
    return (
      <section className="space-y-6">
        <PageHeader
          title="Field officer"
          back={{ href: "/dashboard/field-officers", label: "Field officers" }}
        />
        <InlineAlert action={<Button variant="outline" size="sm" onClick={reload}>Retry</Button>}>
          {error?.message ?? "Field officer not found"}
        </InlineAlert>
      </section>
    );
  }

  async function toggleActive() {
    if (!officer) return;
    const updated = await apiClient<FieldOfficer>(path, {
      method: "PATCH",
      body: JSON.stringify({ active: !officer.active }),
    });
    mutate({ ...officer, ...updated });
  }

  async function addAssignment() {
    setAssignError(null);
    setAssignFieldErrors({});
    const body = scopeBody(scope);
    if (!body.branchId && !body.region) {
      setAssignError(scope.kind === "branch" ? "Select a branch." : "Select a region.");
      return;
    }
    setIsAssigning(true);
    try {
      const updated = await apiClient<FieldOfficer>(`${path}/assignments`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      mutate(updated);
      setScope(EMPTY_SCOPE);
    } catch (submitError) {
      setAssignError(errorMessage(submitError, "Failed to add assignment"));
      if (submitError instanceof ApiError) {
        setAssignFieldErrors(fieldErrorMap(submitError.errors));
      }
    } finally {
      setIsAssigning(false);
    }
  }

  async function toggleAssignment(assignment: StaffAssignment) {
    setBusyAssignment(assignment.id);
    setRowError(null);
    try {
      await apiClient<StaffAssignment>(
        `/api/backoffice/admin/staff-assignments/${encodeURIComponent(assignment.id)}`,
        { method: "PATCH", body: JSON.stringify({ active: !assignment.active }) },
      );
      reload();
    } catch (toggleError) {
      setRowError(errorMessage(toggleError, "Failed to update assignment"));
    } finally {
      setBusyAssignment(null);
    }
  }

  const assignments = officer.assignments ?? [];

  return (
    <section className="space-y-6">
      <ConfirmDialog
        open={confirmToggle}
        onOpenChange={setConfirmToggle}
        title={officer.active ? "Deactivate field officer?" : "Reactivate field officer?"}
        description={
          officer.active
            ? `${officer.fullName} will immediately lose access to every beneficiary and assessment. Their assignments are kept and come back if you reactivate them.`
            : `${officer.fullName} will regain access to beneficiaries in their active assignments.`
        }
        confirmLabel={officer.active ? "Deactivate" : "Reactivate"}
        destructive={officer.active}
        onConfirm={toggleActive}
      />

      <PageHeader
        back={{ href: "/dashboard/field-officers", label: "Field officers" }}
        title={officer.fullName}
        meta={
          <Badge tone={officer.active ? "success" : "neutral"}>
            {officer.active ? "Active" : "Inactive"}
          </Badge>
        }
        description="Field officer account and the areas they can assess."
        actions={
          <>
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil />
              Edit
            </Button>
            <ResetPasswordButton
              path={`${path}/reset-password`}
              login={officer.username ?? officer.phone ?? ""}
              recipient="field officer"
            />
            <Button variant="outline" onClick={() => setConfirmToggle(true)}>
              <Power />
              {officer.active ? "Deactivate" : "Reactivate"}
            </Button>
          </>
        }
      />

      <Panel title="Account">
        <DetailList
          columns={4}
          items={[
            { label: "Login", value: officer.username ?? officer.phone },
            { label: "Phone", value: officer.phone },
            { label: "Email", value: officer.email },
            { label: "Created", value: formatDateTime(officer.createdAt ?? null) },
            { label: "Open assessments", value: officer.openAssessments ?? null },
            { label: "Submitted this month", value: officer.submittedThisMonth ?? null },
          ]}
        />
      </Panel>

      <EditOfficerDialog officer={officer} open={editOpen} onOpenChange={setEditOpen} onSaved={mutate} />

      <OfficerStatsPanel officerId={officer.id} />

      <Panel
        title="Assignments"
        description="Branch assignments cover one branch; region assignments cover every branch in that region."
        flush
      >
        {rowError ? (
          <div className="px-5 pt-4">
            <InlineAlert>{rowError}</InlineAlert>
          </div>
        ) : null}
        <Table>
          <TableHeader>
            <TableRow className="bg-black/[0.015]">
              <TableHead className="pl-5">Scope</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Added</TableHead>
              <TableHead className="pr-5 text-right">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assignments.length === 0 ? (
              <TableMessageRow colSpan={5}>
                No assignments yet. This officer can&apos;t see any beneficiaries until you add one.
              </TableMessageRow>
            ) : (
              assignments.map((assignment) => (
                <TableRow key={assignment.id} className={assignment.active ? undefined : "opacity-60"}>
                  <TableCell className="pl-5 font-medium text-[#001539]">
                    <span className="inline-flex items-center gap-2">
                      {assignment.branchId ? (
                        <Store className="size-4 text-[#007050]" />
                      ) : (
                        <MapPin className="size-4 text-[#001539]/70" />
                      )}
                      {assignmentLabel(assignment)}
                    </span>
                  </TableCell>
                  <TableCell>{assignment.branchId ? "Branch" : "Region"}</TableCell>
                  <TableCell>
                    <Badge tone={assignment.active ? "success" : "neutral"}>
                      {assignment.active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDateTime(assignment.createdAt ?? null)}</TableCell>
                  <TableCell className="pr-5 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={busyAssignment === assignment.id}
                      onClick={() => void toggleAssignment(assignment)}
                    >
                      {assignment.active ? "Deactivate" : "Reactivate"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <div className="space-y-3 border-t border-black/[0.06] bg-black/[0.015] px-5 py-4">
          <p className="text-sm font-medium text-[#001539]">Add assignment</p>
          {assignError ? <InlineAlert>{assignError}</InlineAlert> : null}
          <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
            <ScopePicker value={scope} onChange={setScope} errors={assignFieldErrors} />
            <Button onClick={() => void addAssignment()} disabled={isAssigning}>
              <Plus />
              {isAssigning ? "Adding…" : "Add"}
            </Button>
          </div>
        </div>
      </Panel>
    </section>
  );
}
