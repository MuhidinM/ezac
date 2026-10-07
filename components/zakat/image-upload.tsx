"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";
import { IMAGE_TYPES, MAX_IMAGE_BYTES, mediaSrc, type UploadedMedia } from "@/lib/zakat/content";
import { cn } from "@/lib/utils";

export type MediaRef = { id: string; url: string | null };

async function upload(file: File): Promise<MediaRef> {
  if (!IMAGE_TYPES.includes(file.type)) throw new Error("Images must be JPEG, PNG or WebP.");
  if (file.size > MAX_IMAGE_BYTES) throw new Error("Images must be 5 MB or smaller.");
  const body = new FormData();
  body.append("file", file);
  const media = await apiClient<UploadedMedia>("/api/zakat-admin/media", { method: "POST", body });
  return { id: String(media.id), url: media.url };
}

function Thumb({ media, onRemove, disabled }: { media: MediaRef; onRemove: () => void; disabled?: boolean }) {
  return (
    <div className="group relative size-24 overflow-hidden rounded-lg border border-black/10 bg-black/[0.03]">
      {media.url ? (
        // eslint-disable-next-line @next/next/no-img-element -- media is served by the zakat service, not optimisable here
        <img src={mediaSrc(media.url) ?? undefined} alt="" className="size-full object-cover" />
      ) : (
        <span className="flex size-full items-center justify-center text-xs text-black/45">#{media.id}</span>
      )}
      {!disabled ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove image"
          className="absolute top-1 right-1 rounded-full bg-black/60 p-0.5 text-white opacity-0 transition group-hover:opacity-100 focus-visible:opacity-100"
        >
          <X className="size-3.5" />
        </button>
      ) : null}
    </div>
  );
}

/**
 * Uploads images to POST /admin/media and keeps their ids. `max` 1 is a
 * single cover image; more is a gallery.
 */
export function ImageUpload({
  value,
  onChange,
  max = 1,
  disabled,
  id,
}: {
  value: MediaRef[];
  onChange: (value: MediaRef[]) => void;
  max?: number;
  disabled?: boolean;
  id?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const room = max - value.length;

  async function onFiles(files: File[]) {
    setError(null);
    if (files.length === 0) return;
    const picked = files.slice(0, max === 1 ? 1 : room);
    setIsUploading(true);
    try {
      const uploaded: MediaRef[] = [];
      for (const file of picked) uploaded.push(await upload(file));
      onChange(max === 1 ? uploaded : [...value, ...uploaded]);
      if (files.length > picked.length) setError(`Only ${max} images allowed; extra files were skipped.`);
    } catch (uploadError) {
      setError(errorMessage(uploadError, "Couldn't upload the image"));
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {value.map((media, index) => (
          <Thumb key={`${media.id}-${index}`} media={media} disabled={disabled} onRemove={() => onChange(value.filter((_, i) => i !== index))} />
        ))}
        {!disabled && (max === 1 || room > 0) ? (
          <Button
            type="button"
            variant="outline"
            className={cn("size-24 flex-col gap-1 border-dashed text-xs font-normal text-black/55")}
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? <Loader2 className="animate-spin" /> : <ImagePlus />}
            {isUploading ? "Uploading" : max === 1 && value.length ? "Replace" : "Add image"}
          </Button>
        ) : null}
      </div>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={IMAGE_TYPES.join(",")}
        multiple={max > 1}
        className="sr-only"
        onChange={(event) => onFiles(Array.from(event.target.files ?? []))}
      />
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
