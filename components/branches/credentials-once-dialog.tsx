"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { copyToClipboard } from "@/lib/clipboard";

type Props = {
  branchPhone: string;
  initialPassword: string;
  passwordChangeRequired: boolean;
  onClose: () => void;
};

type CopyTarget = "phone" | "password" | "both";

export function CredentialsOnceDialog({
  branchPhone,
  initialPassword,
  passwordChangeRequired,
  onClose,
}: Props) {
  const [copied, setCopied] = useState<CopyTarget | null>(null);
  const [copyError, setCopyError] = useState<string | null>(null);

  async function copyText(value: string, which: CopyTarget) {
    setCopyError(null);
    const ok = await copyToClipboard(value);
    if (!ok) {
      setCopied(null);
      setCopyError(
        "Could not copy automatically. Select the text and copy it manually.",
      );
      return;
    }
    setCopied(which);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="credentials-title"
        className="w-full max-w-lg rounded-2xl border border-black/5 bg-white p-6 shadow-xl"
      >
        <h2
          id="credentials-title"
          className="text-xl font-medium tracking-tight text-[#001539]"
        >
          Branch credentials (copy once)
        </h2>
        <p className="mt-2 text-sm text-black/65">
          These credentials are shown once. Copy the phone and temporary
          password, then share them securely with the branch officer before
          closing this dialog.
        </p>

        <div className="mt-5 space-y-3">
          <div className="rounded-xl border border-black/10 bg-black/[0.02] px-4 py-3">
            <p className="text-xs uppercase tracking-[0.12em] text-black/45">
              Login (phone)
            </p>
            <div className="mt-1 flex items-center justify-between gap-3">
              <code className="select-all break-all text-sm text-[#001539]">
                {branchPhone}
              </code>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void copyText(branchPhone, "phone")}
              >
                {copied === "phone" ? "Copied" : "Copy phone"}
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.12em] text-amber-800/70">
              Temporary password
            </p>
            <div className="mt-1 flex items-center justify-between gap-3">
              <code className="select-all break-all text-sm text-[#001539]">
                {initialPassword}
              </code>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void copyText(initialPassword, "password")}
              >
                {copied === "password" ? "Copied" : "Copy password"}
              </Button>
            </div>
          </div>

          {passwordChangeRequired ? (
            <p className="text-sm text-black/60">
              The branch officer must change this password on first login.
            </p>
          ) : null}

          {copyError ? (
            <p role="alert" className="text-sm text-red-700">
              {copyError}
            </p>
          ) : null}
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              void copyText(
                `Phone: ${branchPhone}\nPassword: ${initialPassword}`,
                "both",
              )
            }
          >
            {copied === "both" ? "Copied both" : "Copy phone + password"}
          </Button>
          <Button type="button" onClick={onClose}>
            I have saved these credentials
          </Button>
        </div>
      </div>
    </div>
  );
}
