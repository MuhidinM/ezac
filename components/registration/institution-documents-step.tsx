"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Upload } from "lucide-react";

import { RegistrationShell } from "@/components/registration/registration-shell";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/errors";
import { registerApiFormData } from "@/lib/registration/api";
import {
  clearInProgressRegistration,
  getRegistrationSession,
  setRegistrationSuccessFlag,
  updateRegistrationSession,
} from "@/lib/registration/session";
import type { KycDocument, UploadDocumentResponse } from "@/lib/registration/types";
import { uploadAccept, uploadProblem } from "@/lib/registration/uploads";

const INSTITUTION_STEPS = ["Details", "Documents"];

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

    // Registration state lives in sessionStorage, readable only after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
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

    const problem = uploadProblem(file, "kyc");
    if (problem) {
      setError(problem);
      return;
    }

    const formData = new FormData();
    formData.append("documentCode", code);
    formData.append("file", file);

    setUploadingCode(code);
    setError(null);

    try {
      const data = await registerApiFormData<UploadDocumentResponse>(
        `/bff/register/companies/${companyId}/documents`,
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

    clearInProgressRegistration();
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
      currentStep={1}
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
            <Link href="/dashboard/register/institution">Back</Link>
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
  // The file input stays hidden; a real button opens it, so the keyboard can reach it.
  const fileInput = useRef<HTMLInputElement>(null);

  return (
    <div className="rounded-xl border border-black/10 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-navy">{document.label}</p>
          <p className="mt-1 text-xs text-black/60">
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
            ref={fileInput}
            id={inputId}
            type="file"
            accept={uploadAccept("kyc")}
            className="hidden"
            tabIndex={-1}
            aria-hidden="true"
            disabled={isUploading}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onUpload(file);
              event.target.value = "";
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            loading={isUploading}
            loadingText="Uploading…"
            onClick={() => fileInput.current?.click()}
          >
            <Upload />
            Upload file<span className="sr-only">: {document.label}</span>
          </Button>
        </div>
      ) : null}
    </div>
  );
}
