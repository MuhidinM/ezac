/**
 * Browser error reports (POST /bff/client-error): their shape, and the
 * scrubbing that keeps personal data out of the server log. The browser
 * scrubs before it sends; the server scrubs again, because anyone can post
 * anything. Used on both sides, so nothing server-only here.
 */

export const CLIENT_ERROR_PATH = "/bff/client-error";

/** A report is a few hundred bytes; the server refuses anything bigger. */
export const CLIENT_ERROR_MAX_BYTES = 8 * 1024;

export const CLIENT_ERROR_SOURCES = ["error", "unhandledrejection", "boundary"] as const;

/**
 * - "error": an uncaught exception (window "error" event)
 * - "unhandledrejection": a promise nobody caught
 * - "boundary": an error page (error.tsx) caught a render error
 */
export type ClientErrorSource = (typeof CLIENT_ERROR_SOURCES)[number];

export type ClientErrorReport = {
  source: ClientErrorSource;
  /** Which error page caught it: "dashboard", "site", "register", "global". */
  scope?: string;
  /** The error's class: "TypeError", "ChunkLoadError", … */
  name?: string;
  message: string;
  /** The first frames of the stack. */
  stack?: string;
  /** The page's path, without query string or fragment. */
  path?: string;
};

const MESSAGE_LIMIT = 300;
const STACK_LIMIT = 1_500;
const STACK_FRAMES = 10;
const PATH_LIMIT = 200;

/** Ethiopic (Amharic, Tigrinya…) and Arabic script: in an error message that is user data, often a name. */
const NON_LATIN_TEXT = /[؀-ۿݐ-ݿሀ-᎟ⶀ-⷟꬀-꬯]+(?:[\s፡-፨]+[؀-ۿݐ-ݿሀ-᎟ⶀ-⷟꬀-꬯]+)*/g;

/**
 * Masks what could identify a person in free text: query strings and
 * fragments of URLs (search terms, tokens), email addresses, tokens, numbers
 * of 7 or more digits (phone, account and ID numbers, IP addresses) and
 * Ethiopic or Arabic text. Then flattens it to one line and cuts it to `limit`.
 */
export function scrubText(value: string, limit = MESSAGE_LIMIT): string {
  const scrubbed = value
    // "https://site/x.js?v=1:2:3" → "https://site/x.js:2:3"; "/causes?q=abebe" → "/causes".
    // (No lookbehind: this also runs in the browser, and older Safari can't parse it.)
    .replace(
      /(^|[\s('"<>=@])((?:[a-z][a-z0-9+.-]*:)?\/\/[^\s?#()'"<>]+|\/[^\s?#()'"<>]*)[?#][^\s()'"<>]*?(?=:\d+(?::\d+)?\)?(?:\s|$)|[\s()'"<>]|$)/gi,
      "$1$2",
    )
    .replace(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g, "[email]")
    .replace(/\beyJ[\w-]+\.[\w-]+\.[\w-]*/g, "[token]")
    .replace(/\b(Bearer|Basic)\s+[\w.~+/=-]+/gi, "$1 [token]")
    .replace(/\+?\d[\d\s().-]{5,}\d/g, (match) => (match.replace(/\D/g, "").length >= 7 ? "[number]" : match))
    .replace(NON_LATIN_TEXT, "[text]");
  const flat = scrubbed.replace(/\s+/g, " ").trim();
  return flat.length > limit ? `${flat.slice(0, limit)}…` : flat;
}

/**
 * An error message, scrubbed. Double-quoted text goes too: JSON.parse errors
 * quote the start of the input they choked on, which may be a person's data.
 */
export function scrubMessage(value: string): string {
  return scrubText(value.replace(/"[^"\n]*"/g, '"…"'));
}

/** The first frames of a stack, each line scrubbed. */
export function scrubStack(value: string): string {
  const lines = value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, STACK_FRAMES)
    .map((line) => scrubText(line, 300));
  const joined = lines.join("\n");
  return joined.length > STACK_LIMIT ? `${joined.slice(0, STACK_LIMIT)}…` : joined;
}

/** "/dashboard/beneficiary/1234567?tab=x#y" → "/dashboard/beneficiary/[number]". */
export function scrubPath(value: string): string | undefined {
  if (!value.startsWith("/")) return undefined;
  const end = value.search(/[?#]/);
  const path = scrubText(end === -1 ? value : value.slice(0, end), PATH_LIMIT);
  return path || undefined;
}

/** Short identifiers only (error class, boundary name); anything else is dropped. */
function label(value: unknown): string | undefined {
  return typeof value === "string" && /^[\w$.-]{1,60}$/.test(value) ? value : undefined;
}

function isSource(value: unknown): value is ClientErrorSource {
  return typeof value === "string" && (CLIENT_ERROR_SOURCES as readonly string[]).includes(value);
}

/**
 * A report from an untrusted body, scrubbed, or null when it isn't one. Only
 * the known fields survive; anything else the sender added is dropped.
 */
export function sanitizeClientError(body: unknown): ClientErrorReport | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const record = body as Record<string, unknown>;
  if (!isSource(record.source)) return null;

  const message = typeof record.message === "string" ? scrubMessage(record.message.slice(0, 2_000)) : "";
  const stack = typeof record.stack === "string" ? scrubStack(record.stack.slice(0, 10_000)) : "";
  if (!message && !stack) return null;

  return {
    source: record.source,
    scope: label(record.scope),
    name: label(record.name),
    message: message || "(no message)",
    stack: stack || undefined,
    path: typeof record.path === "string" ? scrubPath(record.path.slice(0, 2_000)) : undefined,
  };
}

const BROWSERS: ReadonlyArray<readonly [RegExp, string]> = [
  [/Edg(?:A|iOS)?\/(\d+)/, "Edge"],
  [/OPR\/(\d+)/, "Opera"],
  [/SamsungBrowser\/(\d+)/, "Samsung Internet"],
  [/(?:Firefox|FxiOS)\/(\d+)/, "Firefox"],
  [/CriOS\/(\d+)/, "Chrome"],
  [/Chrome\/(\d+)/, "Chrome"],
  [/Version\/(\d+)[\d.]*.*Safari\//, "Safari"],
];

const SYSTEMS: ReadonlyArray<readonly [RegExp, string]> = [
  [/Android/, "Android"],
  [/iPhone|iPad|iPod/, "iOS"],
  [/CrOS/, "ChromeOS"],
  [/Windows/, "Windows"],
  [/Mac OS X|Macintosh/, "macOS"],
  [/Linux/, "Linux"],
];

/**
 * "Chrome 131 on Windows" from a User-Agent header: enough to spot a
 * browser-specific bug, too little to single anyone out.
 */
export function browserFamily(userAgent: string | null): string | undefined {
  if (!userAgent) return undefined;
  let browser: string | undefined;
  for (const [pattern, name] of BROWSERS) {
    const match = pattern.exec(userAgent);
    if (match) {
      browser = `${name} ${match[1]}`;
      break;
    }
  }
  const system = SYSTEMS.find(([pattern]) => pattern.test(userAgent))?.[1];
  if (browser && system) return `${browser} on ${system}`;
  return browser ?? system ?? "other";
}
