"use client";

import { NativeSelect } from "@/components/ui/native-select";
import { RANGE_OPTIONS, type RangeKey } from "@/lib/backoffice/date-range";

export function RangeSelect({ value, onChange }: { value: RangeKey; onChange: (value: RangeKey) => void }) {
  return (
    <div className="w-40">
      <NativeSelect aria-label="Date range" value={value} onChange={(event) => onChange(event.target.value as RangeKey)}>
        {RANGE_OPTIONS.map((option) => (
          <option key={option.key} value={option.key}>
            {option.label}
          </option>
        ))}
      </NativeSelect>
    </div>
  );
}
