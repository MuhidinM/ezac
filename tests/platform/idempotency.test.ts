import { describe, expect, it } from "vitest";

import { ApiError } from "@/lib/api/errors";
import { keepIdempotencyKey, newIdempotencyKey } from "@/lib/api/idempotency";

describe("idempotency keys", () => {
  it("makes keys the backend accepts", () => {
    expect(newIdempotencyKey()).toMatch(/^[A-Za-z0-9._:-]{1,128}$/);
  });

  it("keeps the key only when the same request may be retried", () => {
    expect(keepIdempotencyKey(new ApiError("No connection", 0))).toBe(true);
    expect(keepIdempotencyKey(new ApiError("Timed out", 504))).toBe(true);
    expect(keepIdempotencyKey(new ApiError("Server error", 500))).toBe(true);
    expect(keepIdempotencyKey(new ApiError("Still running", 409, [], null, "IDEMPOTENCY_IN_PROGRESS"))).toBe(true);
    expect(keepIdempotencyKey(new ApiError("Invalid title", 400))).toBe(false);
    expect(keepIdempotencyKey(new ApiError("Stale", 409, [], null, "VERSION_CONFLICT"))).toBe(false);
  });
});
