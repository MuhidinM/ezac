"use client";

type StepNavigationProps = {
  onPrevious?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  showPrevious?: boolean;
  isSubmitting?: boolean;
};

export function StepNavigation({
  onPrevious,
  onNext,
  nextLabel = "Next",
  showPrevious = true,
  isSubmitting,
}: StepNavigationProps) {
  return (
    <div className="flex gap-3">
      {showPrevious && onPrevious ? (
        <button
          type="button"
          onClick={onPrevious}
          className="min-h-[48px] flex-1 rounded-xl border-2 border-[#1a3d2b] bg-transparent px-6 py-3 text-base font-medium text-[#1a3d2b] transition hover:bg-[#1a3d2b]/5"
        >
          Previous
        </button>
      ) : null}
      {onNext ? (
        <button
          type="button"
          onClick={onNext}
          disabled={isSubmitting}
          className="min-h-[48px] flex-1 rounded-xl bg-[#c4a040] px-6 py-3 text-base font-semibold text-[#1a3d2b] transition hover:bg-[#b89030] disabled:opacity-60"
        >
          {isSubmitting ? "Submitting..." : nextLabel}
        </button>
      ) : null}
    </div>
  );
}
