"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { copyToClipboard } from "@/lib/clipboard";

type Props = {
  /** Login username (the phone number for branch and field officers). */
  login: string;
  initialPassword: string;
  passwordChangeRequired: boolean;
  title?: string;
  /** Who receives the credentials, e.g. "branch officer". */
  recipient?: string;
  onClose: () => void;
};

type CopyTarget = "login" | "password" | "both";

export function CredentialsOnceDialog({
  login,
  initialPassword,
  passwordChangeRequired,
  title = "Branch credentials",
  recipient = "branch officer",
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="credentials-title"
        className="w-full max-w-lg rounded-xl border border-black/[0.06] bg-white p-6 shadow-xl"
      >
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
            <KeyRound className="size-5" />
          </span>
          <div>
            <h2
              id="credentials-title"
              className="text-lg font-semibold tracking-tight text-[#001539]"
            >
              {title}
            </h2>
            <p className="mt-1 text-sm text-black/60">
              Shown once only. Copy the login and temporary password and share
              them securely with the {recipient} before closing.
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <CredentialRow
            label="Login"
            value={login}
            copied={copied === "login"}
            onCopy={() => void copyText(login, "login")}
          />
          <CredentialRow
            label="Temporary password"
            value={initialPassword}
            highlight
            copied={copied === "password"}
            onCopy={() => void copyText(initialPassword, "password")}
          />

          {passwordChangeRequired ? (
            <p className="text-sm text-black/55">
              The {recipient} must change this password on first login.
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
              void copyText(`Login: ${login}\nPassword: ${initialPassword}`, "both")
            }
          >
            {copied === "both" ? "Copied both" : "Copy both"}
          </Button>
          <Button type="button" onClick={onClose}>
            I have saved these credentials
          </Button>
        </div>
      </div>
    </div>
  );
}

function CredentialRow({
  label,
  value,
  highlight,
  copied,
  onCopy,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div
      className={
        highlight
          ? "rounded-lg border border-amber-200 bg-amber-50/70 px-4 py-3"
          : "rounded-lg border border-black/[0.08] bg-black/[0.02] px-4 py-3"
      }
    >
      <p className="text-xs font-medium text-black/50">{label}</p>
      <div className="mt-1 flex items-center justify-between gap-3">
        <code className="font-mono text-sm break-all text-[#001539] select-all">
          {value}
        </code>
        <Button type="button" variant="outline" size="sm" onClick={onCopy}>
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
    </div>
  );
}
