import {
  KYC_FILE_TYPES,
  MAX_KYC_FILE_SIZE,
  MAX_PROFILE_IMAGE_SIZE,
  PROFILE_IMAGE_TYPES,
} from "@/lib/registration/constants";

export type UploadKind = "profilePicture" | "kyc";

const RULES: Record<UploadKind, { types: string[]; maxBytes: number; message: string }> = {
  profilePicture: {
    types: PROFILE_IMAGE_TYPES,
    maxBytes: MAX_PROFILE_IMAGE_SIZE,
    message: "JPEG, PNG or WebP, up to 2 MB",
  },
  kyc: {
    types: KYC_FILE_TYPES,
    maxBytes: MAX_KYC_FILE_SIZE,
    message: "PDF, JPEG, PNG or WebP, up to 5 MB",
  },
};

/** The hint to show next to an upload of this kind. */
export function uploadHint(kind: UploadKind): string {
  return RULES[kind].message;
}

/** The `accept` attribute for an upload of this kind. */
export function uploadAccept(kind: UploadKind): string {
  return RULES[kind].types.join(",");
}

/**
 * Why the server would refuse this file, in plain words, or null when it is
 * fine. Checked before uploading so the officer doesn't wait for a refusal.
 */
export function uploadProblem(file: Pick<File, "name" | "size" | "type">, kind: UploadKind): string | null {
  const rule = RULES[kind];
  if (!rule.types.includes(file.type)) return `"${file.name}" isn't a supported file. Use ${rule.message}.`;
  if (file.size > rule.maxBytes) {
    return `"${file.name}" is larger than ${rule.maxBytes / (1024 * 1024)} MB. Use a smaller file or a scan at lower quality.`;
  }
  return null;
}
