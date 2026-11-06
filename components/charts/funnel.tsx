import { ORDINAL_GREEN } from "@/components/charts/palette";
import { formatCount } from "@/lib/backoffice/format";

export type FunnelStage = {
  key: string;
  label: string;
  value: number;
  hint?: string;
};

/**
 * Ordered stages of one pipeline, each bar as long as its count relative to
 * the first stage, darker green further along. Between stages: the share
 * that made it from the stage above. Every figure is printed, so nothing
 * depends on hover; the list itself is the accessible structure.
 */
export function Funnel({ stages, label }: { stages: FunnelStage[]; label: string }) {
  const first = stages[0]?.value ?? 0;
  if (first === 0) return <p className="py-6 text-center text-sm text-black/60">No households yet.</p>;
  const ramp = stages.length <= ORDINAL_GREEN.length ? ORDINAL_GREEN.slice(ORDINAL_GREEN.length - stages.length) : ORDINAL_GREEN;

  return (
    <ol className="space-y-1" aria-label={label}>
      {stages.map((stage, index) => {
        const width = Math.max((stage.value / first) * 100, stage.value > 0 ? 2 : 0);
        const previous = index > 0 ? stages[index - 1].value : null;
        const conversion = previous ? Math.round((stage.value / previous) * 100) : null;
        return (
          <li key={stage.key}>
            {conversion !== null ? (
              <p className="flex items-center gap-1.5 py-1 ps-1 text-[0.75rem] text-black/60">
                <span aria-hidden="true">↓</span>
                <span>
                  <span className="font-medium text-navy tabular-nums">{conversion}%</span> moved on
                </span>
              </p>
            ) : null}
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm text-black/70">{stage.label}</span>
              <span className="text-sm font-semibold text-navy tabular-nums">{formatCount(stage.value)}</span>
            </div>
            <div className="mt-1 h-3 w-full rounded-full bg-black/[0.04]">
              <div
                className="h-full rounded-full"
                style={{ width: `${width}%`, backgroundColor: ramp[Math.min(index, ramp.length - 1)] }}
                title={stage.hint ? `${stage.label}: ${stage.hint}` : undefined}
              />
            </div>
          </li>
        );
      })}
    </ol>
  );
}
