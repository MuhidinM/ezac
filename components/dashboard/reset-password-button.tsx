"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";

import { CredentialsOnceDialog } from "@/components/branches/credentials-once-dialog";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { Button } from "@/components/ui/button";
import type { PasswordResetResponse } from "@/lib/api/backoffice-types";
import { apiClient } from "@/lib/api/client";

/** Reset a branch or field officer password and show the new one once. */
export function ResetPasswordButton({
  path,
  login,
  recipient,
}: {
  /** POST endpoint, e.g. /api/backoffice/admin/branches/2/reset-password */
  path: string;
  /** Fallback login shown when the response has no username. */
  login: string;
  recipient: string;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [result, setResult] = useState<PasswordResetResponse | null>(null);

  return (
    <>
      <Button variant="outline" onClick={() => setConfirmOpen(true)}>
        <KeyRound />
        Reset password
      </Button>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Reset password?"
        description={`A new temporary password is generated. The ${recipient}'s current sessions end and they must change the password at their next login.`}
        confirmLabel="Reset password"
        onConfirm={async () => {
          setResult(await apiClient<PasswordResetResponse>(path, { method: "POST" }));
        }}
      />

      {result ? (
        <CredentialsOnceDialog
          title="New temporary password"
          recipient={recipient}
          login={result.username || login}
          initialPassword={result.initialPassword}
          passwordChangeRequired={result.passwordChangeRequired}
          onClose={() => setResult(null)}
        />
      ) : null}
    </>
  );
}
