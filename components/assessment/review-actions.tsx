"use client";

import { useState } from "react";
import { Ban, CheckCircle2, Clock, CornerUpLeft, UserRoundCog, XCircle } from "lucide-react";

import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { FormField } from "@/components/dashboard/form-field";
import { Panel } from "@/components/dashboard/panel";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import type { Assessment, BranchDecision, FieldOfficer } from "@/lib/api/backoffice-types";
import { apiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import type { PaginatedItems } from "@/lib/api/types";
import { useResource } from "@/lib/api/use-resource";
import { OFFICER_RECOMMENDATION, labelFor } from "@/lib/backoffice/options";

function actionPath(id: string, action: string) {
  return `/bff/backoffice/assessments/${encodeURIComponent(id)}/${action}`;
}

type ReviewMode = "return" | BranchDecision;

/** Each outcome has its own endpoint; only approve accepts an empty comment. */
const DECISION_PATH: Record<ReviewMode, string> = {
  APPROVED: "supervisor-approval",
  return: "return",
  REJECTED: "reject",
  DEFERRED: "defer",
};

const REVIEW_COPY: Record<
  ReviewMode,
  {
    title: string;
    description: string;
    confirm: string;
    required: boolean;
    placeholder: string;
    destructive?: boolean;
    /** Shown on the page once the decision is recorded. */
    done: string;
  }
> = {
  return: {
    title: "Return for correction",
    description: "The officer gets the assessment back to edit and resubmit. Tell them what to fix.",
    confirm: "Return to officer",
    done: "Returned to the officer.",
    required: true,
    placeholder: "e.g. Please confirm the kebele with the household",
  },
  APPROVED: {
    title: "Approve household",
    description: "This is the final decision. The household moves to the administrator's disbursement pool queue.",
    confirm: "Approve",
    required: false,
    placeholder: "e.g. Verified on site",
    done: "Approved. The household is now waiting for the disbursement pool.",
  },
  DEFERRED: {
    title: "Defer",
    description: "The household isn't supported now. A new assessment can start later.",
    confirm: "Defer",
    required: true,
    placeholder: "Why is this deferred?",
    done: "Deferred. A new assessment can start later.",
  },
  REJECTED: {
    title: "Reject",
    description: "The household doesn't qualify. This is final for this assessment.",
    confirm: "Reject",
    required: true,
    placeholder: "Why is this rejected?",
    destructive: true,
    done: "Rejected.",
  },
};

/** BRANCH: final decision on a SUBMITTED assessment. */
export function BranchReview({
  assessment,
  onDone,
}: {
  assessment: Assessment;
  onDone: (updated: Assessment, message: string) => void;
}) {
  const [mode, setMode] = useState<ReviewMode | null>(null);
  const [comment, setComment] = useState("");
  const copy = mode ? REVIEW_COPY[mode] : null;
  const system = assessment.score?.preliminaryRecommendation;
  const officer = assessment.recommendation?.officerRecommendation;

  async function confirm() {
    if (!mode) return;
    const updated = await apiClient<Assessment>(actionPath(assessment.id, DECISION_PATH[mode]), {
      method: "POST",
      body: JSON.stringify({ comment: comment.trim() || undefined }),
    });
    setComment("");
    onDone(updated, REVIEW_COPY[mode].done);
  }

  return (
    <Panel
      title="Branch decision"
      description={
        <>
          System recommends <strong>{labelFor(OFFICER_RECOMMENDATION, system)}</strong>
          {officer ? (
            <>
              ; officer recommends <strong>{labelFor(OFFICER_RECOMMENDATION, officer)}</strong>
            </>
          ) : null}
          .
        </>
      }
    >
      <div className="grid gap-2 sm:grid-cols-2">
        <Button onClick={() => setMode("APPROVED")}>
          <CheckCircle2 />
          Approve
        </Button>
        <Button variant="outline" onClick={() => setMode("return")}>
          <CornerUpLeft />
          Return
        </Button>
        <Button variant="outline" onClick={() => setMode("DEFERRED")}>
          <Clock />
          Defer
        </Button>
        <Button variant="outline" className="text-rose-700 hover:text-rose-800" onClick={() => setMode("REJECTED")}>
          <XCircle />
          Reject
        </Button>
      </div>

      <ConfirmDialog
        open={mode !== null}
        onOpenChange={(open) => (open ? null : setMode(null))}
        title={copy?.title ?? ""}
        description={copy?.description}
        confirmLabel={copy?.confirm ?? "Confirm"}
        destructive={copy?.destructive}
        confirmDisabled={!!copy?.required && !comment.trim()}
        onConfirm={confirm}
      >
        <FormField
          label={mode === "return" ? "What needs fixing" : "Reason"}
          htmlFor="review-comment"
          required={copy?.required}
          hint={copy?.required ? "Required" : "Optional"}
        >
          <Textarea
            id="review-comment"
            maxLength={2000}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder={copy?.placeholder}
          />
        </FormField>
      </ConfirmDialog>
    </Panel>
  );
}

/** Cancel a draft (its officer or ADMIN) and reassign open ones (ADMIN). */
export function AssessmentManagement({
  assessment,
  canCancel,
  canReassign,
  onDone,
}: {
  assessment: Assessment;
  canCancel: boolean;
  canReassign: boolean;
  onDone: (updated: Assessment, message: string) => void;
}) {
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reassignOpen, setReassignOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [officerId, setOfficerId] = useState("");
  const { data: officers, error: officersError } = useResource<PaginatedItems<FieldOfficer>>(
    reassignOpen ? "/bff/backoffice/admin/field-officers?active=true&page=1&limit=100" : null,
  );

  if (!canCancel && !canReassign) return null;

  // The backend only accepts an officer assigned to this assessment's branch
  // (or its region), and reassigning to the same officer does nothing.
  const info = assessment.assessmentInfo;
  const branchId = info?.branchId ?? null;
  const currentSub = info?.assessmentOfficerSub ?? info?.officerSub ?? null;
  const candidates = (officers?.items ?? []).filter((officer) => {
    if (currentSub && officer.keycloakSub === currentSub) return false;
    if (!branchId) return true;
    return (officer.assignments ?? []).some(
      (item) =>
        item.active &&
        (String(item.branchId ?? "") === String(branchId) || (!item.branchId && !!info?.region && item.region === info.region)),
    );
  });
  const where = info?.branchName ?? "this branch";

  return (
    <Panel title="Manage">
      <div className="flex flex-wrap gap-2">
        {canReassign ? (
          <Button variant="outline" onClick={() => setReassignOpen(true)}>
            <UserRoundCog />
            Reassign officer
          </Button>
        ) : null}
        {canCancel ? (
          <Button variant="outline" className="text-rose-700 hover:text-rose-800" onClick={() => setCancelOpen(true)}>
            <Ban />
            Cancel draft
          </Button>
        ) : null}
      </div>

      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancel this draft?"
        description="The assessment is kept as Cancelled and the beneficiary goes back to their previous state. A new assessment can be started later."
        confirmLabel="Cancel draft"
        destructive
        confirmDisabled={!reason.trim()}
        onConfirm={async () => {
          const updated = await apiClient<Assessment>(actionPath(assessment.id, "cancel"), {
            method: "POST",
            body: JSON.stringify({ reason: reason.trim() }),
          });
          setReason("");
          onDone(updated, "Draft cancelled.");
        }}
      >
        <FormField label="Reason" htmlFor="cancel-reason" required>
          <Textarea id="cancel-reason" value={reason} onChange={(event) => setReason(event.target.value)} />
        </FormField>
      </ConfirmDialog>

      <ConfirmDialog
        open={reassignOpen}
        onOpenChange={setReassignOpen}
        title="Reassign to another officer"
        description={`Only active officers working in ${where} are listed.`}
        confirmLabel="Reassign"
        confirmDisabled={!officerId}
        onConfirm={async () => {
          try {
            const updated = await apiClient<Assessment>(actionPath(assessment.id, "reassign"), {
              method: "POST",
              body: JSON.stringify({ officerId }),
            });
            setOfficerId("");
            onDone(updated, "Assessment reassigned.");
          } catch (error) {
            // The backend names the officer by number; use their name.
            const name = candidates.find((officer) => officer.id === officerId)?.fullName;
            if (name && error instanceof ApiError && /field officer \d+/i.test(error.message)) {
              throw new Error(error.message.replace(/field officer \d+/i, name));
            }
            throw error;
          }
        }}
      >
        <FormField
          label="Field officer"
          htmlFor="reassign-officer"
          required
          error={officersError?.message}
          hint={officers && candidates.length === 0 ? `No other active officer works in ${where}.` : undefined}
        >
          <NativeSelect id="reassign-officer" value={officerId} onChange={(event) => setOfficerId(event.target.value)}>
            <option value="">
              {!officers ? "Loading…" : candidates.length === 0 ? "No officer available" : "Select an officer"}
            </option>
            {candidates.map((officer) => (
              <option key={officer.id} value={officer.id}>
                {officer.fullName}
                {officer.assignments?.length
                  ? ` — ${officer.assignments
                      .filter((item) => item.active)
                      .map((item) => item.branchName ?? item.region)
                      .filter(Boolean)
                      .join(", ")}`
                  : ""}
              </option>
            ))}
          </NativeSelect>
        </FormField>
      </ConfirmDialog>
    </Panel>
  );
}
