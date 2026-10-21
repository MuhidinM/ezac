"use client";

import { useParams, useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { Lock, Send } from "lucide-react";

import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { FormField } from "@/components/dashboard/form-field";
import { InlineAlert } from "@/components/dashboard/inline-alert";
import { PageHeader } from "@/components/dashboard/page-header";
import { DetailList, Panel } from "@/components/dashboard/panel";
import { RequireRole } from "@/components/dashboard/require-role";
import { CauseStatusBadge } from "@/components/zakat/cause-status-badge";
import { ImageUpload, type MediaRef } from "@/components/zakat/image-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api/client";
import { ApiError, errorMessage, fieldErrorMap } from "@/lib/api/errors";
import { useResource } from "@/lib/api/use-resource";
import { formatEtb } from "@/lib/backoffice/format";
import { formatDateTime } from "@/lib/beneficiary/format";
import { type AdminCause, CAUSE_BADGES, CONTENT_CATEGORIES } from "@/lib/zakat/content";

const API = "/bff/zakat-admin/causes";

type Form = {
  title: string;
  description: string;
  body: string;
  category: string;
  badge: string;
  image: MediaRef[];
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
  category: "",
  badge: "",
  image: [],
  gallery: [],
  goalEtb: "",
  raisedOfflineEtb: "",
  region: "",
  endsOn: "",
  acceptsZakat: true,
};

function toForm(cause: AdminCause): Form {
  const galleryIds = cause.galleryMediaIds ?? [];
  return {
    title: cause.title,
    description: cause.description,
    body: cause.body ?? "",
    category: cause.category,
    badge: cause.badge ?? "",
    image: cause.imageMediaId != null ? [{ id: String(cause.imageMediaId), url: cause.imageUrl }] : [],
    gallery: galleryIds.map((id, index) => ({ id: String(id), url: cause.images?.[index] ?? null })),
    goalEtb: cause.goalEtb != null ? String(cause.goalEtb) : "",
    raisedOfflineEtb: cause.raisedOfflineEtb != null ? String(cause.raisedOfflineEtb) : "",
    region: cause.region ?? "",
    endsOn: cause.endsOn ?? "",
    acceptsZakat: cause.acceptsZakat,
  };
}

/** PUT replaces the cause, so every field is sent; empty optionals become null. */
function toBody(form: Form) {
  const mediaId = (value: string) => (/^\d+$/.test(value) ? Number(value) : value);
  return {
    title: form.title.trim(),
    description: form.description.trim(),
    body: form.body.trim() || null,
    category: form.category,
    badge: form.badge || null,
    imageMediaId: form.image[0] ? mediaId(form.image[0].id) : null,
    galleryMediaIds: form.gallery.map((item) => mediaId(item.id)),
    goalEtb: form.goalEtb.trim() ? Number(form.goalEtb) : null,
    raisedOfflineEtb: form.raisedOfflineEtb.trim() ? Number(form.raisedOfflineEtb) : 0,
    region: form.region.trim() || null,
    endsOn: form.endsOn || null,
    acceptsZakat: form.acceptsZakat,
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
  const { data: cause, error, mutate } = useResource<AdminCause>(isNew ? null : `${API}/${encodeURIComponent(params.id)}`);
  const [notice, setNotice] = useState<string | null>(null);

  if (isNew) return <CauseForm initial={EMPTY} notice={null} onNotice={setNotice} />;
  if (error) return <InlineAlert>{error.message}</InlineAlert>;
  if (!cause) return <p className="text-sm text-black/45">Loading…</p>;
  // Keyed so the form resets when the cause is replaced after save/publish.
  return (
    <CauseForm
      key={`${cause.id}-${cause.updatedAt}-${cause.status}`}
      cause={cause}
      initial={toForm(cause)}
      notice={notice}
      onNotice={setNotice}
      onReplaced={(next) => mutate(next)}
    />
  );
}

function CauseForm({
  cause,
  initial,
  notice,
  onNotice,
  onReplaced,
}: {
  cause?: AdminCause;
  initial: Form;
  notice: string | null;
  onNotice: (notice: string | null) => void;
  onReplaced?: (cause: AdminCause) => void;
}) {
  const router = useRouter();
  const [form, setForm] = useState<Form>(initial);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [action, setAction] = useState<"publish" | "close" | null>(null);

  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((prev) => ({ ...prev, [key]: value }));

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    onNotice(null);
    setIsSaving(true);
    try {
      const saved = await apiClient<AdminCause>(cause ? `${API}/${encodeURIComponent(cause.id)}` : API, {
        method: cause ? "PUT" : "POST",
        body: JSON.stringify(toBody(form)),
      });
      if (!cause) {
        router.replace(`/dashboard/zakat/causes/${encodeURIComponent(saved.id)}`);
        return;
      }
      onNotice("Changes saved.");
      onReplaced?.(saved);
    } catch (saveError) {
      setError(errorMessage(saveError, "Couldn't save the cause"));
      if (saveError instanceof ApiError) setFieldErrors(fieldErrorMap(saveError.errors));
    } finally {
      setIsSaving(false);
    }
  }

  const canPublish = cause && (cause.status === "DRAFT" || cause.status === "CLOSED");
  const canClose = cause?.status === "ACTIVE";

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
                <Button onClick={() => setAction("publish")} disabled={dirty}>
                  <Send />
                  {cause.status === "CLOSED" ? "Publish again" : "Publish"}
                </Button>
              ) : null}
            </>
          ) : null
        }
      />

      {notice ? <InlineAlert tone="success">{notice}</InlineAlert> : null}
      {dirty && cause && cause.status !== "ACTIVE" ? (
        <InlineAlert tone="info">Save your changes before publishing.</InlineAlert>
      ) : null}

      {cause ? (
        <Panel>
          <DetailList
            columns={4}
            items={[
              { label: "Raised", value: formatEtb(cause.raisedEtb) },
              { label: "Goal", value: formatEtb(cause.goalEtb) },
              { label: "Progress", value: cause.progress != null ? `${Math.round(cause.progress * 100)}%` : "No goal" },
              { label: "Published", value: formatDateTime(cause.publishedAt) },
            ]}
          />
        </Panel>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-6">
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
            <FormField label="Region" htmlFor="region" hint="e.g. Harari" error={fieldErrors.region}>
              <Input id="region" value={form.region} onChange={(e) => set("region", e.target.value)} />
            </FormField>
            <FormField label="Ends on" htmlFor="endsOn" hint="Moves to closed in the app after this date" error={fieldErrors.endsOn}>
              <Input id="endsOn" type="date" value={form.endsOn} onChange={(e) => set("endsOn", e.target.value)} />
            </FormField>
          </div>
        </Panel>

        <Panel title="Funding">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Goal (ETB)" htmlFor="goalEtb" hint="Leave empty for no progress bar" error={fieldErrors.goalEtb}>
              <Input id="goalEtb" type="number" min={0} step="0.01" value={form.goalEtb} onChange={(e) => set("goalEtb", e.target.value)} className="tabular-nums" />
            </FormField>
            <FormField label="Raised offline (ETB)" htmlFor="raisedOfflineEtb" hint="Collected outside the app" error={fieldErrors.raisedOfflineEtb}>
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
            <label className="flex items-start gap-2 text-sm text-[#001539] sm:col-span-2">
              <input
                type="checkbox"
                checked={form.acceptsZakat}
                onChange={(e) => set("acceptsZakat", e.target.checked)}
                className="mt-0.5 size-4 accent-[#007050]"
              />
              <span>
                Accepts zakat
                <span className="block text-xs text-black/50">Only causes accepting zakat appear in the payment project list.</span>
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
          </div>
        </Panel>

        <div className="flex justify-end gap-2">
          {dirty && cause ? (
            <Button type="button" variant="outline" onClick={() => setForm(initial)}>
              Discard changes
            </Button>
          ) : null}
          <Button type="submit" disabled={isSaving || (cause ? !dirty : false)}>
            {isSaving ? "Saving…" : cause ? "Save changes" : "Create draft"}
          </Button>
        </div>
      </form>

      {cause ? (
        <ConfirmDialog
          open={action !== null}
          onOpenChange={(open) => !open && setAction(null)}
          title={action === "close" ? "Close this cause?" : "Publish this cause?"}
          description={
            action === "close"
              ? "It moves to the app's closed list and stops taking new payments. You can publish it again later."
              : "It appears in the app straight away."
          }
          confirmLabel={action === "close" ? "Close cause" : "Publish"}
          destructive={action === "close"}
          onConfirm={async () => {
            const next = await apiClient<AdminCause>(`${API}/${encodeURIComponent(cause.id)}/${action}`, { method: "POST" });
            onNotice(action === "close" ? "Cause closed." : "Cause published.");
            onReplaced?.(next);
          }}
        />
      ) : null}
    </section>
  );
}
