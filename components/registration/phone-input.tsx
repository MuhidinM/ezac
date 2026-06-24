"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PHONE_PREFIX } from "@/lib/registration/constants";
import { stripPhonePrefix } from "@/lib/registration/phone";

type PhoneInputProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
};

export function PhoneInput({
  id = "phone",
  value,
  onChange,
  required = true,
  disabled = false,
}: PhoneInputProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>Phone</Label>
      <div className="flex">
        <span className="inline-flex h-9 items-center rounded-l-md border border-r-0 border-input bg-black/[0.03] px-3 text-sm text-black/70">
          {PHONE_PREFIX}
        </span>
        <Input
          id={id}
          type="tel"
          inputMode="numeric"
          value={value}
          onChange={(event) => onChange(stripPhonePrefix(event.target.value))}
          placeholder="911223344"
          required={required}
          disabled={disabled}
          className="rounded-l-none"
          maxLength={10}
        />
      </div>
    </div>
  );
}
