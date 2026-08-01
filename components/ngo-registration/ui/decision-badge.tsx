"use client";

import type { EligibilityDecision } from "../types";
import { getDecisionLabel } from "../scoring";

const DECISION_STYLES: Record<
  Exclude<EligibilityDecision, "">,
  string
> = {
  approve: "border-[#27ae60] bg-[#27ae60]/15 text-[#001539]",
  conditional: "border-[#e18f35] bg-[#e18f35]/20 text-[#001539]",
  defer: "border-blue-500 bg-blue-500/10 text-[#001539]",
  reject: "border-[#c0392b] bg-[#c0392b]/10 text-[#001539]",
};

type DecisionBadgeProps = {
  score: number;
  decision: EligibilityDecision;
  animatedScore?: number;
};

export function DecisionBadge({ score, decision, animatedScore }: DecisionBadgeProps) {
  const displayScore = animatedScore ?? score;
  const effectiveDecision = decision || "defer";
  const style =
    DECISION_STYLES[effectiveDecision as Exclude<EligibilityDecision, "">] ??
    DECISION_STYLES.defer;

  return (
    <div
      className={`rounded-2xl border-2 px-6 py-5 text-center ${style}`}
      role="status"
      aria-live="polite"
    >
      <p className="text-sm font-medium uppercase tracking-wide opacity-80">
        Eligibility Assessment
      </p>
      <p className="mt-2 text-3xl font-bold">
        Score: {displayScore}/100
      </p>
      <p className="mt-1 text-xl font-semibold">
        {getDecisionLabel(effectiveDecision)}
      </p>
    </div>
  );
}

type DecisionOverrideProps = {
  autoDecision: EligibilityDecision;
  override: EligibilityDecision;
  overrideReason: string;
  onOverrideChange: (value: EligibilityDecision) => void;
  onReasonChange: (value: string) => void;
  error?: string;
};

export function DecisionOverride({
  autoDecision,
  override,
  overrideReason,
  onOverrideChange,
  onReasonChange,
  error,
}: DecisionOverrideProps) {
  const showReason = override !== "" && override !== autoDecision;

  return (
    <div className="mt-4 space-y-3">
      <label htmlFor="decisionOverride" className="block text-base font-medium text-[#001539]">
        Override decision (optional)
      </label>
      <select
        id="decisionOverride"
        value={override}
        onChange={(e) => onOverrideChange(e.target.value as EligibilityDecision)}
        className="form-input w-full"
      >
        <option value="">Use auto recommendation ({getDecisionLabel(autoDecision)})</option>
        <option value="approve">Approve</option>
        <option value="conditional">Conditional Approval</option>
        <option value="defer">Defer</option>
        <option value="reject">Reject</option>
      </select>
      {showReason ? (
        <div>
          <label htmlFor="overrideReason" className="block text-sm font-medium text-[#001539]">
            Reason for override *
          </label>
          <textarea
            id="overrideReason"
            value={overrideReason}
            onChange={(e) => onReasonChange(e.target.value)}
            rows={3}
            className="form-input mt-1 w-full resize-y"
          />
          {error ? (
            <p className="mt-1 text-sm text-[#c0392b]" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
