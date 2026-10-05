"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

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
    <div className="flex flex-wrap items-center justify-between gap-3">
      {showPrevious && onPrevious ? (
        <Button type="button" variant="outline" onClick={onPrevious}>
          <ArrowLeft />
          Previous
        </Button>
      ) : (
        <span />
      )}
      {onNext ? (
        <Button type="button" onClick={onNext} disabled={isSubmitting}>
          {isSubmitting ? "Submitting…" : nextLabel}
          <ArrowRight />
        </Button>
      ) : null}
    </div>
  );
}
