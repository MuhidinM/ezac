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
    <div className="flex flex-wrap items-center justify-end gap-3">
      {showPrevious && onPrevious ? (
        <button type="button" onClick={onPrevious} className="form-btn-outline">
          Previous
        </button>
      ) : null}
      {onNext ? (
        <button
          type="button"
          onClick={onNext}
          disabled={isSubmitting}
          className="form-btn-primary min-w-[8.5rem]"
        >
          {isSubmitting ? "Submitting..." : nextLabel}
        </button>
      ) : null}
    </div>
  );
}
