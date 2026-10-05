"use client";

import { useState } from "react";
import { CornerUpLeft, Gavel, ShieldCheck } from "lucide-react";

import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { FormField } from "@/components/dashboard/form-field";
import { InlineAlert } from "@/components/dashboard/inline-alert";
import { Panel } from "@/components/dashboard/panel";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Assessment, CommitteeDecision } from "@/lib/api/backoffice-types";
import { apiClient } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";
import { COMMITTEE_DECISION, OFFICER_RECOMMENDATION, labelFor } from "@/lib/backoffice/options";
import { cn } from "@/lib/utils";

function actionPath(id: string, action: string) {
  return `/api/backoffice/assessments/${encodeURIComponent(id)}/${action}`;
}

/** BRANCH: return a SUBMITTED assessment or approve it for the committee. */
export function SupervisorReview({
  assessment,
  onDone,
}: {
  assessment: Assessment;
  onDone: (updated: Assessment) => void;
}) {
  const [mode, setMode] = useState<"return" | "approve" | null>(null);
  const [comment, setComment] = useState("");

  async function confirm() {
    const updated = await apiClient<Assessment>(
      actionPath(assessment.id, mode === "return" ? "return" : "supervisor-approval"),
      { method: "POST", body: JSON.stringify({ comment: comment.trim() || undefined }) },
    );
    setComment("");
    onDone(updated);
  }

  return (
    <Panel
      title="Supervisor review"
      description="Check the responses and score, then send it on to the committee or back to the officer."
    >
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => setMode("return")}>
          <CornerUpLeft />
          Return for correction
        </Button>
        <Button onClick={() => setMode("approve")}>
          <ShieldCheck />
          Approve for committee
        </Button>
      </div>

      <ConfirmDialog
        open={mode !== null}
        onOpenChange={(open) => (open ? null : setMode(null))}
        title={mode === "return" ? "Return for correction" : "Approve for committee"}
        description={
          mode === "return"
            ? "The officer gets the assessment back to edit and resubmit. Tell them what to fix."
            : "The assessment moves to the committee queue for a final decision."
        }
        confirmLabel={mode === "return" ? "Return to officer" : "Approve"}
        confirmDisabled={mode === "return" && !comment.trim()}
        onConfirm={confirm}
      >
        <FormField
          label="Comment"
          htmlFor="review-comment"
          required={mode === "return"}
          hint={mode === "return" ? "Required" : "Optional, visible to the committee"}
        >
          <Textarea
            id="review-comment"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder={mode === "return" ? "e.g. Please confirm the kebele with the household" : "e.g. Verified on site"}
          />
        </FormField>
      </ConfirmDialog>
    </Panel>
  );
}

/** ADMIN: final committee decision on a SUPERVISOR_APPROVED assessment. */
export function CommitteeDecisionForm({
  assessment,
  onDone,
}: {
  assessment: Assessment;
  onDone: (updated: Assessment) => void;
}) {
  const officerRecommendation = assessment.recommendation?.officerRecommendation;
  const systemRecommendation = assessment.score?.preliminaryRecommendation;
  const [decision, setDecision] = useState<CommitteeDecision | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit() {
    if (!decision || !reason.trim()) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const updated = await apiClient<Assessment>(actionPath(assessment.id, "decision"), {
        method: "POST",
        body: JSON.stringify({ decision, reason: reason.trim() }),
      });
      onDone(updated);
    } catch (decisionError) {
      setError(errorMessage(decisionError, "Couldn't record the decision"));
    } finally {
      setIsSubmitting(false);
    }
  }

  const tones: Record<CommitteeDecision, string> = {
    APPROVED: "border-emerald-500 bg-emerald-50/70 ring-emerald-500",
    CONDITIONALLY_APPROVED: "border-[#007050] bg-[#007050]/[0.05] ring-[#007050]",
    DEFERRED: "border-amber-500 bg-amber-50/70 ring-amber-500",
    REJECTED: "border-rose-500 bg-rose-50/70 ring-rose-500",
  };

  return (
    <Panel
      title={
        <span className="inline-flex items-center gap-2">
          <Gavel className="size-4 text-black/45" />
          Committee decision
        </span>
      }
      description={
        <>
          System recommends <strong>{labelFor(OFFICER_RECOMMENDATION, systemRecommendation)}</strong>
          {officerRecommendation ? (
            <>
              ; officer recommends <strong>{labelFor(OFFICER_RECOMMENDATION, officerRecommendation)}</strong>
            </>
          ) : null}
          .
        </>
      }
    >
      <div className="space-y-4">
        {error ? <InlineAlert>{error}</InlineAlert> : null}
        <div role="radiogroup" aria-label="Decision" className="grid gap-2 sm:grid-cols-2">
          {COMMITTEE_DECISION.map((option) => {
            const key = option.value as CommitteeDecision;
            const selected = decision === key;
            return (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setDecision(key)}
                className={cn(
                  "rounded-lg border px-4 py-3 text-left text-sm font-medium text-[#001539] transition",
                  selected ? cn("ring-1", tones[key]) : "border-black/10 hover:border-black/20",
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
        <FormField label="Reason" htmlFor="decision-reason" required hint="Recorded with the decision">
          <Textarea
            id="decision-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="e.g. Meets EZAC criteria"
          />
        </FormField>
        <p className="text-xs text-black/50">
          Approved and conditionally approved beneficiaries become Active; deferred and rejected ones are marked Assessed.
        </p>
        <div className="flex justify-end">
          <Button onClick={() => void submit()} disabled={!decision || !reason.trim() || isSubmitting}>
            <Gavel />
            {isSubmitting ? "Recording…" : "Record decision"}
          </Button>
        </div>
      </div>
    </Panel>
  );
}
