"use client";

import { useRef, useState } from "react";
import { FileSpreadsheet } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  BULK_IMPORT_ACCEPT,
  BULK_IMPORT_EXTENSIONS,
  BULK_IMPORT_TYPES,
  MAX_BULK_IMPORT_SIZE,
} from "@/lib/registration/constants";

type BulkImportUploadProps = {
  onFileSelect: (file: File | null) => void;
  disabled?: boolean;
};

function hasAllowedExtension(filename: string): boolean {
  const lower = filename.toLowerCase();
  return BULK_IMPORT_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

function validateBulkImportFile(file: File): string | null {
  if (!hasAllowedExtension(file.name)) {
    return "Only CSV and Excel files (.csv, .xls, .xlsx) are supported.";
  }

  if (
    file.type &&
    !BULK_IMPORT_TYPES.includes(file.type) &&
    file.type !== "application/octet-stream"
  ) {
    return "Unsupported file type.";
  }

  if (file.size > MAX_BULK_IMPORT_SIZE) {
    return "File is too large. Maximum size is 5 MB.";
  }

  return null;
}

export function BulkImportUpload({
  onFileSelect,
  disabled = false,
}: BulkImportUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(nextFile: File | null) {
    if (!nextFile) {
      setSelectedFile(null);
      setError(null);
      onFileSelect(null);
      return;
    }

    const validationError = validateBulkImportFile(nextFile);
    if (validationError) {
      setSelectedFile(null);
      setError(validationError);
      onFileSelect(null);
      return;
    }

    setSelectedFile(nextFile);
    setError(null);
    onFileSelect(nextFile);
  }

  return (
    <div className="mb-6 rounded-xl border border-dashed border-black/15 bg-black/[0.02] p-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept={BULK_IMPORT_ACCEPT}
          className="hidden"
          disabled={disabled}
          onChange={(event) => {
            handleFileChange(event.target.files?.[0] ?? null);
            event.target.value = "";
          }}
        />
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          <FileSpreadsheet className="h-4 w-4" />
          Import from CSV or Excel
        </Button>
        {selectedFile ? (
          <span className="text-sm text-black/70">{selectedFile.name}</span>
        ) : null}
      </div>
      <p className="mt-2 text-xs text-black/50">
        Bulk import support coming soon. Select a file to prepare for import.
      </p>
      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
