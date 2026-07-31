import type { KycDocument, RegistrationType } from "@/lib/registration/types";

const STORAGE_KEY = "ezac_registration_session";

export type RegistrationSession = {
  branchId: string;
  branchName: string;
  registrationType?: RegistrationType;
  entityId?: string;
  passwordSetupToken?: string;
  companyDocumentUploadToken?: string;
  phone?: string;
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

export function getSelectedBranch(): {
  branchId: string;
  branchName: string;
} | null {
  const session = readSession();
  if (!session?.branchId?.trim() || !session.branchName?.trim()) return null;
  return { branchId: session.branchId, branchName: session.branchName };
}

/** Start (or reset) registration with a chosen branch. */
export function setSelectedBranch(branch: {
  branchId: string;
  branchName: string;
}): RegistrationSession {
  const next: RegistrationSession = {
    branchId: branch.branchId,
    branchName: branch.branchName,
  };
  writeSession(next);
  return next;
}

export function setRegistrationSession(
  partial: Partial<RegistrationSession> & {
    registrationType: RegistrationType;
  },
): RegistrationSession {
  const current = readSession();
  if (!current?.branchId || !current.branchName) {
    throw new Error("Select a branch before continuing registration");
  }

  const next: RegistrationSession = {
    branchId: partial.branchId ?? current.branchId,
    branchName: partial.branchName ?? current.branchName,
    registrationType: partial.registrationType,
    entityId: partial.entityId ?? current.entityId ?? "",
    passwordSetupToken:
      partial.passwordSetupToken ?? current.passwordSetupToken ?? "",
    companyDocumentUploadToken:
      partial.companyDocumentUploadToken ?? current.companyDocumentUploadToken,
    phone: partial.phone ?? current.phone,
    kycDocuments: partial.kycDocuments ?? current.kycDocuments,
    kycComplete: partial.kycComplete ?? current.kycComplete,
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

export function requireRegistrationSession(): RegistrationSession {
  const session = readSession();
  if (!session?.entityId || !session.passwordSetupToken) {
    throw new Error("Registration session expired");
  }
  return session;
}
