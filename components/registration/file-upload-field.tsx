"use client";

import { useRef } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type FileUploadFieldProps = {
  id: string;
  label: string;
  accept: string;
  maxSize: number;
  allowedTypes: string[];
  file: File | null;
  onChange: (file: File | null) => void;
  error?: string | null;
  disabled?: boolean;
};

export function FileUploadField({
  id,
  label,
  accept,
  maxSize,
  allowedTypes,
  file,
  onChange,
  error,
  disabled = false,
}: FileUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function validateAndSet(nextFile: File | null) {
    if (!nextFile) {
      onChange(null);
      return;
    }

    if (!allowedTypes.includes(nextFile.type)) {
      onChange(null);
      return;
    }

    if (nextFile.size > maxSize) {
      onChange(null);
      return;
    }

    onChange(nextFile);
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={accept}
          className="hidden"
          disabled={disabled}
          onChange={(event) =>
            validateAndSet(event.target.files?.[0] ?? null)
          }
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          Choose file
        </Button>
        {file ? (
          <span className="text-sm text-black/70">{file.name}</span>
        ) : (
          <span className="text-sm text-black/45">No file selected</span>
        )}
      </div>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

export function validateFile(
  file: File | null,
  allowedTypes: string[],
  maxSize: number,
): string | null {
  if (!file) return null;
  if (!allowedTypes.includes(file.type)) {
    return "Unsupported file type";
  }
  if (file.size > maxSize) {
    return "File is too large";
  }
  return null;
}
