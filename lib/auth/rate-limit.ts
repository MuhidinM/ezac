/**
 * Small in-memory limiter for failed sign-in and password-change attempts.
 *
 * It lives in this server process only: every pm2 instance (or restart) has its
 * own counts. That is enough for the single-process deployment; a cluster
 * would need a shared store. Keycloak's own brute-force detection remains the
 * real control, since the gateway login is reachable without this app.
 */

type FailureWindow = { failures: number; resetAt: number };

type Rule = { limit: number; windowMs: number };

/** Hard cap on tracked keys so a flood of usernames can't grow memory without bound. */
const MAX_KEYS = 10_000;

/** What a caller is told to wait when the limit is reached only by attempts still in flight. */
const IN_FLIGHT_WAIT_MS = 1_000;

/** The IP clientIp() returns when the proxy didn't say who the browser is. */
export const UNKNOWN_IP = "unknown";

class FailureCounter {
  private readonly windows = new Map<string, FailureWindow>();
  /** Attempts that passed the check and are still waiting on the gateway. */
  private readonly pending = new Map<string, number>();
  private readonly rule: Rule;

  constructor(rule: Rule) {
    this.rule = rule;
  }

  /**
   * Milliseconds until `key` may try again, or 0 when it is under the limit.
   * Attempts still in flight count too, so a burst of parallel requests can't
   * all slip past before the first failure is recorded.
   */
  blockedFor(key: string, now: number): number {
    let entry = this.windows.get(key);
    if (entry && entry.resetAt <= now) {
      this.windows.delete(key);
      entry = undefined;
    }
    const failures = entry?.failures ?? 0;
    if (failures + (this.pending.get(key) ?? 0) < this.rule.limit) return 0;
    return failures >= this.rule.limit && entry ? entry.resetAt - now : IN_FLIGHT_WAIT_MS;
  }

  acquire(key: string): void {
    this.pending.set(key, (this.pending.get(key) ?? 0) + 1);
  }

  release(key: string): void {
    const left = (this.pending.get(key) ?? 0) - 1;
    if (left > 0) this.pending.set(key, left);
    else this.pending.delete(key);
  }

  fail(key: string, now: number): void {
    const entry = this.windows.get(key);
    if (entry && entry.resetAt > now) {
      entry.failures += 1;
      return;
    }
    if (entry) this.windows.delete(key);
    this.makeRoom(now);
    this.windows.set(key, { failures: 1, resetAt: now + this.rule.windowMs });
  }

  reset(key: string): void {
    this.windows.delete(key);
  }

  /**
   * Every window has the same length and a key is re-inserted when its window
   * restarts, so Map order is expiry order: the oldest windows sit at the
   * front. Drop expired ones from there, and the oldest live ones if still
   * full. Cheap even under a flood of new keys.
   */
  private makeRoom(now: number): void {
    for (const [key, entry] of this.windows) {
      if (entry.resetAt > now && this.windows.size < MAX_KEYS) break;
      this.windows.delete(key);
    }
  }
}

const FIFTEEN_MINUTES = 15 * 60 * 1000;

export type AttemptOutcome = "failure" | "success" | "neutral";

export type Attempt = {
  /** Seconds to wait before trying again; 0 when the attempt may go ahead. */
  retryAfter: number;
  /**
   * Call exactly once when the attempt is over (use try/finally): "failure"
   * for a wrong password, "success" when it worked, "neutral" for anything
   * else (timeouts, outages). Does nothing when retryAfter > 0.
   */
  finish(outcome: AttemptOutcome): void;
};

export type AttemptLimiter = {
  /**
   * Checks both limits and, when the attempt may go ahead, reserves a place
   * for it straight away (no await between the check and the reservation).
   */
  begin(ip: string, account: string): Attempt;
};

/**
 * Counts failures per account+IP and per IP. A success clears the account+IP
 * count only, so one working login can't be used to reset the IP budget.
 *
 * When the IP is unknown (the reverse proxy sent no X-Real-IP or
 * X-Forwarded-For, so every visitor looks the same), the per-IP limit is
 * skipped: it would be one bucket for the whole site, and 30 wrong passwords
 * from anyone would lock every staff member out. The per-account limit still
 * applies, which is what Keycloak's own lockout does.
 */
function createAttemptLimiter(perAccount: Rule, perIp: Rule): AttemptLimiter {
  const accounts = new FailureCounter(perAccount);
  const ips = new FailureCounter(perIp);

  return {
    begin(ip, account) {
      const now = Date.now();
      const accountKey = `${ip}|${account}`;
      const countIp = ip !== UNKNOWN_IP;
      const wait = Math.max(accounts.blockedFor(accountKey, now), countIp ? ips.blockedFor(ip, now) : 0);
      if (wait > 0) {
        return { retryAfter: Math.ceil(wait / 1000), finish: () => undefined };
      }

      accounts.acquire(accountKey);
      if (countIp) ips.acquire(ip);
      let finished = false;
      return {
        retryAfter: 0,
        finish(outcome) {
          if (finished) return;
          finished = true;
          accounts.release(accountKey);
          if (countIp) ips.release(ip);
          const at = Date.now();
          if (outcome === "failure") {
            accounts.fail(accountKey, at);
            if (countIp) ips.fail(ip, at);
          } else if (outcome === "success") {
            accounts.reset(accountKey);
          }
        },
      };
    },
  };
}

/** Sign-in: 5 failures per username and IP, 30 per IP, in 15 minutes. */
export const loginLimiter = createAttemptLimiter(
  { limit: 5, windowMs: FIFTEEN_MINUTES },
  { limit: 30, windowMs: FIFTEEN_MINUTES },
);

/** Password change: 5 wrong current passwords per account and IP, 30 per IP, in 15 minutes. */
export const passwordChangeLimiter = createAttemptLimiter(
  { limit: 5, windowMs: FIFTEEN_MINUTES },
  { limit: 30, windowMs: FIFTEEN_MINUTES },
);

/** "Too many sign-in attempts. Wait 12 minutes and try again." */
export function tooManyAttemptsMessage(retryAfterSeconds: number, what = "sign-in attempts"): string {
  if (retryAfterSeconds <= 5) return `Another attempt is still being checked. Wait a moment and try again.`;
  const minutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));
  return `Too many ${what}. Wait ${minutes} minute${minutes === 1 ? "" : "s"} and try again.`;
}
