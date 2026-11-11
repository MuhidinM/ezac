/**
 * A last check on bank and EthQR data before it leaves the BFF (go-live audit
 * gap-r2-4-1). Since 11 November payment-service masks it itself: account
 * numbers keep their last 4 digits, payer phones are masked, `providerResponse`
 * and `qrPayload` are gone, and bank-call bodies have long digit runs masked.
 * What stays here is cheap and only matters if that ever slips: payout
 * bank-call bodies become short summaries, account numbers are masked again,
 * the two raw fields are dropped, EthQR receipts keep only the columns the
 * table shows, and raw third-party bodies are removed from error answers.
 * Reference ids are kept, since they are what staff quote to the bank.
 */

/** One field picked from a bank or EthQR answer, ready to show. */
export type PayloadField = { label: string; value: string };

type Json = Record<string, unknown>;

function isRecord(value: unknown): value is Json {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Runs of 9 or more digits: account and phone numbers. Shorter numbers (amounts, codes) stay. */
const LONG_DIGITS = /\d{9,}/g;

/** "Account 1000123456789 not found" → "Account ••••6789 not found". */
export function maskDigits(text: string): string {
  return text.replace(LONG_DIGITS, (run) => `••••${run.slice(-4)}`);
}

/** An account number shown by its last 4 digits only; null when there is none. */
export function maskAccount(value: unknown): string | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const text = String(value).trim();
  if (!text) return null;
  const digits = text.replace(/\D/g, "");
  return digits.length > 4 ? `••••${digits.slice(-4)}` : text;
}

const MAX_TEXT = 200;

function clip(text: string) {
  return text.length > MAX_TEXT ? `${text.slice(0, MAX_TEXT - 1)}…` : text;
}

/**
 * The keys worth showing from a bank or EthQR answer (compared without case,
 * at any depth). Everything else (bodies, headers, names, account fields,
 * signatures, URLs) is dropped.
 */
const SUMMARY_KEYS = new Set(
  [
    "status",
    "state",
    "statusCode",
    "responseCode",
    "resultCode",
    "errorCode",
    "code",
    "message",
    "statusMessage",
    "responseMessage",
    "errorMessage",
    "description",
    "reason",
    "error",
    "amount",
    "currency",
    "expectedAmount",
    "amountMatches",
    "sandbox",
    "transactedAt",
    "reference",
    "referenceNumber",
    "ftNumber",
    "transactionId",
    "transactionRef",
    "transactionReference",
    "messageId",
    "msgId",
    "correlationId",
  ].map((key) => key.toLowerCase()),
);

/** References are quoted to the bank, so they are kept whole; other values have long digit runs masked. */
const REFERENCE_KEYS = new Set(
  ["reference", "referenceNumber", "ftNumber", "transactionId", "transactionRef", "transactionReference", "messageId", "msgId", "correlationId"].map(
    (key) => key.toLowerCase(),
  ),
);

const MAX_FIELDS = 12;
const MAX_DEPTH = 4;

/** "referenceNumber" → "reference number". */
function words(key: string) {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .toLowerCase()
    .trim();
}

/** Labels that read better than the key's own words. */
const LABELS: Record<string, string> = { ftnumber: "FT number", msgid: "Message id", transactedat: "Time at the bank" };

function fieldLabel(path: string[]) {
  const last = path[path.length - 1];
  const text = LABELS[last.toLowerCase()] ?? path.map(words).join(" ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Each field is named by its own key; the parent keys are added only where two fields would share a name. */
function shortLabels(fields: { path: string[]; value: string }[]): PayloadField[] {
  const short = fields.map((field) => fieldLabel(field.path.slice(-1)));
  return fields.map((field, index) => ({
    label: short.filter((label) => label === short[index]).length > 1 ? fieldLabel(field.path) : short[index],
    value: field.value,
  }));
}

function parseJson(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const text = value.trim();
  if (!text.startsWith("{") && !text.startsWith("[")) return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
}

/**
 * The fields staff need from a raw bank or EthQR answer (an object or a JSON
 * string): status, codes, messages, amounts and references. Anything that
 * isn't JSON (XML, plain text) gives nothing, since it can't be filtered.
 */
export function summarizePayload(value: unknown): PayloadField[] {
  const root = parseJson(value);
  const fields: { path: string[]; value: string }[] = [];

  function visit(node: unknown, path: string[], depth: number) {
    if (fields.length >= MAX_FIELDS || depth > MAX_DEPTH) return;
    if (Array.isArray(node)) {
      for (const item of node.slice(0, 5)) visit(item, path, depth + 1);
      return;
    }
    if (!isRecord(node)) return;
    for (const [key, child] of Object.entries(node)) {
      if (fields.length >= MAX_FIELDS) return;
      const lower = key.toLowerCase();
      if (isRecord(child) || Array.isArray(child)) {
        visit(child, [...path, key], depth + 1);
        continue;
      }
      if (!SUMMARY_KEYS.has(lower) || child === null || child === undefined || child === "") continue;
      let text: string;
      if (typeof child === "boolean") text = child ? "Yes" : "No";
      else if (typeof child === "number" || typeof child === "string") text = String(child);
      else continue;
      fields.push({ path: [...path, key], value: clip(REFERENCE_KEYS.has(lower) ? text : maskDigits(text)) });
    }
  }

  visit(root, [], 0);
  return shortLabels(fields);
}

function pick(record: Json, keys: readonly string[]) {
  const out: Json = {};
  for (const key of keys) {
    if (record[key] !== undefined) out[key] = record[key];
  }
  return out;
}

/** The parts of one payout bank call staff see: no URL, and summaries in place of the request and response bodies. */
const BANK_CALL_KEYS = ["callId", "operation", "outcome", "httpStatus", "durationMs", "messageId", "correlationId", "at"] as const;

export function redactBankCall(call: unknown): Json | null {
  if (!isRecord(call)) return null;
  return {
    ...pick(call, BANK_CALL_KEYS),
    ...(typeof call.error === "string" && call.error ? { error: clip(maskDigits(call.error)) } : {}),
    requestFields: summarizePayload(call.request),
    responseFields: summarizePayload(call.response),
  };
}

/** One Zakat payment without raw bank or QR data, its account numbers by their last 4 digits. */
export function redactPayment(payment: unknown): unknown {
  if (!isRecord(payment)) return payment;
  const out: Json = { ...payment };
  delete out.providerResponse;
  delete out.qrPayload;
  for (const key of ["debitAccount", "creditAccount"] as const) {
    if (out[key] !== undefined) out[key] = maskAccount(out[key]);
  }
  return out;
}

/** The EthQR receipt fields payment-service returns (11 November) and the reconciliation table uses. */
const RECEIPT_KEYS = [
  "referenceNumber",
  "orderId",
  "amount",
  "currency",
  "transactedAt",
  "sourceBankBic",
  "endToEndId",
  "status",
  "payerName",
  "matchedPaymentId",
] as const;

export function redactEthqrReceipt(receipt: unknown): Json | null {
  return isRecord(receipt) ? pick(receipt, RECEIPT_KEYS) : null;
}

/** Raw third-party bodies that some error answers carry in `data`. */
const RAW_ERROR_KEYS = ["ethqrResponse", "providerResponse", "rawResponse", "response", "request"] as const;

function mapData(body: Json, map: (data: unknown) => unknown): Json {
  return "data" in body ? { ...body, data: map(body.data) } : body;
}

/** zakat-payments paths that answer with counts and totals only. */
const COUNT_PATHS = new Set(["summary", "needs-action"]);

/** True for the payments-admin paths whose successful answers carry raw bank or EthQR data. */
export function redactsPath(path: readonly string[]): boolean {
  const [first, second, third] = path;
  if (first === "disbursements") return third === "bank-calls" && path.length === 3;
  if (first === "zakat-payments") return !COUNT_PATHS.has(second);
  return first === "ethqr" && second === "transactions";
}

/**
 * The BFF answer for a payments-admin path, with raw bank and EthQR data
 * removed. `path` is the path after /bff/payments-admin/. Paths that carry
 * no raw data come back unchanged.
 */
export function redactPaymentsAdmin(path: readonly string[], body: unknown): unknown {
  if (!isRecord(body)) return body;

  if (body.success === false) {
    return mapData(body, (data) => {
      if (!isRecord(data)) return data;
      const out = { ...data };
      for (const key of RAW_ERROR_KEYS) delete out[key];
      return out;
    });
  }

  const [first, second, third] = path;

  if (first === "disbursements" && third === "bank-calls" && path.length === 3) {
    return mapData(body, (data) => (Array.isArray(data) ? data.map(redactBankCall).filter(Boolean) : data));
  }

  if (first === "zakat-payments") {
    // The list, one payment, and the payment returned by check and resolve.
    if (COUNT_PATHS.has(second)) return body;
    return mapData(body, (data) => {
      if (isRecord(data) && Array.isArray(data.items)) return { ...data, items: data.items.map(redactPayment) };
      return redactPayment(data);
    });
  }

  if (first === "ethqr" && second === "transactions") {
    return mapData(body, (data) => {
      if (!isRecord(data) || !Array.isArray(data.content)) return data;
      return { ...data, content: data.content.map(redactEthqrReceipt).filter(Boolean) };
    });
  }

  return body;
}
