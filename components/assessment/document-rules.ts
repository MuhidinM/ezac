import type { AssessmentDocument } from "@/lib/api/backoffice-types";

/** What beneficiary-service accepts for assessment documents (checked from the file bytes). */
export const DOCUMENT_TYPES_ACCEPTED = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
export const DOCUMENT_MAX_BYTES = 5 * 1024 * 1024;
/** At most this many documents of one type, and in total, per assessment (409 above). */
export const DOCUMENT_MAX_PER_TYPE = 10;
export const DOCUMENT_MAX_TOTAL = 40;

/** Why this file can't be uploaded, or null. */
export function documentFileProblem(file: Pick<File, "type" | "size">): string | null {
  if (!DOCUMENT_TYPES_ACCEPTED.includes(file.type)) return "Only PDF, JPEG, PNG or WebP files are accepted.";
  if (file.size > DOCUMENT_MAX_BYTES) return "Files must be 5 MB or smaller.";
  return null;
}

/** Why no more documents of this type can be added, or null. */
export function documentLimitProblem(
  documents: readonly Pick<AssessmentDocument, "documentType">[],
  documentType: string,
  typeLabel: string,
): string | null {
  if (documents.length >= DOCUMENT_MAX_TOTAL) {
    return `An assessment can have at most ${DOCUMENT_MAX_TOTAL} documents. Delete one to add another.`;
  }
  const sameType = documents.filter((document) => document.documentType === documentType).length;
  if (sameType >= DOCUMENT_MAX_PER_TYPE) {
    return `An assessment can have at most ${DOCUMENT_MAX_PER_TYPE} of each type (${typeLabel.toLowerCase()}). Delete one to add another.`;
  }
  return null;
}
