"use client";

import { type FormEvent, useRef, useState } from "react";

import { ErrorAlert } from "@/components/dashboard/error-alert";
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
import { NativeSelect } from "@/components/ui/native-select";
import { SearchInput } from "@/components/ui/search-input";
import { ChoiceCards, type ChoiceOption } from "@/components/ui/segmented-control";
import { Textarea } from "@/components/ui/textarea";
import type { WhitelistEffect, WhitelistEntry } from "@/lib/api/backoffice-types";
import { apiClient } from "@/lib/api/client";
import { ApiError, errorMessage, fieldErrorMap } from "@/lib/api/errors";
import type { BeneficiaryListItem, PaginatedItems } from "@/lib/api/types";
import { useResource } from "@/lib/api/use-resource";
import { WHITELIST_REASONS } from "@/lib/backoffice/options";
import { whitelistBlocker, whitelistCaution } from "@/lib/backoffice/whitelist";

const ACCEPTED = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
/** Per file, as for assessment documents; the server refuses uploads over 25 MB in total. */
const MAX_FILE_BYTES = 5 * 1024 * 1024;

/** ADMIN adds directly (active at once); field officers and branches send a request ADMIN decides on. */
export const ADMIN_WHITELIST_PATH = "/bff/backoffice/admin/whitelist";

export function requestPath(beneficiaryId: string) {
  return `/bff/backoffice/beneficiaries/${encodeURIComponent(beneficiaryId)}/whitelist`;
}

type Picked = { id: string; name: string };

const EFFECTS: readonly ChoiceOption<WhitelistEffect>[] = [
  {
    value: "FAST_TRACK",
    label: "Fast track",
    description: "Emergency. Goes to the pool queue straight away, before an assessment.",
  },
  {
    value: "PRIORITY",
    label: "Priority",
    description: "Long-term need. Listed first after fast track; needs a submitted assessment.",
  },
];

/** Household search for the admin's direct add; households that can't be whitelisted are listed but not offered. */
function BeneficiaryPicker({ value, onChange }: { value: Picked | null; onChange: (value: Picked | null) => void }) {
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const { data, error, isLoading, reload } = useResource<PaginatedItems<BeneficiaryListItem>>(
    query.length >= 2 ? `/bff/backoffice/beneficiaries?search=${encodeURIComponent(query)}&page=1&limit=8` : null,
  );

  if (value) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-brand/30 bg-brand/[0.04] px-3 py-2">
        <span className="text-sm font-medium text-navy">{value.name}</span>
        <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}>
          Change
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Not a <form>: this sits inside the whitelist form, so Enter searches by hand. */}
      <div role="search" className="flex gap-2">
        <SearchInput
          label="Search households"
          wrapperClassName="flex-1"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              setQuery(draft.trim());
            }
          }}
          placeholder="Name, phone or beneficiary code"
        />
        <Button type="button" variant="secondary" onClick={() => setQuery(draft.trim())}>
          Search
        </Button>
      </div>
      {query.length >= 2 && error ? (
        // A failed search must not read as "No households found".
        <ErrorAlert error={error} onRetry={reload} fallback="The search didn't work. Try again." />
      ) : query.length >= 2 ? (
        <ul aria-label="Search results" className="max-h-56 divide-y divide-black/[0.05] overflow-y-auto rounded-lg border border-black/[0.08]">
          {isLoading && !data ? (
            <li className="px-3 py-2 text-sm text-black/60">Searching…</li>
          ) : (data?.items ?? []).length === 0 ? (
            <li className="px-3 py-2 text-sm text-black/60">No households found.</li>
          ) : (
            data!.items.map((item) => {
              const blocker = whitelistBlocker(item);
              const caution = blocker ? null : whitelistCaution(item);
              const name = item.fullName ?? `Beneficiary #${item.id}`;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    disabled={Boolean(blocker)}
                    onClick={() => onChange({ id: item.id, name })}
                    className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-black/[0.02] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span>
                      <span className="block font-medium text-navy">{name}</span>
                      <span className="block text-xs text-black/60">{item.phone ?? "—"}</span>
                    </span>
                    {blocker || caution ? (
                      <span className={blocker ? "text-right text-xs text-black/60" : "text-right text-xs text-amber-700"}>
                        {blocker ?? caution}
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })
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
    const tooBig = files.find((file) => file.size > MAX_FILE_BYTES);
    if (tooBig) {
      setError(`"${tooBig.name}" is larger than 5 MB. Attach a smaller file or a scan at lower quality.`);
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
      // Direct add is missing (404/405/501) or broken (500 for every input in UAT) upstream;
      // either way the admin can't fix it from here, so say what to do instead. A 403 is a
      // real refusal (no permission): show the server's own message for it.
      const unsupported =
        isAdmin && submitError instanceof ApiError && [404, 405, 500, 501].includes(submitError.status);
      setError(
        unsupported
          ? "Adding a household directly isn't available yet. Until it is, ask a field officer or the branch to send a whitelist request, then approve it on the Whitelist page."
          : errorMessage(submitError, isAdmin ? "Couldn't add to the whitelist" : "Couldn't send the request"),
      );
      if (submitError instanceof ApiError && !unsupported) setFieldErrors(fieldErrorMap(submitError.errors));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] max-w-lg overflow-y-auto">
        <form onSubmit={onSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="text-navy">{isAdmin ? "Add to whitelist" : "Request whitelist"}</DialogTitle>
            <DialogDescription>
              {isAdmin
                ? "Active straight away. It changes the pool order, never the score."
                : "An administrator reviews the request. You can't decide on your own request."}
            </DialogDescription>
          </DialogHeader>
          {error ? <InlineAlert>{error}</InlineAlert> : null}

          {isAdmin && !beneficiary ? (
            <fieldset className="space-y-1.5">
              <legend className="text-[13px] font-medium text-navy">
                Household<span aria-hidden="true" className="text-rose-600">*</span>
              </legend>
              <BeneficiaryPicker value={picked} onChange={setPicked} />
              {fieldErrors.beneficiaryId ? <p className="text-xs text-rose-700">{fieldErrors.beneficiaryId}</p> : null}
            </fieldset>
          ) : null}

          <FormField label="Effect" required>
            {/* The name groups the hidden native radios Radix adds for the required field; without
                it a spec-following browser (Firefox) reads the unchosen effect as missing and blocks Save. */}
            <ChoiceCards name="effect" value={effect} onValueChange={setEffect} options={EFFECTS} />
          </FormField>

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
            hint="1–5 files: PDF, JPEG, PNG or WebP, up to 5 MB each"
            error={fieldErrors.files}
          >
            {/* A raw file input isn't wired by FormField, so it takes the id, hint/error and invalid state here. */}
            {(control) => (
              <input
                id={control.id}
                aria-describedby={control["aria-describedby"]}
                aria-invalid={control["aria-invalid"]}
                aria-required={control["aria-required"]}
                ref={fileRef}
                type="file"
                multiple
                accept={ACCEPTED.join(",")}
                onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
                className="block w-full text-sm text-black/60 file:mr-3 file:rounded-md file:border-0 file:bg-navy file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white"
              />
            )}
          </FormField>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={isSaving} loadingText="Saving…" disabled={!reasonCode || !picked}>
              {isAdmin ? "Add to whitelist" : "Send request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
