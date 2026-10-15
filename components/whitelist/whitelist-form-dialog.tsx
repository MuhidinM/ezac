"use client";

import { type FormEvent, useRef, useState } from "react";
import { Search } from "lucide-react";

import { FormField } from "@/components/dashboard/form-field";
import { InlineAlert } from "@/components/dashboard/inline-alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import type { WhitelistEffect, WhitelistEntry } from "@/lib/api/backoffice-types";
import { apiClient } from "@/lib/api/client";
import { ApiError, errorMessage, fieldErrorMap } from "@/lib/api/errors";
import type { BeneficiaryListItem, PaginatedItems } from "@/lib/api/types";
import { useResource } from "@/lib/api/use-resource";
import { WHITELIST_REASONS } from "@/lib/backoffice/options";
import { cn } from "@/lib/utils";

const ACCEPTED = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

/** ADMIN adds directly (active at once); field officers and branches send a request ADMIN decides on. */
export const ADMIN_WHITELIST_PATH = "/api/backoffice/admin/whitelist";

export function requestPath(beneficiaryId: string) {
  return `/api/backoffice/beneficiaries/${encodeURIComponent(beneficiaryId)}/whitelist`;
}

type Picked = { id: string; name: string };

/** Search-as-you-type picker for the household being whitelisted. */
function BeneficiaryPicker({ value, onChange }: { value: Picked | null; onChange: (value: Picked | null) => void }) {
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const { data, isLoading } = useResource<PaginatedItems<BeneficiaryListItem>>(
    query.length >= 2 ? `/api/backoffice/beneficiaries?search=${encodeURIComponent(query)}&page=1&limit=8` : null,
  );

  if (value) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-[#007050]/30 bg-[#007050]/[0.04] px-3 py-2">
        <span className="text-sm font-medium text-[#001539]">{value.name}</span>
        <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}>
          Change
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-black/35" />
          <Input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                setQuery(draft.trim());
              }
            }}
            placeholder="Name, phone or beneficiary code"
            className="pl-9"
            autoFocus
          />
        </div>
        <Button type="button" variant="secondary" onClick={() => setQuery(draft.trim())}>
          Search
        </Button>
      </div>
      {query.length >= 2 ? (
        <ul className="max-h-56 divide-y divide-black/[0.05] overflow-y-auto rounded-lg border border-black/[0.08]">
          {isLoading && !data ? (
            <li className="px-3 py-2 text-sm text-black/45">Searching…</li>
          ) : (data?.items ?? []).length === 0 ? (
            <li className="px-3 py-2 text-sm text-black/45">No households found.</li>
          ) : (
            data!.items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  disabled={Boolean(item.whitelistEffect)}
                  onClick={() => onChange({ id: item.id, name: item.fullName ?? `Beneficiary #${item.id}` })}
                  className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-black/[0.02] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span>
                    <span className="block font-medium text-[#001539]">{item.fullName ?? `Beneficiary #${item.id}`}</span>
                    <span className="block text-xs text-black/50">{item.phone ?? "—"}</span>
                  </span>
                  {item.whitelistEffect ? <span className="text-xs text-black/50">Already whitelisted</span> : null}
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}

/**
 * Whitelist form. With a beneficiary given it sends a request for that
 * household; in ADMIN mode without one it starts with a household search.
 */
export function WhitelistFormDialog({
  mode,
  beneficiary,
  open,
  onOpenChange,
  onSaved,
}: {
  mode: "request" | "admin";
  beneficiary?: Picked;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (entry: WhitelistEntry) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [picked, setPicked] = useState<Picked | null>(beneficiary ?? null);
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
  const isAdmin = mode === "admin";

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    if (!picked) {
      setError("Choose the household first.");
      return;
    }
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
    if (isAdmin) body.append("beneficiaryId", picked.id);
    body.append("effect", effect);
    body.append("reasonCode", reasonCode);
    body.append("justification", justification.trim());
    if (communityNote.trim()) body.append("communityVerificationNote", communityNote.trim());
    for (const file of files) body.append("files", file);

    setIsSaving(true);
    try {
      const entry = await apiClient<WhitelistEntry>(isAdmin ? ADMIN_WHITELIST_PATH : requestPath(picked.id), { method: "POST", body });
      setPicked(beneficiary ?? null);
      setReasonCode("");
      setJustification("");
      setCommunityNote("");
      setFiles([]);
      if (fileRef.current) fileRef.current.value = "";
      onSaved(entry);
    } catch (submitError) {
      const unsupported =
        isAdmin && submitError instanceof ApiError && [403, 404, 405].includes(submitError.status);
      setError(
        unsupported
          ? "Adding households directly isn't switched on in the backend yet. It has been requested; until then a field officer or branch can send the request for you to approve."
          : errorMessage(submitError, isAdmin ? "Couldn't add to the whitelist" : "Couldn't send the request"),
      );
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
            <DialogTitle className="text-[#001539]">{isAdmin ? "Add to whitelist" : "Request whitelist"}</DialogTitle>
            <DialogDescription>
              {isAdmin
                ? "Active straight away. It changes the pool order, never the score."
                : "ADMIN reviews the request. You can't decide on your own request."}
            </DialogDescription>
          </DialogHeader>
          {error ? <InlineAlert>{error}</InlineAlert> : null}

          {isAdmin && !beneficiary ? (
            <FormField label="Household" required error={fieldErrors.beneficiaryId}>
              <BeneficiaryPicker value={picked} onChange={setPicked} />
            </FormField>
          ) : null}

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
            <Button type="submit" disabled={isSaving || !reasonCode || !picked}>
              {isSaving ? "Saving…" : isAdmin ? "Add to whitelist" : "Send request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
