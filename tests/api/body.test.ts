import { describe, expect, it } from "vitest";

import {
  JSON_BODY_LIMIT,
  MULTIPART_BODY_LIMIT,
  isMultipart,
  readBodyCapped,
  readFormDataBody,
  readJsonBody,
} from "@/lib/api/body";
import { ApiError } from "@/lib/api/errors";

const URL = "http://localhost/bff/test";

function post(body: BodyInit | null, headers: Record<string, string> = {}) {
  return new Request(URL, { method: "POST", body, headers });
}

/** The ApiError a promise rejects with, or a failure when it doesn't. */
async function apiError(promise: Promise<unknown>): Promise<ApiError> {
  try {
    await promise;
  } catch (error) {
    expect(error).toBeInstanceOf(ApiError);
    return error as ApiError;
  }
  throw new Error("expected the promise to reject");
}

describe("limits", () => {
  it("allows 1 MB of JSON and 25 MB of multipart", () => {
    expect(JSON_BODY_LIMIT).toBe(1024 * 1024);
    expect(MULTIPART_BODY_LIMIT).toBe(25 * 1024 * 1024);
  });
});

describe("isMultipart", () => {
  it("matches multipart/form-data in any case, with a boundary", () => {
    expect(isMultipart(post("x", { "Content-Type": "multipart/form-data; boundary=abc" }))).toBe(true);
    expect(isMultipart(post("x", { "Content-Type": "Multipart/Form-Data; boundary=abc" }))).toBe(true);
  });

  it("does not match JSON or a missing type", () => {
    expect(isMultipart(post("{}", { "Content-Type": "application/json" }))).toBe(false);
    expect(isMultipart(new Request(URL))).toBe(false);
  });
});

describe("readBodyCapped", () => {
  it("returns the body when it fits", async () => {
    const bytes = await readBodyCapped(post("hello"), 10);
    expect(new TextDecoder().decode(bytes)).toBe("hello");
  });

  it("returns an empty buffer when there is no body", async () => {
    const bytes = await readBodyCapped(new Request(URL), 10);
    expect(bytes.byteLength).toBe(0);
  });

  it("refuses a declared Content-Length over the limit before reading", async () => {
    const error = await apiError(readBodyCapped(post("tiny", { "Content-Length": "11" }), 10));
    expect(error.status).toBe(413);
    expect(error.message).toBe("The request is too large.");
  });

  it("stops reading at the limit when no length is declared", async () => {
    const error = await apiError(readBodyCapped(post("x".repeat(11)), 10));
    expect(error.status).toBe(413);
  });

  it("accepts a body exactly at the limit", async () => {
    const bytes = await readBodyCapped(post("x".repeat(10)), 10);
    expect(bytes.byteLength).toBe(10);
  });

  it("says how much may be sent when an upload is too large", async () => {
    const declared = String(MULTIPART_BODY_LIMIT + 1);
    const error = await apiError(readBodyCapped(post("x", { "Content-Length": declared }), MULTIPART_BODY_LIMIT));
    expect(error.status).toBe(413);
    expect(error.message).toBe("The files are too large. Send at most 25 MB at a time.");
  });

  it("refuses a body shorter than its declared length (a cut-off upload)", async () => {
    const error = await apiError(readBodyCapped(post("12345", { "Content-Length": "8" }), 10));
    expect(error.status).toBe(400);
    expect(error.message).toBe("The upload didn't arrive in full. Try again.");
  });
});

describe("readJsonBody", () => {
  it("parses JSON", async () => {
    await expect(readJsonBody(post('{"a":1,"b":["x"]}'))).resolves.toEqual({ a: 1, b: ["x"] });
  });

  it("parses UTF-8 text", async () => {
    await expect(readJsonBody(post('{"name":"ሰላም"}'))).resolves.toEqual({ name: "ሰላም" });
  });

  it("answers 400 for a body that isn't JSON", async () => {
    const error = await apiError(readJsonBody(post("{not json")));
    expect(error.status).toBe(400);
    expect(error.message).toBe("Invalid request body");
  });

  it("answers 400 for an empty body", async () => {
    expect((await apiError(readJsonBody(new Request(URL, { method: "POST" })))).status).toBe(400);
  });

  it("answers 413 above 1 MB", async () => {
    const error = await apiError(readJsonBody(post("{}", { "Content-Length": String(JSON_BODY_LIMIT + 1) })));
    expect(error.status).toBe(413);
  });
});

describe("readFormDataBody", () => {
  it("reads fields and files", async () => {
    const form = new FormData();
    form.set("note", "hello");
    form.set("file", new Blob(["%PDF-1.7"], { type: "application/pdf" }), "report.pdf");

    const read = await readFormDataBody(new Request(URL, { method: "POST", body: form }));
    expect(read.get("note")).toBe("hello");
    const file = read.get("file");
    expect(file).toBeInstanceOf(File);
    expect((file as File).name).toBe("report.pdf");
    expect(await (file as File).text()).toBe("%PDF-1.7");
  });

  it("answers 400 for a body that isn't multipart", async () => {
    const error = await apiError(readFormDataBody(post("plain text", { "Content-Type": "text/plain" })));
    expect(error.status).toBe(400);
    expect(error.message).toBe("Invalid multipart request");
  });
});
