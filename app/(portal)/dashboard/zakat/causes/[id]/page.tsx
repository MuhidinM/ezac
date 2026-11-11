"use client";

import { useParams, useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { Lock, Send } from "lucide-react";

import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { FormField } from "@/components/dashboard/form-field";
import { useBreadcrumbLabel } from "@/components/dashboard/dashboard-header";
import { ErrorAlert } from "@/components/dashboard/error-alert";
import { InlineAlert } from "@/components/dashboard/inline-alert";
import { PageHeader } from "@/components/dashboard/page-header";
import { DetailList, Panel } from "@/components/dashboard/panel";
import { RequireRole } from "@/components/dashboard/require-role";
import { DetailSkeleton } from "@/components/dashboard/skeletons";
import { CauseStatusBadge } from "@/components/zakat/cause-status-badge";
import { AMHARIC_HINT, AMHARIC_INPUT, AMHARIC_TITLE } from "@/components/zakat/content/amharic";
import { coverAltTextChange, endDatePassed, endsOnError, todayInAddis } from "@/components/zakat/content/cause-rules";
import type { CauseAdmin } from "@/components/zakat/content/types";
import { VersionConflictAlert } from "@/components/zakat/content/version-conflict-alert";
import { ImageUpload, type MediaRef } from "@/components/zakat/image-upload";
import { staffRef } from "@/components/zakat/staff-ref";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api/client";
import { ApiError, errorMessage, fieldErrorMap, isVersionConflict } from "@/lib/api/errors";
import { useResource } from "@/lib/api/use-resource";
import { formatEtb } from "@/lib/backoffice/format";
import { formatDateTime } from "@/lib/beneficiary/format";
import { CAUSE_BADGES, CONTENT_CATEGORIES } from "@/lib/zakat/content";

const API = "/bff/zakat-admin/causes";

type Form = {
  title: string;
  description: string;
  body: string;
  titleAm: string;
  descriptionAm: string;
  bodyAm: string;
  category: string;
  badge: string;
  image: MediaRef[];
  imageAltText: string;
  gallery: MediaRef[];
  goalEtb: string;
  raisedOfflineEtb: string;
  region: string;
  endsOn: string;
  acceptsZakat: boolean;
};

const EMPTY: Form = {
  title: "",
  description: "",
  body: "",
  titleAm: "",
  descriptionAm: "",
  bodyAm: "",
  category: "",
  badge: "",
  image: [],
  imageAltText: "",
  gallery: [],
  goalEtb: "",
  raisedOfflineEtb: "",
  region: "",
  endsOn: "",
  acceptsZakat: true,
};

function toForm(cause: CauseAdmin): Form {
  const galleryIds = cause.galleryMediaIds ?? [];
  return {
    title: cause.title,
    description: cause.description,
    body: cause.body ?? "",
    titleAm: cause.titleAm ?? "",
    descriptionAm: cause.descriptionAm ?? "",
    bodyAm: cause.bodyAm ?? "",
    category: cause.category,
    badge: cause.badge ?? "",
    // The admin URLs also work for a draft's images.
    image: cause.imageMediaId != null ? [{ id: String(cause.imageMediaId), url: cause.adminImageUrl ?? cause.imageUrl }] : [],
    imageAltText: cause.imageAltText ?? "",
    gallery: galleryIds.map((id, index) => ({ id: String(id), url: cause.adminGalleryUrls?.[index] ?? cause.images?.[index] ?? null })),
    goalEtb: cause.goalEtb != null ? String(cause.goalEtb) : "",
    raisedOfflineEtb: cause.raisedOfflineEtb != null ? String(cause.raisedOfflineEtb) : "",
    region: cause.region ?? "",
    endsOn: cause.endsOn ?? "",
    acceptsZakat: cause.acceptsZakat,
  };
}

/** The money figures that change between two versions of the form, as text ("—" for none). */
function moneyChanges(before: Form, after: Form) {
  const amount = (value: string, blank: string) => (value.trim() ? formatEtb(Number(value)) : blank);
  const changes: { label: string; from: string; to: string }[] = [];
  if (before.goalEtb.trim() !== after.goalEtb.trim()) {
    changes.push({ label: "Goal", from: amount(before.goalEtb, "No goal"), to: amount(after.goalEtb, "No goal") });
  }
  // A blank "raised offline" is saved as 0.
  if (Number(before.raisedOfflineEtb || 0) !== Number(after.raisedOfflineEtb || 0)) {
    changes.push({ label: "Raised offline", from: amount(before.raisedOfflineEtb, formatEtb(0)), to: amount(after.raisedOfflineEtb, formatEtb(0)) });
  }
  return changes;
}

/**
 * PUT replaces the cause, so every field is sent; empty optionals become null.
 * `regionCode` is the chosen impact region's code (null for a name that is not
 * one). An edit sends the loaded `version`.
 */
function toBody(form: Form, regionCode: string | null, version?: number) {
  const mediaId = (value: string) => (/^\d+$/.test(value) ? Number(value) : value);
  return {
    title: form.title.trim(),
    description: form.description.trim(),
    body: form.body.trim() || null,
    titleAm: form.titleAm.trim() || null,
    descriptionAm: form.descriptionAm.trim() || null,
    bodyAm: form.bodyAm.trim() || null,
    category: form.category,
    badge: form.badge || null,
    imageMediaId: form.image[0] ? mediaId(form.image[0].id) : null,
    galleryMediaIds: form.gallery.map((item) => mediaId(item.id)),
    goalEtb: form.goalEtb.trim() ? Number(form.goalEtb) : null,
    raisedOfflineEtb: form.raisedOfflineEtb.trim() ? Number(form.raisedOfflineEtb) : 0,
    region: form.region.trim() || null,
    regionCode,
    endsOn: form.endsOn || null,
    acceptsZakat: form.acceptsZakat,
    ...(version != null ? { version } : {}),
  };
}

export default function CauseEditorPage() {
  return (
    <RequireRole audience={["admin"]}>
      <CauseEditor />
    </RequireRole>
  );
}

function CauseEditor() {
  const params = useParams<{ id: string }>();
  const isNew = params.id === "new";
  const { data: cause, error, mutate, reload } = useResource<CauseAdmin>(isNew ? null : `${API}/${encodeURIComponent(params.id)}`);
  const [notice, setNotice] = useState<string | null>(null);
  useBreadcrumbLabel(isNew ? "New cause" : cause?.title);

  if (isNew) return <CauseForm initial={EMPTY} notice={null} onNotice={setNotice} />;
  if (error && !cause) return <ErrorAlert error={error} onRetry={reload} />;
  if (!cause) return <DetailSkeleton side={false} />;
  // Keyed so the form resets when the cause is replaced after save/publish or a reload.
  return (
    <CauseForm
      key={`${cause.id}-${cause.version}-${cause.updatedAt}-${cause.status}`}
      cause={cause}
      initial={toForm(cause)}
      notice={notice}
      onNotice={setNotice}
      onReplaced={(next) => mutate(next)}
      onReload={reload}
    />
  );
}

function CauseForm({
  cause,
  initial,
  notice,
  onNotice,
  onReplaced,
  onReload,
}: {
  cause?: CauseAdmin;
  initial: Form;
  notice: string | null;
  onNotice: (notice: string | null) => void;
  onReplaced?: (cause: CauseAdmin) => void;
  onReload?: () => void;
}) {
  const router = useRouter();
  const [form, setForm] = useState<Form>(initial);
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [action, setAction] = useState<"publish" | "close" | null>(null);
  // Money figures on a published cause go public on save, so they are shown before and after first (gap-r1-3-2).
  const [confirmFigures, setConfirmFigures] = useState(false);
  // Impact regions, so causes use the same names the live region counts use.
  const regions = useResource<{ code: string; name: string }[]>("/bff/zakat-admin/impact/regions");
  const regionNames = (regions.data ?? []).map((region) => region.name);
  // The chosen region's code; while the region list is not loaded, an unchanged region keeps its saved code.
  const regionCodeFor = (name: string) =>
    regions.data
      ? (regions.data.find((region) => region.name === name)?.code ?? null)
      : name === initial.region
        ? (cause?.regionCode ?? null)
        : null;
  const [today] = useState(() => todayInAddis());
  const endsOnProblem = endsOnError(form.endsOn, cause ? cause.endsOn : null, today);
  const savedEndPassed = Boolean(cause?.ended) || endDatePassed(cause?.endsOn, today);

  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((prev) => ({ ...prev, [key]: value }));

  const published = cause ? cause.status !== "DRAFT" : false;
  const figureChanges = cause ? moneyChanges(initial, form) : [];

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setConflict(false);
    setFieldErrors({});
    onNotice(null);
    if (endsOnProblem) {
      setFieldErrors({ endsOn: endsOnProblem });
      return;
    }
    if (published && figureChanges.length > 0) {
      setConfirmFigures(true);
      return;
    }
    void save();
  }

  async function save() {
    setIsSaving(true);
    try {
      // Alt text belongs to the image, so it is saved on the image first.
      const altChange = coverAltTextChange(
        { id: form.image[0]?.id ?? "", altText: form.imageAltText },
        { id: initial.image[0]?.id ?? null, altText: initial.imageAltText },
      );
      if (altChange) {
        await apiClient(`/bff/zakat-admin/media/${encodeURIComponent(altChange.mediaId)}`, {
          method: "PATCH",
          body: JSON.stringify({ altText: altChange.altText }),
        });
      }
      const saved = await apiClient<CauseAdmin>(cause ? `${API}/${encodeURIComponent(cause.id)}` : API, {
        method: cause ? "PUT" : "POST",
        body: JSON.stringify(
          toBody(form, regionCodeFor(form.region), cause?.version),
        ),
      });
      if (!cause) {
        router.replace(`/dashboard/zakat/causes/${encodeURIComponent(saved.id)}`);
        return;
      }
      onNotice("Changes saved.");
      onReplaced?.(saved);
    } catch (saveError) {
      if (isVersionConflict(saveError)) {
        setConflict(true);
        return;
      }
      setError(errorMessage(saveError, "Couldn't save the cause"));
      if (saveError instanceof ApiError) setFieldErrors(fieldErrorMap(saveError.errors));
    } finally {
      setIsSaving(false);
    }
  }

  const canPublish = cause && (cause.status === "DRAFT" || cause.status === "CLOSED");
  const canClose = cause?.status === "ACTIVE";
  // Publishing or re-opening past the end date is refused (409), so it waits for a later date.
  const publishBlocked = Boolean(canPublish) && endDatePassed(cause?.endsOn, today);

  return (
    <section className="space-y-6">
      <PageHeader
        back={{ href: "/dashboard/zakat/causes", label: "Causes" }}
        title={cause ? cause.title : "New cause"}
        meta={cause ? <CauseStatusBadge status={cause.status} ended={cause.ended} /> : undefined}
        description={cause ? undefined : "Saved as a draft. Publish it to show it in the app."}
        actions={
          cause ? (
            <>
              {canClose ? (
                <Button variant="outline" onClick={() => setAction("close")} disabled={dirty}>
                  <Lock />
                  Close
                </Button>
              ) : null}
              {canPublish ? (
                <Button onClick={() => setAction("publish")} disabled={dirty || publishBlocked}>
                  <Send />
                  {cause.status === "CLOSED" ? "Publish again" : "Publish"}
                </Button>
              ) : null}
            </>
          ) : null
        }
      />

      {notice ? <InlineAlert tone="success">{notice}</InlineAlert> : null}
      {dirty && cause ? (
        <InlineAlert tone="info">
          {canClose ? "Save or discard your changes before closing the cause." : "Save your changes before publishing."}
        </InlineAlert>
      ) : null}
      {cause && !dirty && savedEndPassed ? (
        cause.status === "ACTIVE" ? (
          <InlineAlert tone="warning">
            The end date has passed, so the cause closes automatically within the hour. Set a later end date to keep it running.
          </InlineAlert>
        ) : canPublish ? (
          <InlineAlert tone="warning">The end date has passed. Set an end date of today or later and save before publishing.</InlineAlert>
        ) : null
      ) : null}

      {cause ? (
        <Panel>
          <DetailList
            columns={4}
            items={[
              { label: "Raised in total", value: formatEtb(cause.raisedEtb) },
              {
                label: "Paid in the app",
                value: cause.liveRaisedEtb != null ? formatEtb(cause.liveRaisedEtb) : "Not available right now",
              },
              { label: "Raised offline", value: formatEtb(cause.raisedOfflineEtb ?? 0) },
              { label: "Goal", value: cause.goalEtb != null ? formatEtb(cause.goalEtb) : "No goal" },
              { label: "Progress", value: cause.progress != null ? `${Math.round(cause.progress * 100)}%` : "No goal" },
              { label: "Published", value: formatDateTime(cause.publishedAt) },
              { label: "Created by", value: staffRef(cause.createdBy, cause.createdByName) ?? "—" },
              { label: "Created", value: formatDateTime(cause.createdAt) },
            ]}
          />
        </Panel>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-6">
        {conflict && onReload ? <VersionConflictAlert onReload={onReload} /> : null}
        {error ? <InlineAlert>{error}</InlineAlert> : null}

        <Panel title="Content">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Title" htmlFor="title" required error={fieldErrors.title} className="sm:col-span-2">
              <Input id="title" value={form.title} maxLength={200} onChange={(e) => set("title", e.target.value)} required />
            </FormField>
            <FormField
              label="Short description"
              htmlFor="description"
              required
              hint={`Shown on the card (${form.description.length}/1000)`}
              error={fieldErrors.description}
              className="sm:col-span-2"
            >
              <Textarea id="description" rows={2} maxLength={1000} value={form.description} onChange={(e) => set("description", e.target.value)} required />
            </FormField>
            <FormField label="Full story" htmlFor="body" hint="Plain text for the cause detail screen" error={fieldErrors.body} className="sm:col-span-2">
              <Textarea id="body" rows={8} maxLength={20000} value={form.body} onChange={(e) => set("body", e.target.value)} />
            </FormField>
            <FormField label="Category" htmlFor="category" required error={fieldErrors.category}>
              <NativeSelect id="category" value={form.category} onChange={(e) => set("category", e.target.value)} required>
                <option value="">Select</option>
                {CONTENT_CATEGORIES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </NativeSelect>
            </FormField>
            <FormField label="Badge" htmlFor="badge" hint="Urgent causes are listed first, then essential" error={fieldErrors.badge}>
              <NativeSelect id="badge" value={form.badge} onChange={(e) => set("badge", e.target.value)}>
                <option value="">None</option>
                {CAUSE_BADGES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </NativeSelect>
            </FormField>
            <FormField label="Region" htmlFor="region" hint="From the impact regions, so the region counts match" error={fieldErrors.region}>
              <NativeSelect id="region" value={form.region} onChange={(e) => set("region", e.target.value)}>
                <option value="">Not specified</option>
                {regionNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
                {form.region && regions.data && !regionNames.includes(form.region) ? (
                  <option value={form.region}>{form.region} (not an impact region)</option>
                ) : null}
              </NativeSelect>
            </FormField>
            <FormField
              label="Ends on"
              htmlFor="endsOn"
              hint={endsOnProblem ? undefined : "Today or later. The cause closes automatically after this date."}
              error={fieldErrors.endsOn ?? endsOnProblem ?? undefined}
            >
              <Input
                id="endsOn"
                type="date"
                // An edit may keep an old date; only a new one has to be today or later.
                min={cause?.endsOn && cause.endsOn < today ? undefined : today}
                value={form.endsOn}
                onChange={(e) => set("endsOn", e.target.value)}
              />
            </FormField>
          </div>
        </Panel>

        <Panel title={AMHARIC_TITLE} description={AMHARIC_HINT}>
          <div className="grid gap-4">
            <FormField label="Title in Amharic" htmlFor="titleAm" error={fieldErrors.titleAm}>
              <Input id="titleAm" {...AMHARIC_INPUT} maxLength={200} value={form.titleAm} onChange={(e) => set("titleAm", e.target.value)} />
            </FormField>
            <FormField label="Short description in Amharic" htmlFor="descriptionAm" error={fieldErrors.descriptionAm}>
              <Textarea
                id="descriptionAm"
                {...AMHARIC_INPUT}
                rows={2}
                maxLength={1000}
                value={form.descriptionAm}
                onChange={(e) => set("descriptionAm", e.target.value)}
              />
            </FormField>
            <FormField label="Full story in Amharic" htmlFor="bodyAm" error={fieldErrors.bodyAm}>
              <Textarea id="bodyAm" {...AMHARIC_INPUT} rows={8} maxLength={20000} value={form.bodyAm} onChange={(e) => set("bodyAm", e.target.value)} />
            </FormField>
          </div>
        </Panel>

        <Panel title="Funding">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Goal (ETB)" htmlFor="goalEtb" hint="Leave empty for no progress bar" error={fieldErrors.goalEtb}>
              <Input id="goalEtb" type="number" min={0.01} step="0.01" value={form.goalEtb} onChange={(e) => set("goalEtb", e.target.value)} className="tabular-nums" />
            </FormField>
            <FormField
              label="Raised offline (ETB)"
              htmlFor="raisedOfflineEtb"
              hint="Collected outside the app. Added to the payments made in the app for the public total. Empty counts as 0."
              error={fieldErrors.raisedOfflineEtb}
            >
              <Input
                id="raisedOfflineEtb"
                type="number"
                min={0}
                step="0.01"
                value={form.raisedOfflineEtb}
                onChange={(e) => set("raisedOfflineEtb", e.target.value)}
                className="tabular-nums"
              />
            </FormField>
            <label className="flex items-start gap-2 text-sm text-navy sm:col-span-2">
              <input
                type="checkbox"
                checked={form.acceptsZakat}
                onChange={(e) => set("acceptsZakat", e.target.checked)}
                className="mt-0.5 size-4 accent-brand"
              />
              <span>
                Accepts zakat
                <span className="block text-xs text-black/60">Only causes accepting zakat appear in the payment project list.</span>
              </span>
            </label>
          </div>
        </Panel>

        <Panel title="Images" description="JPEG, PNG or WebP, up to 5 MB each">
          <div className="grid gap-6 sm:grid-cols-[auto_minmax(0,1fr)]">
            <FormField label="Cover" htmlFor="cover" error={fieldErrors.imageMediaId}>
              <ImageUpload id="cover" value={form.image} onChange={(value) => set("image", value)} />
            </FormField>
            <FormField label={`Gallery (${form.gallery.length}/10)`} htmlFor="gallery" error={fieldErrors.galleryMediaIds}>
              <ImageUpload id="gallery" max={10} value={form.gallery} onChange={(value) => set("gallery", value)} />
            </FormField>
            <FormField
              label="Cover description"
              htmlFor="imageAltText"
              hint={
                form.image.length
                  ? `What the photo shows, read out by screen readers (${form.imageAltText.length}/250)`
                  : "Add a cover image first."
              }
              error={fieldErrors.altText ?? fieldErrors.imageAltText}
              className="sm:col-span-2"
            >
              <Input
                id="imageAltText"
                maxLength={250}
                value={form.imageAltText}
                disabled={form.image.length === 0}
                onChange={(e) => set("imageAltText", e.target.value)}
              />
            </FormField>
          </div>
        </Panel>

        <div className="flex justify-end gap-2">
          {dirty && cause ? (
            <Button type="button" variant="outline" onClick={() => setForm(initial)}>
              Discard changes
            </Button>
          ) : null}
          <Button type="submit" disabled={cause ? !dirty : false} loading={isSaving} loadingText="Saving…">
            {cause ? "Save changes" : "Create draft"}
          </Button>
        </div>
      </form>

      {cause ? (
        <ConfirmDialog
          open={confirmFigures}
          onOpenChange={setConfirmFigures}
          title="Change the published figures?"
          description="This cause is public: the app and website show the new figures straight away."
          confirmLabel="Save changes"
          onConfirm={save}
        >
          <ul className="list-disc space-y-1 pl-5 text-sm text-navy">
            {figureChanges.map((change) => (
              <li key={change.label}>
                {change.label}: {change.from} → <strong>{change.to}</strong>
              </li>
            ))}
          </ul>
        </ConfirmDialog>
      ) : null}

      {cause ? (
        <ConfirmDialog
          open={action !== null}
          onOpenChange={(open) => !open && setAction(null)}
          title={action === "close" ? "Close this cause?" : "Publish this cause?"}
          description={
            action === "close"
              ? "It moves to the app's closed list and stops taking new payments. You can publish it again later."
              : "It appears in the app and on the website straight away."
          }
          confirmLabel={action === "close" ? "Close cause" : "Publish"}
          destructive={action === "close"}
          onConfirm={async () => {
            const next = await apiClient<CauseAdmin>(`${API}/${encodeURIComponent(cause.id)}/${action}`, { method: "POST" });
            onNotice(action === "close" ? "Cause closed." : "Cause published.");
            onReplaced?.(next);
          }}
        />
      ) : null}
    </section>
  );
}
