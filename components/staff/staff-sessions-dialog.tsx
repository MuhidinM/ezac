"use client";

import { useState } from "react";
import { LogOut, RefreshCw } from "lucide-react";

import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { ErrorAlert } from "@/components/dashboard/error-alert";
import { InlineAlert } from "@/components/dashboard/inline-alert";
import { TableMessageRow, TableSkeletonRows } from "@/components/dashboard/table-states";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiClient } from "@/lib/api/client";
import { useResource } from "@/lib/api/use-resource";
import { formatDateTime } from "@/lib/beneficiary/format";
import { type StaffAccount, type StaffSession, staffName } from "@/lib/branches/staff-accounts";

/** null = no confirm open, "all" = every session, otherwise one session. */
type EndTarget = StaffSession | "all" | null;

/**
 * The open sessions of one staff login, with "End" for one session and
 * "End all sessions". Ending a session refuses its sign-in and refresh at
 * once; pages already open stop working within 30 seconds.
 */
export function StaffSessionsDialog({
  account,
  own,
  onClose,
}: {
  account: StaffAccount;
  /** The signed-in admin's own account: ending its sessions signs them out too. */
  own: boolean;
  onClose: () => void;
}) {
  const path = `/bff/admin/users/${encodeURIComponent(account.sub)}/sessions`;
  const { data, error, isLoading, reload } = useResource<StaffSession[]>(path);
  const [target, setTarget] = useState<EndTarget>(null);
  // What the confirm was opened for, so its text doesn't change while it closes.
  const [shown, setShown] = useState<EndTarget>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const sessions = data ?? [];
  const name = staffName(account);

  function confirmEnd(next: Exclude<EndTarget, null>) {
    setShown(next);
    setTarget(next);
  }

  async function end() {
    if (!target) return;
    if (target === "all") {
      await apiClient(path, { method: "DELETE" });
      setNotice(`Every session of ${name} has ended.`);
    } else {
      await apiClient(`${path}/${encodeURIComponent(target.id)}`, { method: "DELETE" });
      setNotice("The session has ended.");
    }
    reload();
  }

  const ownWarningAll = own ? " This is your own account, so you are signed out here too." : "";
  const ownWarningOne = own ? " If it is this browser, you are signed out here too." : "";

  return (
    <>
      <Dialog open onOpenChange={(open) => (open ? null : onClose())}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-navy">Sessions of {name}</DialogTitle>
            <DialogDescription>
              Each sign-in is a session. Ending one signs that device out within 30 seconds; the password stays the
              same.
            </DialogDescription>
          </DialogHeader>

          {notice ? <InlineAlert tone="success">{notice}</InlineAlert> : null}
          <ErrorAlert error={error} onRetry={reload} fallback="The sessions couldn't be loaded." />

          <div className="max-h-80 overflow-auto rounded-lg border border-black/[0.06]">
            <Table>
              <TableHeader>
                <TableRow className="bg-black/[0.015]">
                  <TableHead className="pl-4">Signed in</TableHead>
                  <TableHead>Last active</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead className="pr-4 text-right">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && !data ? (
                  <TableSkeletonRows colSpan={4} />
                ) : sessions.length === 0 ? (
                  <TableMessageRow colSpan={4}>No open sessions.</TableMessageRow>
                ) : (
                  sessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell className="pl-4">{formatDateTime(session.startedAt)}</TableCell>
                      <TableCell>{formatDateTime(session.lastAccessAt)}</TableCell>
                      <TableCell className="font-mono text-xs text-black/65">{session.ipAddress ?? "—"}</TableCell>
                      <TableCell className="pr-4 text-right">
                        <Button variant="destructive-ghost" size="sm" onClick={() => confirmEnd(session)}>
                          End<span className="sr-only"> the session from {formatDateTime(session.startedAt)}</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={reload} disabled={isLoading}>
              <RefreshCw />
              Refresh
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => confirmEnd("all")}
              disabled={sessions.length === 0}
            >
              <LogOut />
              End all sessions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={target !== null}
        onOpenChange={(open) => (open ? null : setTarget(null))}
        title={shown === "all" ? `End every session of ${name}?` : "End this session?"}
        description={
          shown === "all"
            ? `${name} is signed out everywhere within 30 seconds and must sign in again. The password stays the same.${ownWarningAll}`
            : `That device is signed out within 30 seconds and must sign in again.${ownWarningOne}`
        }
        confirmLabel={shown === "all" ? "End all sessions" : "End session"}
        destructive
        onConfirm={end}
      />
    </>
  );
}
