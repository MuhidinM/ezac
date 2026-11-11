import type { KycDocument, RegistrationType } from "@/lib/registration/types";

const STORAGE_KEY = "ezac_registration_session";

export type RegistrationSession = {
  branchId: string;
  branchName: string;
  /** Free registration codes the branch had when it was picked. */
  codesAvailable?: number | null;
  registrationType?: RegistrationType;
  entityId?: string;
  companyDocumentUploadToken?: string;
  kycDocuments?: KycDocument[];
  kycComplete?: boolean;
};

function readSession(): RegistrationSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as RegistrationSession;
  } catch {
    return null;
  }
}

function writeSession(session: RegistrationSession): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function getRegistrationSession(): RegistrationSession | null {
  return readSession();
}

export type SelectedBranch = {
  branchId: string;
  branchName: string;
  codesAvailable?: number | null;
};

export function getSelectedBranch(): SelectedBranch | null {
  const session = readSession();
  if (!session?.branchId?.trim() || !session.branchName?.trim()) return null;
  return {
    branchId: session.branchId,
    branchName: session.branchName,
    codesAvailable: session.codesAvailable ?? null,
  };
}

/** Start (or reset) registration with a chosen branch. */
export function setSelectedBranch(branch: SelectedBranch): RegistrationSession {
  const next: RegistrationSession = {
    branchId: branch.branchId,
    branchName: branch.branchName,
    codesAvailable: branch.codesAvailable ?? null,
  };
  writeSession(next);
  return next;
}

/** Keep branch context and set type; clear in-progress entity fields. */
export function beginRegistration(
  type: RegistrationType,
): RegistrationSession {
  const branch = getSelectedBranch();
  if (!branch) {
    throw new Error("Select a branch first");
  }

  const next: RegistrationSession = {
    branchId: branch.branchId,
    branchName: branch.branchName,
    codesAvailable: branch.codesAvailable ?? null,
    registrationType: type,
  };
  writeSession(next);
  return next;
}

export function updateRegistrationSession(
  partial: Partial<RegistrationSession>,
): RegistrationSession | null {
  const current = readSession();
  if (!current) return null;
  const next = { ...current, ...partial };
  writeSession(next);
  return next;
}

/** End the in-progress registration. */
export function clearInProgressRegistration(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}

/** Forget all registration state in this tab. Used at sign-out: branch PCs are shared. */
export function clearRegistrationSession(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}

export function setRegistrationSuccessFlag(): void {
  sessionStorage.setItem("ezac_registration_success", "1");
}

export function consumeRegistrationSuccessFlag(): boolean {
  const value = sessionStorage.getItem("ezac_registration_success");
  if (!value) return false;
  sessionStorage.removeItem("ezac_registration_success");
  return true;
}
