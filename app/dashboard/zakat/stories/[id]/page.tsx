"use client";

import { useParams, useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { Archive, Send } from "lucide-react";

import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { FormField } from "@/components/dashboard/form-field";
import { InlineAlert } from "@/components/dashboard/inline-alert";
import { PageHeader } from "@/components/dashboard/page-header";
import { Panel } from "@/components/dashboard/panel";
import { RequireRole } from "@/components/dashboard/require-role";
import { ImageUpload, type MediaRef } from "@/components/zakat/image-upload";
import { StoryStatusBadge } from "@/components/zakat/story-status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api/client";
import { ApiError, errorMessage, fieldErrorMap } from "@/lib/api/errors";
import { useResource } from "@/lib/api/use-resource";
import { type AdminStory, CONTENT_CATEGORIES } from "@/lib/zakat/content";

const API = "/api/zakat-admin/impact/stories";

type Form = {
  title: string;
  summary: string;
  body: string;
  category: string;
  regionCode: string;
  image: MediaRef[];
  consentConfirmed: boolean;
  consentNote: string;
};

const EMPTY: Form = {
  title: "",
  summary: "",
  body: "",
  category: "",
  regionCode: "",
  image: [],
  consentConfirmed: false,
  consentNote: "",
};

function toForm(story: AdminStory): Form {
  return {
    title: story.title,
    summary: story.summary,
    body: story.body,
    category: story.category,
    regionCode: story.regionCode ?? "",
    image: story.imageMediaId != null ? [{ id: String(story.imageMediaId), url: story.imageUrl }] : [],
    consentConfirmed: story.consentConfirmed,
    consentNote: story.consentNote ?? "",
  };
}

/** PUT replaces the story, so every field is sent. */
function toBody(form: Form) {
  const id = form.image[0]?.id;
  return {
    title: form.title.trim(),
    summary: form.summary.trim(),
    body: form.body.trim(),
    category: form.category,
    regionCode: form.regionCode || null,
    imageMediaId: id ? (/^\d+$/.test(id) ? Number(id) : id) : null,
    consentConfirmed: form.consentConfirmed,
    consentNote: form.consentNote.trim() || null,
  };
}

export default function StoryEditorPage() {
  return (
    <RequireRole audience={["admin"]}>
      <StoryEditor />
    </RequireRole>
  );
}

function StoryEditor() {
  const params = useParams<{ id: string }>();
  const isNew = params.id === "new";
  // No single-story admin endpoint; the list is small and unpaginated.
  const { data, error, reload } = useResource<AdminStory[]>(isNew ? null : API);
  const [notice, setNotice] = useState<string | null>(null);

  if (isNew) return <StoryForm initial={EMPTY} notice={null} onNotice={setNotice} />;
  if (error) return <InlineAlert>{error.message}</InlineAlert>;
  if (!data) return <p className="text-sm text-black/45">Loading…</p>;
  const story = data.find((item) => item.id === params.id);
  if (!story) return <InlineAlert>Story not found.</InlineAlert>;
  return (
    <StoryForm
      key={`${story.id}-${story.updatedAt}-${story.status}`}
      story={story}
      initial={toForm(story)}
      notice={notice}
      onNotice={setNotice}
      onChanged={() => reload()}
    />
  );
}

function StoryForm({
  story,
  initial,
  notice,
  onNotice,
  onChanged,
}: {
  story?: AdminStory;
  initial: Form;
  notice: string | null;
  onNotice: (notice: string | null) => void;
  onChanged?: () => void;
}) {
  const router = useRouter();
  const regions = useResource<{ code: string; name: string }[]>("/api/zakat-admin/impact/regions");
  const [form, setForm] = useState<Form>(initial);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [action, setAction] = useState<"publish" | "archive" | null>(null);

  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((prev) => ({ ...prev, [key]: value }));

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    onNotice(null);
    setIsSaving(true);
    try {
      const saved = await apiClient<AdminStory>(story ? `${API}/${encodeURIComponent(story.id)}` : API, {
        method: story ? "PUT" : "POST",
        body: JSON.stringify(toBody(form)),
      });
      if (!story) {
        router.replace(`/dashboard/zakat/stories/${encodeURIComponent(saved.id)}`);
        return;
      }
      onNotice("Changes saved.");
      onChanged?.();
    } catch (saveError) {
      setError(errorMessage(saveError, "Couldn't save the story"));
      if (saveError instanceof ApiError) setFieldErrors(fieldErrorMap(saveError.errors));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="space-y-6">
      <PageHeader
        back={{ href: "/dashboard/zakat/stories", label: "Impact stories" }}
        title={story ? story.title : "New story"}
        description={story ? undefined : "Saved as a draft. Publish it once the beneficiary has agreed to it being shared."}
        meta={story ? <StoryStatusBadge status={story.status} /> : undefined}
        actions={
          story ? (
            story.status === "PUBLISHED" ? (
              <Button variant="outline" onClick={() => setAction("archive")}>
                <Archive />
                Take down
              </Button>
            ) : (
              <Button onClick={() => setAction("publish")} disabled={dirty || !story.consentConfirmed}>
                <Send />
                {story.status === "ARCHIVED" ? "Publish again" : "Publish"}
              </Button>
            )
          ) : null
        }
      />

      {notice ? <InlineAlert tone="success">{notice}</InlineAlert> : null}
      {story && story.status !== "PUBLISHED" && !story.consentConfirmed ? (
        <InlineAlert tone="warning">Publishing needs the beneficiary&apos;s consent. Confirm it below and save first.</InlineAlert>
      ) : dirty && story && story.status !== "PUBLISHED" ? (
        <InlineAlert tone="info">Save your changes before publishing.</InlineAlert>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-6">
        {error ? <InlineAlert>{error}</InlineAlert> : null}

        <Panel title="Story">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Title" htmlFor="title" required error={fieldErrors.title} className="sm:col-span-2">
              <Input id="title" maxLength={200} value={form.title} onChange={(e) => set("title", e.target.value)} required />
            </FormField>
            <FormField
              label="Summary"
              htmlFor="summary"
              required
              hint={`Shown in the list (${form.summary.length}/500)`}
              error={fieldErrors.summary}
              className="sm:col-span-2"
            >
              <Textarea id="summary" rows={2} maxLength={500} value={form.summary} onChange={(e) => set("summary", e.target.value)} required />
            </FormField>
            <FormField
              label="Full story"
              htmlFor="body"
              required
              hint="Plain text; line breaks are kept. Never include a beneficiary's id or full name without their consent."
              error={fieldErrors.body}
              className="sm:col-span-2"
            >
              <Textarea id="body" rows={10} maxLength={20000} value={form.body} onChange={(e) => set("body", e.target.value)} required />
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
            <FormField label="Region" htmlFor="regionCode" error={fieldErrors.regionCode}>
              <NativeSelect id="regionCode" value={form.regionCode} onChange={(e) => set("regionCode", e.target.value)}>
                <option value="">All of Ethiopia</option>
                {(regions.data ?? []).map((region) => (
                  <option key={region.code} value={region.code}>
                    {region.name}
                  </option>
                ))}
              </NativeSelect>
            </FormField>
            <FormField label="Image" htmlFor="image" hint="JPEG, PNG or WebP, up to 5 MB" error={fieldErrors.imageMediaId} className="sm:col-span-2">
              <ImageUpload id="image" value={form.image} onChange={(value) => set("image", value)} />
            </FormField>
          </div>
        </Panel>

        <Panel title="Consent">
          <div className="space-y-4">
            <label className="flex items-start gap-2 text-sm text-[#001539]">
              <input
                type="checkbox"
                checked={form.consentConfirmed}
                onChange={(e) => set("consentConfirmed", e.target.checked)}
                className="mt-0.5 size-4 accent-[#007050]"
              />
              <span>
                The beneficiary agreed to this story being shared
                <span className="block text-xs text-black/50">Required to publish. A published story can&apos;t be saved without it.</span>
              </span>
            </label>
            <FormField label="How consent was given" htmlFor="consentNote" hint="e.g. signed form kept at the branch" error={fieldErrors.consentNote}>
              <Textarea id="consentNote" rows={2} maxLength={500} value={form.consentNote} onChange={(e) => set("consentNote", e.target.value)} />
            </FormField>
          </div>
        </Panel>

        <div className="flex justify-end gap-2">
          {dirty && story ? (
            <Button type="button" variant="outline" onClick={() => setForm(initial)}>
              Discard changes
            </Button>
          ) : null}
          <Button type="submit" disabled={isSaving || (story ? !dirty : false)}>
            {isSaving ? "Saving…" : story ? "Save changes" : "Create draft"}
          </Button>
        </div>
      </form>

      {story ? (
        <ConfirmDialog
          open={action !== null}
          onOpenChange={(open) => !open && setAction(null)}
          title={action === "archive" ? "Take this story down?" : "Publish this story?"}
          description={
            action === "archive"
              ? "It's removed from the app and public site. You can publish it again later."
              : "It appears in the app and on the public site straight away."
          }
          confirmLabel={action === "archive" ? "Take down" : "Publish"}
          destructive={action === "archive"}
          onConfirm={async () => {
            await apiClient(`${API}/${encodeURIComponent(story.id)}/${action}`, { method: "POST" });
            onNotice(action === "archive" ? "Story taken down." : "Story published.");
            onChanged?.();
          }}
        />
      ) : null}
    </section>
  );
}
