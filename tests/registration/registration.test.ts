import { describe, expect, it } from "vitest";

import { ApiError } from "@/lib/api/errors";
import { CONSENT_NOTICE_VERSION } from "@/lib/registration/constants";
import { passwordNotShownNotice, registeredNotice } from "@/lib/registration/notices";
import { accountExists, keepIdempotencyKey, registrationConsent } from "@/lib/registration/submit";
import { uploadAccept, uploadProblem } from "@/lib/registration/uploads";

const MB = 1024 * 1024;

describe("registration notices", () => {
  it("names the household and its BIN", () => {
    expect(registeredNotice("Abebe Kebede", "EZW-QSKU-KKPG")).toBe(
      "Abebe Kebede (BIN EZW-QSKU-KKPG) is registered. The next step is the household assessment.",
    );
    expect(passwordNotShownNotice(" ", null)).toMatch(/^The household was already registered, so its temporary password/);
  });
});

describe("consent", () => {
  it("sends the agreed notice version", () => {
    expect(registrationConsent()).toEqual({ dataProcessingConsent: true, noticeVersion: CONSENT_NOTICE_VERSION });
  });
});

describe("accountExists", () => {
  it("reads the field and household from a 409 ACCOUNT_EXISTS", () => {
    const error = new ApiError("This phone is already used", 409, [], { field: "email", beneficiaryId: 42 }, "ACCOUNT_EXISTS");
    expect(accountExists(error)).toEqual({ field: "email", beneficiaryId: "42" });
  });

  it("falls back to errors[] and the phone", () => {
    const withErrors = new ApiError("Taken", 409, [{ field: "phone", message: "Taken" }], null, "ACCOUNT_EXISTS");
    expect(accountExists(withErrors)).toEqual({ field: "phone", beneficiaryId: null });
    expect(accountExists(new ApiError("Taken", 409, [], null, "ACCOUNT_EXISTS"))?.field).toBe("phone");
  });

  it("ignores other errors", () => {
    expect(accountExists(new ApiError("Changed", 409, [], null, "VERSION_CONFLICT"))).toBeNull();
    expect(accountExists(new Error("x"))).toBeNull();
  });
});

describe("keepIdempotencyKey", () => {
  it("keeps the key when the answer may have been lost", () => {
    expect(keepIdempotencyKey(new ApiError("No connection", 0))).toBe(true);
    expect(keepIdempotencyKey(new ApiError("Down", 503))).toBe(true);
    expect(keepIdempotencyKey(new ApiError("Running", 409, [], null, "IDEMPOTENCY_IN_PROGRESS"))).toBe(true);
    expect(keepIdempotencyKey(new TypeError("fetch failed"))).toBe(true);
  });

  it("starts a new attempt after a clear refusal", () => {
    expect(keepIdempotencyKey(new ApiError("Bad phone", 400))).toBe(false);
    expect(keepIdempotencyKey(new ApiError("Out of scope", 403))).toBe(false);
    expect(keepIdempotencyKey(new ApiError("Taken", 409, [], null, "ACCOUNT_EXISTS"))).toBe(false);
    expect(keepIdempotencyKey(new ApiError("Reused", 422, [], null, "IDEMPOTENCY_KEY_REUSED"))).toBe(false);
  });
});

describe("upload limits", () => {
  const file = (type: string, size: number) => ({ name: "scan", type, size });

  it("takes a profile picture up to 2 MB as JPEG, PNG or WebP", () => {
    expect(uploadProblem(file("image/webp", 2 * MB), "profilePicture")).toBeNull();
    expect(uploadProblem(file("image/png", 2 * MB + 1), "profilePicture")).toMatch(/larger than 2 MB/);
    expect(uploadProblem(file("application/pdf", 1000), "profilePicture")).toMatch(/isn't a supported file/);
  });

  it("takes KYC documents up to 5 MB as PDF, JPEG, PNG or WebP", () => {
    expect(uploadProblem(file("application/pdf", 5 * MB), "kyc")).toBeNull();
    expect(uploadProblem(file("image/webp", 1000), "kyc")).toBeNull();
    expect(uploadProblem(file("image/jpeg", 5 * MB + 1), "kyc")).toMatch(/larger than 5 MB/);
    expect(uploadProblem(file("image/gif", 1000), "kyc")).toMatch(/isn't a supported file/);
    expect(uploadAccept("kyc")).toBe("application/pdf,image/jpeg,image/png,image/webp");
  });
});
