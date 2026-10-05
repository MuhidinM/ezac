type ProgressBarProps = {
  currentStep: number;
  totalSteps?: number;
  sectionName?: string;
  label?: string;
};

export function ProgressBar({ currentStep, totalSteps = 7, sectionName, label }: ProgressBarProps) {
  const percent = Math.min(100, (currentStep / totalSteps) * 100);
  const defaultLabel = sectionName
    ? `Step ${currentStep} of ${totalSteps} · ${sectionName}`
    : `Step ${currentStep} of ${totalSteps}`;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs text-black/55">
        <span className="font-medium text-[#001539]">{label ?? defaultLabel}</span>
        <span className="tabular-nums">{Math.round(percent)}%</span>
      </div>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-black/[0.07]"
        role="progressbar"
        aria-valuenow={currentStep}
        aria-valuemin={1}
        aria-valuemax={totalSteps}
        aria-label={label ?? defaultLabel}
      >
        <div
          className="h-full rounded-full bg-[#007050] transition-all duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
