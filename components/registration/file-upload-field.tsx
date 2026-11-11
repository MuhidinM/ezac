"use client";

import { useRef } from "react";

import { FormField } from "@/components/dashboard/form-field";
import { Button } from "@/components/ui/button";
import { uploadAccept, uploadHint, uploadProblem, type UploadKind } from "@/lib/registration/uploads";

type FileUploadFieldProps = {
  id: string;
  label: string;
  kind: UploadKind;
  file: File | null;
  /** The picked file, or null with the reason it can't be sent (or null when cleared). */
  onChange: (file: File | null, problem: string | null) => void;
  error?: string | null;
  disabled?: boolean;
};

/**
 * One optional file for a registration form. The file is checked against the
 * server's type and size limits as soon as it is picked, so the officer
 * learns about a refusal before submitting.
 */
export function FileUploadField({ id, label, kind, file, onChange, error, disabled = false }: FileUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function pick(next: File | null) {
    if (!next) {
      onChange(null, null);
      return;
    }
    const problem = uploadProblem(next, kind);
    onChange(problem ? null : next, problem);
  }

  return (
    <FormField label={label} htmlFor={id} hint={`Optional. ${uploadHint(kind)}`} error={error}>
      {(control) => (
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={inputRef}
            id={control.id}
            aria-describedby={control["aria-describedby"]}
            aria-invalid={control["aria-invalid"]}
            aria-required={control["aria-required"]}
            type="file"
            accept={uploadAccept(kind)}
            className="sr-only"
            disabled={disabled}
            onChange={(event) => {
              pick(event.target.files?.[0] ?? null);
              event.target.value = "";
            }}
          />
          <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => inputRef.current?.click()}>
            Choose file
          </Button>
          {file ? (
            <>
              <span className="text-sm break-all text-black/70">{file.name}</span>
              <Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={() => pick(null)}>
                Remove
              </Button>
            </>
          ) : error ? (
            // The refused file isn't kept: clearing the message lets the form go without a file.
            <Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={() => pick(null)}>
              Clear
            </Button>
          ) : (
            <span className="text-sm text-black/60">No file chosen</span>
          )}
        </div>
      )}
    </FormField>
  );
}
