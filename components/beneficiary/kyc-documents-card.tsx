"use client";

import { useEffect, useState } from "react";
import { Download, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/errors";
import { apiClient } from "@/lib/api/client";
import type { InstitutionDocumentItem } from "@/lib/api/types";
import { formatDateTime } from "@/lib/beneficiary/format";

const DOCUMENT_LABELS: Record<string, string> = {
  TRADE_REGISTRATION: "Trade / commercial registration",
  TAX_STATUS: "TIN / tax certificate",
  AUTHORITY_TO_ACT: "Board resolution / authority to act",
};

function normalizeDocuments(
  data: InstitutionDocumentItem[] | { items: InstitutionDocumentItem[] },
): InstitutionDocumentItem[] {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.items)) return data.items;
  return [];
}

export function KycDocumentsCard({ beneficiaryId }: { beneficiaryId: string }) {
  const [documents, setDocuments] = useState<InstitutionDocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await apiClient<
          InstitutionDocumentItem[] | { items: InstitutionDocumentItem[] }
        >(`/api/beneficiaries/${beneficiaryId}/institution-documents`);
        if (!cancelled) setDocuments(normalizeDocuments(data));
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof ApiError
              ? loadError.message
              : "Failed to load KYC documents",
          );
          setDocuments([]);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [beneficiaryId]);

  return (
    <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm shadow-black/5 lg:col-span-2">
      <h2 className="text-sm font-medium uppercase tracking-[0.12em] text-black/45">
        KYC documents
      </h2>

      {isLoading ? (
        <p className="mt-4 text-sm text-black/60">Loading documents...</p>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </p>
      ) : null}

      {!isLoading && !error && documents.length === 0 ? (
        <p className="mt-4 text-sm text-black/60">No KYC documents on file.</p>
      ) : null}

      {documents.length > 0 ? (
        <ul className="mt-4 divide-y divide-black/5">
          {documents.map((doc) => {
            const code = doc.documentCode;
            const label =
              doc.label?.trim() ||
              DOCUMENT_LABELS[code] ||
              code.replaceAll("_", " ");
            const uploaded = doc.uploaded !== false;
            const href = `/api/beneficiaries/${beneficiaryId}/institution-documents/${encodeURIComponent(code)}`;

            return (
              <li
                key={code}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <FileText className="mt-0.5 h-4 w-4 shrink-0 text-black/40" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#001539]">{label}</p>
                    <p className="text-xs text-black/50">
                      {uploaded ? "Uploaded" : "Missing"}
                      {doc.required ? " · Required" : ""}
                      {doc.uploadedAt
                        ? ` · ${formatDateTime(doc.uploadedAt)}`
                        : ""}
                      {doc.fileName ? ` · ${doc.fileName}` : ""}
                    </p>
                  </div>
                </div>

                {uploaded ? (
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <a href={href} target="_blank" rel="noopener noreferrer">
                        Preview
                      </a>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <a href={`${href}?download=true`}>
                        <Download className="mr-1.5 h-3.5 w-3.5" />
                        Download
                      </a>
                    </Button>
                  </div>
                ) : (
                  <span className="text-xs text-black/45">Not uploaded</span>
                )}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
