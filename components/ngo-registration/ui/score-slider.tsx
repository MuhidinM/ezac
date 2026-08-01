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
          <p className="text-base font-medium text-[#1a3d2b]">{label}</p>
          <p className="text-sm text-[#5a6e62]">{guide}</p>
        </div>
        <span className="shrink-0 text-lg font-semibold text-[#1a3d2b]">
          {numValue}/{max}
        </span>
      </div>
      <div className="relative">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-[#c4a040]/30"
          style={{ width: `${fillPercent}%` }}
        />
        <input
          type="range"
          min={0}
          max={max}
          value={numValue}
          onChange={(e) => onChange(e.target.value)}
          aria-label={label}
          className="relative z-10 h-3 w-full cursor-pointer appearance-none bg-[#1a3d2b]/15 accent-[#c4a040]"
        />
      </div>
      <input
        type="number"
        min={0}
        max={max}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={`${label} score input`}
        className="min-h-[48px] w-24 rounded-xl border border-[#1a3d2b]/20 bg-white px-3 py-2 text-base text-[#1a3d2b]"
      />
    </div>
  );
}
