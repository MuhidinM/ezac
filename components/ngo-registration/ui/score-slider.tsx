"use client";

type ScoreSliderProps = {
  label: string;
  guide: string;
  max: number;
  value: string;
  onChange: (value: string) => void;
};

export function ScoreSlider({ label, guide, max, value, onChange }: ScoreSliderProps) {
  const numValue = Math.min(max, Math.max(0, Number(value || 0)));
  const fillPercent = max > 0 ? (numValue / max) * 100 : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-base font-medium text-[#001539]">{label}</p>
          <p className="text-sm text-black/55">{guide}</p>
        </div>
        <span className="shrink-0 text-lg font-semibold text-[#001539]">
          {numValue}/{max}
        </span>
      </div>
      <div className="relative">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-[#e18f35]/30"
          style={{ width: `${fillPercent}%` }}
        />
        <input
          type="range"
          min={0}
          max={max}
          value={numValue}
          onChange={(e) => onChange(e.target.value)}
          aria-label={label}
          className="relative z-10 h-3 w-full cursor-pointer appearance-none bg-[rgba(0,112,80,0.15)] accent-[#007050]"
        />
      </div>
      <input
        type="number"
        min={0}
        max={max}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={`${label} score input`}
        className="form-input w-24"
      />
    </div>
  );
}
