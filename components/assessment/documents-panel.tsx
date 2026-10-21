"use client";

import { useRef, useState } from "react";
import { FileImage, FileText, Upload } from "lucide-react";

import { InlineAlert } from "@/components/dashboard/inline-alert";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import type { AssessmentDocument } from "@/lib/api/backoffice-types";
import { apiClient } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";
import { formatBytes } from "@/lib/backoffice/format";
import { DOCUMENT_TYPES, labelFor } from "@/lib/backoffice/options";
import { formatDateTime } from "@/lib/beneficiary/format";

const ACCEPTED = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

export function documentUrl(assessmentId: string, documentId: string, download = false) {
  return `/bff/backoffice/assessments/${encodeURIComponent(assessmentId)}/documents/${encodeURIComponent(documentId)}/content?download=${download}`;
}

export function DocumentsList({
  assessmentId,
  documents,
}: {
  assessmentId: string;
  documents: AssessmentDocument[];
}) {
  if (documents.length === 0) {
    return <p className="text-sm text-black/45">No documents uploaded yet.</p>;
  }

  return (
    <ul className="divide-y divide-black/[0.06] rounded-lg border border-black/[0.06]">
      {documents.map((document) => {
        const isImage = document.contentType?.startsWith("image/");
        const Icon = isImage ? FileImage : FileText;
        return (
          <li key={document.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-black/[0.04] text-black/50">
                <Icon className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-[#001539]">
                  {labelFor(DOCUMENT_TYPES, document.documentType)}
                </p>
                <p className="truncate text-xs text-black/50">
                  {[document.originalFilename, formatBytes(document.sizeBytes), document.uploadedAt ? formatDateTime(document.uploadedAt) : null, document.uploadedByName]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href={documentUrl(assessmentId, document.id)} target="_blank" rel="noopener noreferrer">
                View
              </a>
            </Button>
          </li>
        );
      })}
    </ul>
  );
}

export function DocumentUploader({
  assessmentId,
  onUploaded,
  defaultType = "photo",
}: {
  assessmentId: string;
  onUploaded: (document: AssessmentDocument) => void;
  defaultType?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [documentType, setDocumentType] = useState(defaultType);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  async function upload() {
    setError(null);
    if (!file) {
      setError("Choose a file first.");
      return;
    }
    if (!ACCEPTED.includes(file.type)) {
      setError("Only PDF, JPEG, PNG or WebP files are accepted.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Files must be 5 MB or smaller.");
      return;
    }

    const body = new FormData();
    body.append("file", file);
    body.append("documentType", documentType);

    setIsUploading(true);
    try {
      const document = await apiClient<AssessmentDocument>(
        `/bff/backoffice/assessments/${encodeURIComponent(assessmentId)}/documents`,
        { method: "POST", body },
      );
      onUploaded(document);
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch (uploadError) {
      setError(errorMessage(uploadError, "Upload failed"));
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-dashed border-black/15 bg-black/[0.015] p-4">
      {error ? <InlineAlert>{error}</InlineAlert> : null}
      <div className="grid gap-3 md:grid-cols-[14rem_1fr_auto] md:items-center">
        <NativeSelect
          aria-label="Document type"
          value={documentType}
          onChange={(event) => setDocumentType(event.target.value)}
        >
          {DOCUMENT_TYPES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </NativeSelect>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(",")}
          aria-label="File"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          className="block w-full text-sm text-black/60 file:mr-3 file:rounded-md file:border-0 file:bg-[#001539] file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-[#001539]/90"
        />
        <Button type="button" onClick={() => void upload()} disabled={isUploading || !file}>
          <Upload />
          {isUploading ? "Uploading…" : "Upload"}
        </Button>
      </div>
      <p className="text-xs text-black/45">PDF, JPEG, PNG or WebP, up to 5 MB.</p>
    </div>
  );
}
