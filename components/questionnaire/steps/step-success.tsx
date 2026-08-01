"use client";

import { CheckCircle, Download } from "lucide-react";

type StepSuccessProps = {
  assessmentNumber: string;
  beneficiaryId: string;
  onPrint: () => void;
  onDownload: () => void;
};

export function StepSuccess({
  assessmentNumber,
  beneficiaryId,
  onPrint,
  onDownload,
}: StepSuccessProps) {
  const displayId = assessmentNumber || beneficiaryId || "N/A";

  return (
    <div className="flex flex-col items-center py-12 text-center">
      <div className="animate-checkmark-pop">
        <CheckCircle className="h-20 w-20 text-[#001539]" strokeWidth={1.5} />
      </div>
      <h2 className="mt-6 font-serif-display text-3xl font-semibold text-[#001539]">
        Assessment Submitted Successfully
      </h2>
      <p className="mt-2 text-base text-black/55">
        The household socioeconomic assessment has been recorded.
      </p>
      <div className="mt-6 rounded-xl border border-black/10 bg-white px-8 py-4">
        <p className="text-sm text-black/55">Assessment / BIN Number</p>
        <p className="mt-1 text-2xl font-semibold text-[#001539]">{displayId}</p>
      </div>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={onPrint}
          className="min-h-[48px] rounded-xl border-2 border-black/10 px-6 py-3 text-base font-medium text-[#001539] transition hover:bg-[#007050]/5"
        >
          Print Summary
        </button>
        <button
          type="button"
          onClick={onDownload}
          className="flex min-h-[48px] items-center gap-2 rounded-xl bg-[#e18f35] px-6 py-3 text-base font-semibold text-[#001539] transition hover:bg-[#b89030]"
        >
          <Download className="h-5 w-5" />
          Download Summary
        </button>
      </div>
    </div>
  );
}
