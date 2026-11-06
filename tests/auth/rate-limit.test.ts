import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  UNKNOWN_IP,
  loginLimiter,
  passwordChangeLimiter,
  tooManyAttemptsMessage,
  type AttemptLimiter,
} from "@/lib/auth/rate-limit";

const MINUTE = 60_000;
const START = new Date("2026-11-06T09:00:00Z");

// The limiters are module singletons, so each test uses its own IP and
// account names to start from empty counts.
let run = 0;
let ip = "";
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(START);
  run += 1;
  ip = `10.0.0.${run}`;
});

afterEach(() => {
  vi.useRealTimers();
});

function fail(limiter: AttemptLimiter, fromIp: string, account: string, times = 1) {
  for (let i = 0; i < times; i++) {
    const attempt = limiter.begin(fromIp, account);
    expect(attempt.retryAfter).toBe(0);
    attempt.finish("failure");
  }
}

describe("loginLimiter: per account and IP", () => {
  it("allows 5 failures, then blocks for the rest of the 15-minute window", () => {
    fail(loginLimiter, ip, "amina", 5);
    expect(loginLimiter.begin(ip, "amina").retryAfter).toBe(15 * 60);

    vi.setSystemTime(START.getTime() + 10 * MINUTE);
    expect(loginLimiter.begin(ip, "amina").retryAfter).toBe(5 * 60);
  });

  it("opens again when the window ends", () => {
    fail(loginLimiter, ip, "amina", 5);
    vi.setSystemTime(START.getTime() + 15 * MINUTE);
    const attempt = loginLimiter.begin(ip, "amina");
    expect(attempt.retryAfter).toBe(0);
    attempt.finish("neutral");
  });

  it("times the window from the first failure", () => {
    fail(loginLimiter, ip, "amina", 1);
    vi.setSystemTime(START.getTime() + 14 * MINUTE);
    fail(loginLimiter, ip, "amina", 4);
    expect(loginLimiter.begin(ip, "amina").retryAfter).toBe(60);
  });

  it("counts the same account from another IP separately", () => {
    fail(loginLimiter, ip, "amina", 5);
    const other = loginLimiter.begin(`${ip}.other`, "amina");
    expect(other.retryAfter).toBe(0);
    other.finish("neutral");
  });

  it("clears the account's count on success", () => {
    fail(loginLimiter, ip, "amina", 4);
    loginLimiter.begin(ip, "amina").finish("success");
    fail(loginLimiter, ip, "amina", 4);
    expect(loginLimiter.begin(ip, "amina").retryAfter).toBe(0);
  });

  it("does not count neutral outcomes (timeouts, outages)", () => {
    for (let i = 0; i < 10; i++) loginLimiter.begin(ip, "amina").finish("neutral");
    expect(loginLimiter.begin(ip, "amina").retryAfter).toBe(0);
  });

  it("counts a finished attempt once, however often finish is called", () => {
    fail(loginLimiter, ip, "amina", 3);
    const attempt = loginLimiter.begin(ip, "amina");
    attempt.finish("failure");
    attempt.finish("failure");
    attempt.finish("failure");
    expect(loginLimiter.begin(ip, "amina").retryAfter).toBe(0);
  });

  it("ignores finish on an attempt that was refused", () => {
    fail(loginLimiter, ip, "amina", 5);
    const refused = loginLimiter.begin(ip, "amina");
    refused.finish("success");
    expect(loginLimiter.begin(ip, "amina").retryAfter).toBe(15 * 60);
  });
});

describe("loginLimiter: attempts in flight", () => {
  it("counts attempts still waiting on the gateway, so a parallel burst can't slip past", () => {
    const pending = Array.from({ length: 5 }, () => loginLimiter.begin(ip, "amina"));
    expect(pending.every((attempt) => attempt.retryAfter === 0)).toBe(true);

    expect(loginLimiter.begin(ip, "amina").retryAfter).toBe(1);

    pending[0].finish("neutral");
    const next = loginLimiter.begin(ip, "amina");
    expect(next.retryAfter).toBe(0);

    next.finish("neutral");
    pending.slice(1).forEach((attempt) => attempt.finish("neutral"));
  });
});

describe("loginLimiter: per IP", () => {
  it("blocks every account from an IP after 30 failures", () => {
    for (let n = 0; n < 6; n++) fail(loginLimiter, ip, `user${n}`, 5);
    expect(loginLimiter.begin(ip, "someone-new").retryAfter).toBe(15 * 60);
  });

  it("is not reset by a successful sign-in", () => {
    for (let n = 0; n < 6; n++) {
      fail(loginLimiter, ip, `user${n}`, 4);
      loginLimiter.begin(ip, `user${n}`).finish("success");
    }
    fail(loginLimiter, ip, "user6", 4);
    // 28 failures so far (the successes reset only their accounts).
    fail(loginLimiter, ip, "user7", 2);
    expect(loginLimiter.begin(ip, "user8").retryAfter).toBe(15 * 60);
  });

  it("is skipped when the IP is unknown, while the per-account limit still applies", () => {
    for (let n = 0; n < 7; n++) fail(loginLimiter, UNKNOWN_IP, `unknown-${run}-${n}`, 5);

    const fresh = loginLimiter.begin(UNKNOWN_IP, `unknown-${run}-fresh`);
    expect(fresh.retryAfter).toBe(0);
    fresh.finish("neutral");

    expect(loginLimiter.begin(UNKNOWN_IP, `unknown-${run}-0`).retryAfter).toBe(15 * 60);
  });
});

describe("passwordChangeLimiter", () => {
  it("keeps its own counts, apart from sign-in", () => {
    fail(loginLimiter, ip, "amina", 5);
    const attempt = passwordChangeLimiter.begin(ip, "amina");
    expect(attempt.retryAfter).toBe(0);
    attempt.finish("neutral");

    fail(passwordChangeLimiter, ip, "amina", 4);
    expect(passwordChangeLimiter.begin(ip, "amina").retryAfter).toBe(0);
  });
});

describe("tooManyAttemptsMessage", () => {
  it("says an attempt is still in flight for very short waits", () => {
    expect(tooManyAttemptsMessage(1)).toBe("Another attempt is still being checked. Wait a moment and try again.");
    expect(tooManyAttemptsMessage(5)).toMatch(/still being checked/);
  });

  it("rounds the wait up to whole minutes", () => {
    expect(tooManyAttemptsMessage(6)).toBe("Too many sign-in attempts. Wait 1 minute and try again.");
    expect(tooManyAttemptsMessage(60)).toBe("Too many sign-in attempts. Wait 1 minute and try again.");
    expect(tooManyAttemptsMessage(61)).toBe("Too many sign-in attempts. Wait 2 minutes and try again.");
    expect(tooManyAttemptsMessage(900)).toBe("Too many sign-in attempts. Wait 15 minutes and try again.");
  });

  it("names what was attempted", () => {
    expect(tooManyAttemptsMessage(720, "password changes")).toBe("Too many password changes. Wait 12 minutes and try again.");
  });
});
