"use client";

import { useRef, useState } from "react";
import { FileImage, FileText, Trash2, Upload } from "lucide-react";

import {
  DOCUMENT_TYPES_ACCEPTED,
  documentFileProblem,
  documentLimitProblem,
} from "@/components/assessment/document-rules";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { InlineAlert } from "@/components/dashboard/inline-alert";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import type { AssessmentDocument } from "@/lib/api/backoffice-types";
import { apiClient } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";
import { formatBytes } from "@/lib/backoffice/format";
import { DOCUMENT_TYPES, labelFor } from "@/lib/backoffice/options";
import { formatDateTime } from "@/lib/beneficiary/format";

function documentsPath(assessmentId: string) {
  return `/bff/backoffice/assessments/${encodeURIComponent(assessmentId)}/documents`;
}

export function documentUrl(assessmentId: string, documentId: string, download = false) {
  return `${documentsPath(assessmentId)}/${encodeURIComponent(documentId)}/content?download=${download}`;
}

/**
 * The assessment's documents. With `onDeleted` (the owner officer, while the
 * assessment is a draft or returned) each one can be deleted.
 */
export function DocumentsList({
  assessmentId,
  documents,
  onDeleted,
}: {
  assessmentId: string;
  documents: AssessmentDocument[];
  onDeleted?: (documentId: string) => void;
}) {
  const [toDelete, setToDelete] = useState<AssessmentDocument | null>(null);

  if (documents.length === 0) {
    return <p className="text-sm text-black/60">No documents uploaded yet.</p>;
  }

  return (
    <>
      <ul className="divide-y divide-black/[0.06] rounded-lg border border-black/[0.06]">
        {documents.map((document) => {
          const isImage = document.contentType?.startsWith("image/");
          const Icon = isImage ? FileImage : FileText;
          const label = labelFor(DOCUMENT_TYPES, document.documentType);
          return (
            <li key={document.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-black/[0.04] text-black/50">
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-navy">{label}</p>
                  <p className="truncate text-xs text-black/60">
                    {[document.originalFilename, formatBytes(document.sizeBytes), document.uploadedAt ? formatDateTime(document.uploadedAt) : null, document.uploadedByName]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <a href={documentUrl(assessmentId, document.id)} target="_blank" rel="noopener noreferrer">
                    View
                  </a>
                </Button>
                {onDeleted ? (
                  <Button
                    variant="destructive-ghost"
                    size="sm"
                    onClick={() => setToDelete(document)}
                    aria-label={`Delete ${label}${document.originalFilename ? ` (${document.originalFilename})` : ""}`}
                  >
                    <Trash2 />
                    Delete
                  </Button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>

      {onDeleted ? (
        <ConfirmDialog
          open={toDelete !== null}
          onOpenChange={(open) => {
            if (!open) setToDelete(null);
          }}
          title="Delete this document?"
          description={
            toDelete
              ? `${labelFor(DOCUMENT_TYPES, toDelete.documentType)}${toDelete.originalFilename ? ` (${toDelete.originalFilename})` : ""} is removed from the assessment. This can't be undone.`
              : undefined
          }
          confirmLabel="Delete document"
          destructive
          onConfirm={async () => {
            if (!toDelete) return;
            await apiClient(`${documentsPath(assessmentId)}/${encodeURIComponent(toDelete.id)}`, { method: "DELETE" });
            onDeleted(toDelete.id);
          }}
        />
      ) : null}
    </>
  );
}

export function DocumentUploader({
  assessmentId,
  documents,
  onUploaded,
  defaultType = "photo",
}: {
  assessmentId: string;
  /** The documents already uploaded, for the per-type and total limits. */
  documents: AssessmentDocument[];
  onUploaded: (document: AssessmentDocument) => void;
  defaultType?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [documentType, setDocumentType] = useState(defaultType);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const limitProblem = documentLimitProblem(documents, documentType, labelFor(DOCUMENT_TYPES, documentType));

  async function upload() {
    setError(null);
    if (!file) {
      setError("Choose a file first.");
      return;
    }
    const problem = documentFileProblem(file) ?? limitProblem;
    if (problem) {
      setError(problem);
      return;
    }

    const body = new FormData();
    body.append("file", file);
    body.append("documentType", documentType);

    setIsUploading(true);
    try {
      const document = await apiClient<AssessmentDocument>(documentsPath(assessmentId), { method: "POST", body });
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
      {limitProblem && !error ? <InlineAlert tone="warning">{limitProblem}</InlineAlert> : null}
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
          accept={DOCUMENT_TYPES_ACCEPTED.join(",")}
          aria-label="File"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          className="block w-full text-sm text-black/60 file:mr-3 file:rounded-md file:border-0 file:bg-navy file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-navy/90"
        />
        <Button type="button" onClick={() => void upload()} disabled={isUploading || !file || !!limitProblem}>
          <Upload />
          {isUploading ? "Uploading…" : "Upload"}
        </Button>
      </div>
      <p className="text-xs text-black/60">PDF, JPEG, PNG or WebP, up to 5 MB each. At most 10 of each type and 40 in all.</p>
    </div>
  );
}
