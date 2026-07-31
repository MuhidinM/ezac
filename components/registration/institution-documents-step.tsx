"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Upload } from "lucide-react";

import { RegistrationShell } from "@/components/registration/registration-shell";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/errors";
import { registerApiFormData } from "@/lib/registration/api";
import {
  KYC_FILE_TYPES,
  MAX_KYC_FILE_SIZE,
} from "@/lib/registration/constants";
import {
  clearRegistrationSession,
  getRegistrationSession,
  setRegistrationSuccessFlag,
  updateRegistrationSession,
} from "@/lib/registration/session";
import type { KycDocument, UploadDocumentResponse } from "@/lib/registration/types";

const INSTITUTION_STEPS = ["Details", "Password", "Documents"];

export function InstitutionDocumentsStep() {
  const router = useRouter();
  const [documents, setDocuments] = useState<KycDocument[]>([]);
  const [kycComplete, setKycComplete] = useState(false);
  const [companyId, setCompanyId] = useState("");
  const [uploadToken, setUploadToken] = useState("");
  const [uploadingCode, setUploadingCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [branchName, setBranchName] = useState<string | null>(null);

  useEffect(() => {
    const session = getRegistrationSession();
    if (
      !session ||
      !session.branchId ||
      session.registrationType !== "institution" ||
      !session.entityId ||
      !session.companyDocumentUploadToken
    ) {
      router.replace("/dashboard/register");
      return;
    }

    setBranchName(session.branchName);
    setCompanyId(session.entityId);
    setUploadToken(session.companyDocumentUploadToken);
    setDocuments(session.kycDocuments ?? []);
    setKycComplete(session.kycComplete ?? false);
    setSessionChecked(true);
  }, [router]);

  async function uploadDocument(code: string, file: File) {
    if (!companyId || !uploadToken) {
      setError("Registration session expired. Please start again.");
      return;
    }

    if (!KYC_FILE_TYPES.includes(file.type)) {
      setError("Only PDF, JPG, and PNG files are supported.");
      return;
    }

    if (file.size > MAX_KYC_FILE_SIZE) {
      setError("File is too large. Maximum size is 10 MB.");
      return;
    }

    const formData = new FormData();
    formData.append("documentCode", code);
    formData.append("file", file);

    setUploadingCode(code);
    setError(null);

    try {
      const data = await registerApiFormData<UploadDocumentResponse>(
        `/api/register/companies/${companyId}/documents`,
        formData,
        { "X-Company-Upload-Token": uploadToken },
      );

      const nextDocuments = data.institutionRecommendedKycDocuments ?? documents;
      const nextComplete = data.institutionRequiredKycComplete ?? false;
      const nextToken = data.companyDocumentUploadToken ?? uploadToken;

      setDocuments(nextDocuments);
      setKycComplete(nextComplete);
      setUploadToken(nextToken);

      updateRegistrationSession({
        kycDocuments: nextDocuments,
        kycComplete: nextComplete,
        companyDocumentUploadToken: nextToken,
      });
    } catch (uploadError) {
      if (uploadError instanceof ApiError && uploadError.status === 401) {
        router.replace("/login?redirect=/dashboard/register/institution/documents");
        return;
      }

      setError(
        uploadError instanceof ApiError
          ? uploadError.message
          : "Unable to upload document. Please try again.",
      );
    } finally {
      setUploadingCode(null);
    }
  }

  function onFinish() {
    if (!kycComplete) {
      setError("Please upload all required documents before finishing.");
      return;
    }

    clearRegistrationSession();
    setRegistrationSuccessFlag();
    router.push("/dashboard/beneficiary");
  }

  if (!sessionChecked) {
    return (
      <RegistrationShell title="Upload documents" description="Loading...">
        <p className="text-sm text-black/60">Checking registration session...</p>
      </RegistrationShell>
    );
  }

  return (
    <RegistrationShell
      title="Institution documents"
      description="Upload each required KYC document to complete registration."
      branchName={branchName}
      steps={INSTITUTION_STEPS}
      currentStep={2}
      error={error}
      footer={
        <div className="flex justify-between gap-3">
          <Button
            variant="outline"
            asChild
            className={
              uploadingCode ? "pointer-events-none opacity-50" : undefined
            }
          >
            <a href="/dashboard/register/institution/password">Back</a>
          </Button>
          <Button onClick={onFinish} disabled={!kycComplete || !!uploadingCode}>
            Finish
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        {documents.length === 0 ? (
          <p className="text-sm text-black/60">
            No documents required at this time.
          </p>
        ) : (
          documents.map((doc) => (
            <DocumentCard
              key={doc.code}
              document={doc}
              isUploading={uploadingCode === doc.code}
              onUpload={(file) => void uploadDocument(doc.code, file)}
            />
          ))
        )}
      </div>
    </RegistrationShell>
  );
}

function DocumentCard({
  document,
  isUploading,
  onUpload,
}: {
  document: KycDocument;
  isUploading: boolean;
  onUpload: (file: File) => void;
}) {
  const inputId = `doc-${document.code}`;

  return (
    <div className="rounded-xl border border-black/10 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-[#001539]">{document.label}</p>
          <p className="mt-1 text-xs text-black/55">
            {document.required ? "Required" : "Optional"}
            {document.uploaded ? " · Uploaded" : ""}
          </p>
        </div>
        {document.uploaded ? (
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
        ) : (
          <Upload className="h-5 w-5 shrink-0 text-black/35" />
        )}
      </div>

      {!document.uploaded ? (
        <div className="mt-3">
          <input
            id={inputId}
            type="file"
            accept={KYC_FILE_TYPES.join(",")}
            className="hidden"
            disabled={isUploading}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onUpload(file);
              event.target.value = "";
            }}
          />
          <Button type="button" variant="outline" size="sm" disabled={isUploading} asChild>
            <label htmlFor={inputId} className="cursor-pointer">
              {isUploading ? "Uploading..." : "Upload file"}
            </label>
          </Button>
        </div>
      ) : null}
    </div>
  );
}
