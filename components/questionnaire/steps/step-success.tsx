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
        <CheckCircle className="h-20 w-20 text-[#1a3d2b]" strokeWidth={1.5} />
      </div>
      <h2 className="mt-6 font-playfair text-3xl font-semibold text-[#1a3d2b]">
        Assessment Submitted Successfully
      </h2>
      <p className="mt-2 text-base text-[#5a6e62]">
        The household socioeconomic assessment has been recorded.
      </p>
      <div className="mt-6 rounded-xl border border-[#1a3d2b]/15 bg-white px-8 py-4">
        <p className="text-sm text-[#5a6e62]">Assessment / BIN Number</p>
        <p className="mt-1 text-2xl font-semibold text-[#1a3d2b]">{displayId}</p>
      </div>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={onPrint}
          className="min-h-[48px] rounded-xl border-2 border-[#1a3d2b] px-6 py-3 text-base font-medium text-[#1a3d2b] transition hover:bg-[#1a3d2b]/5"
        >
          Print Summary
        </button>
        <button
          type="button"
          onClick={onDownload}
          className="flex min-h-[48px] items-center gap-2 rounded-xl bg-[#c4a040] px-6 py-3 text-base font-semibold text-[#1a3d2b] transition hover:bg-[#b89030]"
        >
          <Download className="h-5 w-5" />
          Download Summary
        </button>
      </div>
    </div>
  );
}
