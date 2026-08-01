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
        <button type="button" onClick={onPrevious} className="form-btn-outline flex-1">
          Previous
        </button>
      ) : null}
      {onNext ? (
        <button
          type="button"
          onClick={onNext}
          disabled={isSubmitting}
          className="form-btn-primary flex-1"
        >
          {isSubmitting ? "Submitting..." : nextLabel}
        </button>
      ) : null}
    </div>
  );
}
