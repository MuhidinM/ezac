"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowRightLeft, MapPin, Pencil, Power, Store } from "lucide-react";

import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { useBreadcrumbLabel } from "@/components/dashboard/dashboard-header";
import { InlineAlert } from "@/components/dashboard/inline-alert";
import { PageHeader } from "@/components/dashboard/page-header";
import { DetailList, Panel } from "@/components/dashboard/panel";
import { RequireRole } from "@/components/dashboard/require-role";
import { ResetPasswordButton } from "@/components/dashboard/reset-password-button";
import { assignmentLabel } from "@/components/field-officers/assignment-badges";
import { EditOfficerDialog } from "@/components/field-officers/edit-officer-dialog";
import { OfficerStatsPanel } from "@/components/field-officers/officer-stats";
import { BranchPicker } from "@/components/field-officers/branch-picker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  const path = `/bff/backoffice/admin/field-officers/${encodeURIComponent(id)}`;
  const { data: officer, error, isLoading, reload, mutate } = useResource<FieldOfficer>(path);

  const [confirmToggle, setConfirmToggle] = useState(false);
  // The status when the dialog opened, so its text doesn't flip while it closes.
  const [wasActive, setWasActive] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [busyAssignment, setBusyAssignment] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);
  // Bumped after a move so the performance panel reloads its coverage.
  const [statsKey, setStatsKey] = useState(0);
  useBreadcrumbLabel(officer?.fullName);

  if (isLoading && !officer) {
    return <div className="h-64 animate-pulse rounded-xl bg-black/[0.04]" />;
  }

  if (!officer) {
    const missing = error?.status === 404;
    return (
      <section className="space-y-6">
        <PageHeader
          title="Field officer"
          back={{ href: "/dashboard/field-officers", label: "Field officers" }}
        />
        <InlineAlert action={missing ? undefined : <Button variant="outline" size="sm" onClick={reload}>Retry</Button>}>
          {missing
            ? "This field officer doesn't exist. Check the link, or find the officer in the list."
            : (error?.message ?? "Field officer not found")}
        </InlineAlert>
      </section>
    );
  }

  const openCount = officer.openAssessments ?? 0;
  const openNote =
    openCount > 0
      ? ` They have ${openCount} open assessment${openCount === 1 ? "" : "s"}: reassign ${openCount === 1 ? "it" : "them"} to another officer first, from each assessment's page.`
      : "";

  async function toggleActive() {
    if (!officer) return;
    const updated = await apiClient<FieldOfficer>(path, {
      method: "PATCH",
      body: JSON.stringify({ active: !officer.active }),
    });
    mutate({ ...officer, ...updated });
  }

  async function toggleAssignment(assignment: StaffAssignment) {
    setBusyAssignment(assignment.id);
    setRowError(null);
    try {
      await apiClient<StaffAssignment>(
        `/bff/backoffice/admin/staff-assignments/${encodeURIComponent(assignment.id)}`,
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
  const active = assignments.filter((assignment) => assignment.active);
  const current = active.find((assignment) => assignment.branchId) ?? null;
  // Officers now cover one branch; older accounts may still have extra or region-wide access.
  const extra = active.filter((assignment) => assignment !== current);
  const history = assignments.filter((assignment) => !assignment.active);

  return (
    <section className="space-y-6">
      <ConfirmDialog
        open={confirmToggle}
        onOpenChange={setConfirmToggle}
        title={wasActive ? "Deactivate field officer?" : "Reactivate field officer?"}
        description={
          wasActive
            ? `${officer.fullName} is marked inactive. For now this doesn't stop them signing in or working on assessments: to stop their access, also reset their password. The old password then stops working at once, and a session that is already open ends within 5 minutes. Their branch is kept and comes back if you reactivate them.${openNote}`
            : `${officer.fullName} is marked active again and works in their current branch.`
        }
        confirmLabel={wasActive ? "Deactivate" : "Reactivate"}
        destructive={wasActive}
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
        description="Field officer account and the branch they work in."
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
            <Button
              variant="outline"
              onClick={() => {
                setWasActive(officer.active);
                setConfirmToggle(true);
              }}
            >
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
            {
              label: "Open assessments",
              value:
                officer.openAssessments != null && officer.openAssessments > 0 ? (
                  <Link
                    href={`/dashboard/assessments?officerId=${encodeURIComponent(officer.id)}`}
                    className="text-[#007050] hover:underline"
                  >
                    {officer.openAssessments}
                  </Link>
                ) : (
                  (officer.openAssessments ?? null)
                ),
            },
            { label: "Submitted this month", value: officer.submittedThisMonth ?? null },
          ]}
        />
      </Panel>

      <EditOfficerDialog officer={officer} open={editOpen} onOpenChange={setEditOpen} onSaved={mutate} />

      <OfficerStatsPanel key={statsKey} officerId={officer.id} />

      <Panel
        title="Branch"
        description="A field officer works in one branch and only sees beneficiaries registered there."
        actions={
          <Button size="sm" variant={current ? "outline" : "default"} onClick={() => setMoveOpen(true)}>
            <ArrowRightLeft />
            {current ? "Move to another branch" : "Assign a branch"}
          </Button>
        }
      >
        {rowError ? <InlineAlert className="mb-4">{rowError}</InlineAlert> : null}
        {current ? (
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-[#007050]/10 text-[#007050]">
              <Store className="size-5" />
            </span>
            <div>
              <p className="font-medium text-[#001539]">{assignmentLabel(current)}</p>
              <p className="text-xs text-black/50">Since {formatDateTime(current.createdAt ?? null)}</p>
            </div>
          </div>
        ) : (
          <InlineAlert tone="warning">No branch yet. This officer can&apos;t see any beneficiaries until you assign one.</InlineAlert>
        )}

        {extra.length > 0 ? (
          <div className="mt-5 space-y-3 rounded-lg border border-amber-200 bg-amber-50/50 p-4">
            <p className="text-sm text-[#001539]">
              This officer still has access set up before the one-branch rule. Remove it so they only work in{" "}
              {current ? assignmentLabel(current) : "one branch"}.
            </p>
            <ul className="space-y-2">
              {extra.map((assignment) => (
                <li key={assignment.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="inline-flex items-center gap-2 text-[#001539]">
                    {assignment.branchId ? <Store className="size-4 text-[#007050]" /> : <MapPin className="size-4 text-[#001539]/70" />}
                    {assignmentLabel(assignment)}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-rose-700 hover:text-rose-800"
                    disabled={busyAssignment === assignment.id}
                    onClick={() => void toggleAssignment(assignment)}
                  >
                    Remove access
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {history.length > 0 ? (
          <div className="mt-5 border-t border-black/[0.06] pt-4">
            <p className="mb-2 text-xs font-semibold tracking-wide text-black/45 uppercase">Earlier branches</p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Branch</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>Until</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((assignment) => (
                  <TableRow key={assignment.id} className="text-black/60">
                    <TableCell>{assignmentLabel(assignment)}</TableCell>
                    <TableCell>{formatDateTime(assignment.createdAt ?? null)}</TableCell>
                    <TableCell>{formatDateTime(assignment.deactivatedAt ?? null)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : null}
      </Panel>

      {moveOpen ? (
        <MoveBranchDialog
          officer={officer}
          current={current}
          others={extra}
          onClose={() => setMoveOpen(false)}
          onMoved={(message) => {
            setMoveOpen(false);
            setRowError(message);
            reload();
            setStatsKey((value) => value + 1);
          }}
        />
      ) : null}
    </section>
  );
}

/**
 * Moves an officer to one branch: the new branch is added first so they never
 * lose access in between, then every other active assignment is ended.
 */
function MoveBranchDialog({
  officer,
  current,
  others,
  onClose,
  onMoved,
}: {
  officer: FieldOfficer;
  current: StaffAssignment | null;
  others: StaffAssignment[];
  onClose: () => void;
  /** Called with an error message when the move only partly worked, else null. */
  onMoved: (message: string | null) => void;
}) {
  const [branchId, setBranchId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  async function move() {
    setError(null);
    setFieldErrors({});
    setIsSaving(true);
    try {
      await apiClient<FieldOfficer>(`/bff/backoffice/admin/field-officers/${encodeURIComponent(officer.id)}/assignments`, {
        method: "POST",
        body: JSON.stringify({ branchId }),
      });
    } catch (addError) {
      setError(errorMessage(addError, "Couldn't assign the branch"));
      if (addError instanceof ApiError) setFieldErrors(fieldErrorMap(addError.errors));
      setIsSaving(false);
      return;
    }
    const toEnd = [current, ...others].filter((item): item is StaffAssignment => item !== null);
    const failed: string[] = [];
    for (const assignment of toEnd) {
      try {
        await apiClient(`/bff/backoffice/admin/staff-assignments/${encodeURIComponent(assignment.id)}`, {
          method: "PATCH",
          body: JSON.stringify({ active: false }),
        });
      } catch {
        failed.push(assignmentLabel(assignment));
      }
    }
    setIsSaving(false);
    onMoved(failed.length ? `The new branch was added, but access to ${failed.join(", ")} couldn't be removed. Remove it below.` : null);
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#001539]">{current ? "Move to another branch" : "Assign a branch"}</DialogTitle>
          <DialogDescription>
            {current
              ? `${officer.fullName} stops seeing ${assignmentLabel(current)} beneficiaries and starts on the new branch.${
                  (officer.openAssessments ?? 0) > 0
                    ? ` Their ${officer.openAssessments} open assessment${officer.openAssessments === 1 ? "" : "s"} stay in their name, but they lose access to those households. Reassign them to an officer of ${assignmentLabel(current)} first, from each assessment's page.`
                    : ""
                }`
              : `${officer.fullName} will see beneficiaries registered in this branch.`}
          </DialogDescription>
        </DialogHeader>
        {error ? <InlineAlert>{error}</InlineAlert> : null}
        <BranchPicker value={branchId} onChange={setBranchId} exclude={current?.branchId ?? null} label="New branch" error={fieldErrors.branchId} />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => void move()} disabled={isSaving || !branchId}>
            {isSaving ? "Saving…" : current ? "Move" : "Assign"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
