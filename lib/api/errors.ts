export type FieldError = {
  field: string;
  message: string;
};

export class ApiError extends Error {
  /** HTTP status; 0 when the request never got an answer (offline). */
  readonly status: number;
  /** Per-field validation errors from 400/422 responses (`errors[]`). */
  readonly errors: FieldError[];
  /** `data` sent with an error, e.g. the existing id on a 409 conflict. */
  readonly data: unknown;
  /** Machine-readable error code when the backend sends one (e.g. NOT_POOLED). */
  readonly code: string | null;
  /** Id of the failed request, for matching a report to the server log. */
  readonly requestId: string | null;

  constructor(
    message: string,
    status: number,
    errors: FieldError[] = [],
    data: unknown = null,
    code: string | null = null,
    requestId: string | null = null,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
    this.data = data;
    this.code = code;
    this.requestId = requestId;
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
  if (error instanceof ApiError) return error.message;
  // Plain errors the app throws itself ("Images must be 5 MB or smaller.") are
  // written for people; runtime errors (TypeError, SyntaxError…) are not.
  if (error instanceof Error && error.name === "Error" && error.message) return error.message;
  return fallback;
}

/** The session is over (401): the user must sign in again before retrying. */
export function isSessionEnded(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401;
}

/**
 * Whether text shown to the user is the session-ended message ("Your session
 * has ended. Sign in again."), for alerts that only got the message string.
 */
export function asksToSignInAgain(text: unknown): boolean {
  return typeof text === "string" && /\bsign in again\b/i.test(text);
}

/**
 * The id to quote to support for a failure on our side (5xx), when the
 * server sent one. Validation errors and the like don't need one.
 */
export function errorReference(error: unknown): string | null {
  if (!(error instanceof ApiError) || !error.requestId) return null;
  return error.status >= 500 ? error.requestId : null;
}
