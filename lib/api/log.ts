/**
 * Server log lines: one JSON object per line on stdout/stderr, which pm2
 * keeps. Every line has `level`, `event`, `time` and `release` (GIT_SHA), so
 * `grep '"event":"gateway_error"'` or `jq 'select(.requestId=="…")'` finds
 * what a user reported. Request ids are the ones sent to the gateway as
 * X-Request-Id and shown to users as "Reference: …".
 *
 * Never log request or response bodies, cookies, tokens or query strings.
 * No Node-only APIs here: proxy.ts and instrumentation.ts use it too.
 */

export type LogLevel = "info" | "warn" | "error" | "fatal";

export type LogValue = string | number | boolean | null | undefined | readonly string[];

export type LogFields = Record<string, LogValue>;

/** Long free text (upstream messages, stacks) is cut to keep one line readable. */
export const LOG_MESSAGE_LIMIT = 300;
const STACK_LIMIT = 2_000;

/** The line as it is written, for tests. Fields that are undefined are left out. */
export function formatLogLine(level: LogLevel, event: string, fields: LogFields = {}, now = new Date()): string {
  return JSON.stringify({
    level,
    event,
    time: now.toISOString(),
    release: process.env.GIT_SHA || undefined,
    ...fields,
  });
}

export function logEvent(level: LogLevel, event: string, fields: LogFields = {}): void {
  const line = formatLogLine(level, event, fields);
  if (level === "error" || level === "fatal") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.info(line);
}

/** "a\n   b" → "a b", cut to `limit` characters. */
export function oneLine(value: string, limit = LOG_MESSAGE_LIMIT): string {
  const flat = value.replace(/\s+/g, " ").trim();
  return flat.length > limit ? `${flat.slice(0, limit)}…` : flat;
}

/**
 * The fields for an unexpected error: its name, message and (for our own
 * bugs) the stack, so the line still says where it was thrown.
 */
export function errorFields(error: unknown, options: { stack?: boolean } = {}): LogFields {
  if (error instanceof Error) {
    return {
      error: error.name,
      message: oneLine(error.message || "(no message)"),
      stack: options.stack && error.stack ? error.stack.slice(0, STACK_LIMIT) : undefined,
    };
  }
  return { error: typeof error, message: oneLine(String(error)) };
}
