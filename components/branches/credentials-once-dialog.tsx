"use client";

import { useState } from "react";
import { Check, Copy, KeyRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

/**
 * The one-time login and temporary password of a new (or reset) account.
 * A standard modal dialog: focus moves in and stays inside, and the page
 * behind can't be scrolled or clicked. It can't be dismissed by accident
 * (Escape, a click outside or the corner X): the password is never shown
 * again, so the only way out is the confirm button.
 */
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
      setCopyError("Could not copy automatically. Select the text and copy it manually.");
      return;
    }
    setCopied(which);
  }

  return (
    <Dialog open onOpenChange={() => undefined}>
      <DialogContent
        className="max-w-lg [&>button:last-child]:hidden"
        onEscapeKeyDown={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader className="flex-row items-start gap-3 space-y-0 text-left">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
            <KeyRound aria-hidden="true" className="size-5" />
          </span>
          <div className="space-y-1">
            <DialogTitle className="text-lg font-semibold tracking-tight text-navy">{title}</DialogTitle>
            <DialogDescription className="text-sm text-black/60">
              Shown once only. Copy the login and temporary password and share them securely with the {recipient}{" "}
              before closing.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="space-y-3">
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
            <p className="text-sm text-black/60">The {recipient} must change this password on first login.</p>
          ) : null}

          {copyError ? (
            <p role="alert" className="text-sm text-rose-700">
              {copyError}
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => void copyText(`Login: ${login}\nPassword: ${initialPassword}`, "both")}
          >
            {copied === "both" ? <Check /> : <Copy />}
            {copied === "both" ? "Copied both" : "Copy both"}
          </Button>
          <Button type="button" onClick={onClose}>
            I have saved these credentials
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
      <p className="text-xs font-medium text-black/60">{label}</p>
      <div className="mt-1 flex items-center justify-between gap-3">
        <code className="font-mono text-sm break-all text-navy select-all">{value}</code>
        <Button type="button" variant="outline" size="sm" onClick={onCopy}>
          {copied ? <Check /> : <Copy />}
          {copied ? "Copied" : "Copy"}
          <span className="sr-only"> {label.toLowerCase()}</span>
        </Button>
      </div>
    </div>
  );
}
