export type FieldError = {
  field: string;
  message: string;
};

export class ApiError extends Error {
  readonly status: number;
  /** Per-field validation errors from 400/422 responses (`errors[]`). */
  readonly errors: FieldError[];

  constructor(message: string, status: number, errors: FieldError[] = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

/** Keep only well-formed `{ field, message }` entries from an error body. */
export function parseFieldErrors(value: unknown): FieldError[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is FieldError =>
      !!item &&
      typeof item === "object" &&
      typeof (item as FieldError).field === "string" &&
      typeof (item as FieldError).message === "string",
  );
}

/** Group field errors by path so forms can look them up per input. */
export function fieldErrorMap(errors: FieldError[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const error of errors) {
    if (!map[error.field]) map[error.field] = error.message;
  }
  return map;
}

export function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}
