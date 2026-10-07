"use client";

import { type FormEvent, useRef, useState } from "react";
import { ChevronDown, Plus } from "lucide-react";

import { isFieldOfficer } from "@/components/dashboard/nav-config";
import { FormField } from "@/components/dashboard/form-field";
import { InlineAlert } from "@/components/dashboard/inline-alert";
import { Panel } from "@/components/dashboard/panel";
import { WhitelistEntryCard } from "@/components/whitelist/whitelist-entry-card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import type { BeneficiaryWhitelist, WhitelistEffect, WhitelistEntry } from "@/lib/api/backoffice-types";
import { apiClient } from "@/lib/api/client";
import { ApiError, errorMessage, fieldErrorMap } from "@/lib/api/errors";
import { useResource } from "@/lib/api/use-resource";
import { useSession } from "@/lib/auth/use-session";
import { WHITELIST_REASONS } from "@/lib/backoffice/options";
import { cn } from "@/lib/utils";

const ACCEPTED = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

/**
 * Whitelist state for one household. FIELD_OFFICER / BRANCH request it;
 * ADMIN approves, rejects or revokes. It never changes the score.
 */
export function WhitelistPanel({ beneficiaryId }: { beneficiaryId: string }) {
  const { session } = useSession();
  const path = `/api/backoffice/beneficiaries/${encodeURIComponent(beneficiaryId)}/whitelist`;
  const { data, error, reload } = useResource<BeneficiaryWhitelist>(path);
  const [requestOpen, setRequestOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const canRequest = (isFieldOfficer(session) || (session?.isBranch ?? false)) && !data?.current;
  const canDecide = session?.isAdmin ?? false;
  const history = (data?.history ?? []).filter((entry) => entry.id !== data?.current?.id);

  return (
    <Panel
      title="Whitelist"
      description="A verified need outside the score. It changes pool order, never the score."
      actions={
        canRequest ? (
          <Button size="sm" variant="outline" onClick={() => setRequestOpen(true)}>
            <Plus />
            Request
          </Button>
        ) : null
      }
    >
      {error ? (
        <p className="text-sm text-black/45">{error.message}</p>
      ) : data?.current ? (
        <WhitelistEntryCard entry={data.current} canDecide={canDecide} onChanged={() => reload()} />
      ) : (
        <p className="text-sm text-black/45">Not whitelisted.</p>
      )}

      {history.length > 0 ? (
        <div className="mt-4 border-t border-black/[0.06] pt-3">
          <button
            type="button"
            onClick={() => setShowHistory((value) => !value)}
            className="inline-flex items-center gap-1 text-xs font-medium text-black/55 hover:text-[#001539]"
            aria-expanded={showHistory}
          >
            <ChevronDown className={cn("size-3.5 transition", showHistory && "rotate-180")} />
            History ({history.length})
          </button>
          {showHistory ? (
            <ul className="mt-3 space-y-4">
              {history.map((entry) => (
                <li key={entry.id} className="border-l-2 border-black/10 pl-3">
                  <WhitelistEntryCard entry={entry} canDecide={false} onChanged={() => reload()} compact />
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <RequestDialog
        path={path}
        open={requestOpen}
        onOpenChange={setRequestOpen}
        onCreated={() => {
          setRequestOpen(false);
          reload();
        }}
      />
    </Panel>
  );
}

function RequestDialog({
  path,
  open,
  onOpenChange,
  onCreated,
}: {
  path: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (entry: WhitelistEntry) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [effect, setEffect] = useState<WhitelistEffect>("FAST_TRACK");
  const [reasonCode, setReasonCode] = useState("");
  const [justification, setJustification] = useState("");
  const [communityNote, setCommunityNote] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const minJustification = reasonCode === "other" ? 30 : 20;
  const isDisaster = reasonCode === "disaster_or_displacement_emergency";
  const noteReplacesFiles = isDisaster && communityNote.trim().length >= 20;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    if (justification.trim().length < minJustification) {
      setError(`The justification needs at least ${minJustification} characters.`);
      return;
    }
    if (files.length === 0 && !noteReplacesFiles) {
      setError(
        isDisaster
          ? "Attach evidence, or write a community verification note of at least 20 characters."
          : "Attach at least one evidence file.",
      );
      return;
    }
    if (files.length > 5) {
      setError("Attach at most 5 files.");
      return;
    }
    if (files.some((file) => !ACCEPTED.includes(file.type))) {
      setError("Evidence must be PDF, JPEG, PNG or WebP.");
      return;
    }

    const body = new FormData();
    body.append("effect", effect);
    body.append("reasonCode", reasonCode);
    body.append("justification", justification.trim());
    if (communityNote.trim()) body.append("communityVerificationNote", communityNote.trim());
    for (const file of files) body.append("files", file);

    setIsSaving(true);
    try {
      const entry = await apiClient<WhitelistEntry>(path, { method: "POST", body });
      setReasonCode("");
      setJustification("");
      setCommunityNote("");
      setFiles([]);
      if (fileRef.current) fileRef.current.value = "";
      onCreated(entry);
    } catch (submitError) {
      setError(errorMessage(submitError, "Couldn't send the request"));
      if (submitError instanceof ApiError) setFieldErrors(fieldErrorMap(submitError.errors));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] max-w-lg overflow-y-auto">
        <form onSubmit={onSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="text-[#001539]">Request whitelist</DialogTitle>
            <DialogDescription>ADMIN reviews the request. You can&apos;t decide on your own request.</DialogDescription>
          </DialogHeader>
          {error ? <InlineAlert>{error}</InlineAlert> : null}

          <div role="radiogroup" aria-label="Effect" className="grid gap-2 sm:grid-cols-2">
            {(
              [
                ["FAST_TRACK", "Fast track", "Emergency. Goes to the pool queue straight away, before an assessment."],
                ["PRIORITY", "Priority", "Long-term need. Listed first after fast track; needs a submitted assessment."],
              ] as const
            ).map(([value, label, hint]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={effect === value}
                onClick={() => setEffect(value)}
                className={cn(
                  "rounded-lg border p-3 text-left transition",
                  effect === value ? "border-[#007050] bg-[#007050]/[0.05] ring-1 ring-[#007050]" : "border-black/10 hover:border-black/20",
                )}
              >
                <span className="block text-sm font-semibold text-[#001539]">{label}</span>
                <span className="mt-0.5 block text-xs text-black/55">{hint}</span>
              </button>
            ))}
          </div>

          <FormField label="Reason" htmlFor="wl-reason" required error={fieldErrors.reasonCode}>
            <NativeSelect id="wl-reason" value={reasonCode} onChange={(event) => setReasonCode(event.target.value)} required>
              <option value="">Select</option>
              {WHITELIST_REASONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </NativeSelect>
          </FormField>
          <FormField
            label="Justification"
            htmlFor="wl-justification"
            required
            hint={`At least ${minJustification} characters (${justification.trim().length})`}
            error={fieldErrors.justification}
          >
            <Textarea id="wl-justification" value={justification} onChange={(event) => setJustification(event.target.value)} />
          </FormField>
          <FormField
            label="Community verification note"
            htmlFor="wl-note"
            hint={isDisaster ? "For disasters, a note of 20+ characters can replace the files" : "Optional"}
            error={fieldErrors.communityVerificationNote}
          >
            <Textarea id="wl-note" rows={2} value={communityNote} onChange={(event) => setCommunityNote(event.target.value)} />
          </FormField>
          <FormField
            label="Evidence"
            htmlFor="wl-files"
            required={!noteReplacesFiles}
            hint="1–5 files: PDF, JPEG, PNG or WebP"
            error={fieldErrors.files}
          >
            <input
              ref={fileRef}
              id="wl-files"
              type="file"
              multiple
              accept={ACCEPTED.join(",")}
              onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
              className="block w-full text-sm text-black/60 file:mr-3 file:rounded-md file:border-0 file:bg-[#001539] file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white"
            />
          </FormField>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving || !reasonCode}>
              {isSaving ? "Sending…" : "Send request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
