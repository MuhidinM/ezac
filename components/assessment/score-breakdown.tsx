import { RiskBadge, ScoreMeter } from "@/components/backoffice/status-badges";
import type { AssessmentScore, ScoreSection } from "@/lib/api/backoffice-types";
import { OFFICER_RECOMMENDATION, labelFor } from "@/lib/backoffice/options";
import { cn } from "@/lib/utils";

/** Composite score, need level and system recommendation. */
export function ScoreHeadline({
  score,
  caption,
}: {
  score: AssessmentScore;
  caption?: string;
}) {
  return (
    <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
      <div>
        <p className="text-xs font-medium text-black/60">{caption ?? "Composite poverty score"}</p>
        <div className="mt-1 max-w-sm">
          <ScoreMeter score={score.totalScore} max={score.maxScore} risk={score.riskCategory} size="lg" />
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
        <dt className="text-black/60">Need</dt>
        <dd>
          <RiskBadge risk={score.riskCategory} />
        </dd>
        <dt className="text-black/60">System recommendation</dt>
        <dd className="font-medium text-navy">
          {labelFor(OFFICER_RECOMMENDATION, score.preliminaryRecommendation)}
        </dd>
      </dl>
    </div>
  );
}

/** A score section; since 10 November it carries a plain-language `explanation`. */
type ExplainedSection = ScoreSection & { explanation?: string | null };

/** Why the section scored what it did: the plain-language explanation, else the technical reason. */
export function sectionWhy(section: ExplainedSection): string {
  return section.explanation?.trim() || section.reason?.trim() || "—";
}

/** Per-section score table with horizontal bars. */
export function ScoreBreakdown({ score, muted }: { score: AssessmentScore; muted?: boolean }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="border-b border-black/[0.06] text-left text-xs text-black/60">
            <th className="py-2 pr-4 font-medium">Section</th>
            <th className="w-56 py-2 pr-4 font-medium">Score</th>
            <th className="py-2 font-medium">Why</th>
          </tr>
        </thead>
        <tbody>
          {score.sections.map((section: ExplainedSection) => {
            const percent = section.max > 0 ? (section.score / section.max) * 100 : 0;
            return (
              <tr key={section.key} className="border-b border-black/[0.04] last:border-0">
                <td className="py-2.5 pr-4 font-medium text-navy">{section.label}</td>
                <td className="py-2.5 pr-4">
                  <div className="flex items-center gap-3">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/[0.07]">
                      <div
                        className={cn("h-full rounded-full", muted ? "bg-black/25" : "bg-brand")}
                        style={{ width: `${Math.min(100, percent)}%` }}
                      />
                    </div>
                    <span className="w-14 text-right text-xs text-black/60 tabular-nums">
                      {section.score} / {section.max}
                    </span>
                  </div>
                </td>
                <td className="py-2.5 text-xs text-black/60" title={section.explanation && section.reason ? section.reason : undefined}>
                  {sectionWhy(section)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function flagText(flag: string | { code?: string; message?: string }) {
  if (typeof flag === "string") return flag.replaceAll("_", " ").toLowerCase();
  return flag.message ?? flag.code ?? "";
}
