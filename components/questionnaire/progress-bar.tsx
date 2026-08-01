type ProgressBarProps = {
  currentStep: number;
  totalSteps?: number;
  sectionName?: string;
  label?: string;
};

export function ProgressBar({
  currentStep,
  totalSteps = 7,
  sectionName,
  label,
}: ProgressBarProps) {
  const percent = Math.min(100, (currentStep / totalSteps) * 100);
  const defaultLabel = sectionName
    ? `Step ${currentStep} of ${totalSteps} — ${sectionName}`
    : `Step ${currentStep} of ${totalSteps}`;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm font-medium text-[#1a3d2b]">
        <span>{label ?? defaultLabel}</span>
        <span>{Math.round(percent)}%</span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-[#1a3d2b]/15"
        role="progressbar"
        aria-valuenow={currentStep}
        aria-valuemin={1}
        aria-valuemax={totalSteps}
        aria-label={label ?? defaultLabel}
      >
        <div
          className="h-full rounded-full bg-[#c4a040] transition-all duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
