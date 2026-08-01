"use client";

import { CheckCircle, Download, RotateCcw } from "lucide-react";

import { getDecisionLabel } from "../scoring";
import type { EligibilityDecision } from "../types";

type StepSuccessProps = {
  referenceNumber: string;
  orgName: string;
  contactName: string;
  submittedAt: string;
  score: number;
  decision: EligibilityDecision;
  onPrint: () => void;
  onStartNew: () => void;
};

export function StepSuccess({
  referenceNumber,
  orgName,
  contactName,
  submittedAt,
  score,
  decision,
  onPrint,
  onStartNew,
}: StepSuccessProps) {
  const decisionStyle =
    decision === "approve"
      ? "border-[#27ae60] bg-[#27ae60]/15"
      : decision === "conditional"
        ? "border-[#c4a040] bg-[#c4a040]/20"
        : decision === "defer"
          ? "border-blue-500 bg-blue-500/10"
          : "border-[#c0392b] bg-[#c0392b]/10";

  return (
    <div className="flex flex-col items-center py-12 text-center">
      <div className="animate-checkmark-pop">
        <CheckCircle className="h-20 w-20 text-[#27ae60]" strokeWidth={1.5} />
      </div>
      <h2 className="mt-6 font-playfair text-3xl font-semibold text-[#1a3d2b]">
        Application Submitted Successfully
      </h2>
      <p className="mt-2 text-base text-[#5a6e62]">
        Your NGO aid application has been recorded.
      </p>

      <div className="mt-6 w-full max-w-md rounded-xl border border-[#1a3d2b]/15 bg-white px-6 py-4">
        <p className="text-sm text-[#5a6e62]">Application Reference Number</p>
        <p className="mt-1 text-xl font-semibold text-[#1a3d2b]">{referenceNumber}</p>
      </div>

      <div className={`mt-4 w-full max-w-md rounded-2xl border-2 px-6 py-4 ${decisionStyle}`}>
        <p className="text-lg font-bold">
          Score: {score}/100 — {getDecisionLabel(decision)}
        </p>
      </div>

      <div className="mt-6 w-full max-w-md rounded-xl border border-[#1a3d2b]/10 bg-white px-6 py-4 text-left text-sm text-[#5a6e62]">
        <p><span className="font-medium text-[#1a3d2b]">Organization:</span> {orgName}</p>
        <p className="mt-1"><span className="font-medium text-[#1a3d2b]">Contact:</span> {contactName}</p>
        <p className="mt-1"><span className="font-medium text-[#1a3d2b]">Submitted:</span> {new Date(submittedAt).toLocaleString()}</p>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={onPrint}
          className="flex min-h-[48px] items-center gap-2 rounded-xl border-2 border-[#1a3d2b] px-6 py-3 text-base font-medium text-[#1a3d2b] transition hover:bg-[#1a3d2b]/5"
        >
          <Download className="h-5 w-5" />
          Download Summary
        </button>
        <button
          type="button"
          onClick={onStartNew}
          className="flex min-h-[48px] items-center gap-2 rounded-xl bg-[#c4a040] px-6 py-3 text-base font-semibold text-[#1a3d2b] transition hover:bg-[#b89030]"
        >
          <RotateCcw className="h-5 w-5" />
          Start New Application
        </button>
      </div>
    </div>
  );
}
