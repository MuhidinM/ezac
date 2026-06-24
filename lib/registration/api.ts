import type { ApiEnvelope } from "@/lib/api/types";
import { ApiError } from "@/lib/api/errors";

async function parseEnvelope<T>(response: Response): Promise<T> {
  let envelope: ApiEnvelope<T> | null = null;

  try {
    envelope = (await response.json()) as ApiEnvelope<T>;
  } catch {
    throw new ApiError("Invalid response from server", response.status || 502);
  }

  if (!response.ok || !envelope.success) {
    throw new ApiError(
      envelope.message ?? "Request failed",
      response.status || 400,
    );
  }

  return envelope.data;
}

export async function registerApiJson<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });

  return parseEnvelope<T>(response);
}

export async function registerApiFormData<T>(
  path: string,
  formData: FormData,
  headers?: HeadersInit,
): Promise<T> {
  const response = await fetch(path, {
    method: "POST",
    body: formData,
    headers,
    cache: "no-store",
  });

  return parseEnvelope<T>(response);
}
