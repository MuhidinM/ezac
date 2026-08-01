import { useEffect, useState } from "react";

import type { EligibilityDecision, ReviewerScores } from "./types";

export const SCORE_DIMENSIONS = [
  { key: "legal" as const, label: "Legal & registration status", max: 20, guide: "20 = fully registered + valid license" },
  { key: "reach" as const, label: "Beneficiary reach & coverage", max: 20, guide: "20 = large scale, well documented" },
  { key: "programs" as const, label: "Program quality & diversity", max: 15, guide: "15 = multiple programs, monitored" },
  { key: "financialNeed" as const, label: "Financial need & gap", max: 15, guide: "15 = high gap, no duplicate funding" },
  { key: "shariah" as const, label: "Shariah compliance", max: 20, guide: "20 = all 8 declarations ticked, advisor present" },
  { key: "accountability" as const, label: "Accountability & reporting", max: 10, guide: "10 = yes to all 4 monitoring questions" },
];

export function calculateTotalScore(scores: ReviewerScores): number {
  return SCORE_DIMENSIONS.reduce((sum, dim) => {
    const val = Number(scores[dim.key] || 0);
    return sum + Math.min(Math.max(0, val), dim.max);
  }, 0);
}

export function getAutoDecision(score: number): EligibilityDecision {
  if (score >= 80) return "approve";
  if (score >= 60) return "conditional";
  if (score >= 40) return "defer";
  return "reject";
}

export function getDecisionLabel(decision: EligibilityDecision): string {
  switch (decision) {
    case "approve":
      return "APPROVE";
    case "conditional":
      return "CONDITIONAL APPROVAL";
    case "defer":
      return "DEFER";
    case "reject":
      return "REJECT";
    default:
      return "PENDING";
  }
}

export function getGapColor(gapPercent: number): string {
  if (gapPercent > 50) return "text-[#c0392b] bg-[#c0392b]/10";
  if (gapPercent >= 25) return "text-[#e18f35] bg-[#e18f35]/15";
  return "text-[#27ae60] bg-[#27ae60]/10";
}

export function useAnimatedNumber(target: number, duration = 400): number {
  const [display, setDisplay] = useState(target);

  useEffect(() => {
    const start = display;
    const diff = target - start;
    if (diff === 0) return;

    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + diff * eased));
      if (progress < 1) requestAnimationFrame(tick);
    }

    const frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration]);

  return display;
}

export function generateReferenceNumber(): string {
  return `EZAC-NGO-${Date.now()}`;
}
