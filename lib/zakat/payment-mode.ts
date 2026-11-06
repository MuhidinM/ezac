/**
 * Whether the payment rails are live, read from payment-settings. Only an
 * explicit "live" counts as live: "sandbox", a missing value or anything this
 * screen doesn't know is treated as test, so a simulated result is never
 * shown as real money (go-live audit gap-r1-2-2). Payment-service is asked to
 * mark each payment, certificate and payout as test or live
 * (docs/backend-go-live-requests.md §5, §29).
 */

export type RailMode = "live" | "test";

/** The payment-settings fields this reads. */
export type PaymentModeSettings = {
  bankMode?: string | null;
  ethqrMode?: string | null;
  defaultOtpEnabled?: boolean | null;
  coopEnabled?: boolean | null;
};

/** The rails a screen depends on: the bank connection (payouts, Coop payments), EthQR, and the fixed confirmation code. */
export type ModeRail = "bank" | "qr" | "otp";

export function railMode(value: string | null | undefined): RailMode {
  return typeof value === "string" && value.trim().toLowerCase() === "live" ? "live" : "test";
}

/** "Live", "Sandbox", or the unknown value as sent ("Not set" when missing). */
export function modeLabel(value: string | null | undefined): string {
  if (railMode(value) === "live") return "Live";
  if (typeof value !== "string" || !value.trim()) return "Not set (treated as test)";
  if (value.trim().toLowerCase() === "sandbox") return "Sandbox";
  return `“${value.trim()}” (treated as test)`;
}

export type ModeWarning = {
  /** A rail the screen depends on isn't live: what it shows may be simulated. */
  test: boolean;
  /** One sentence per reason, for the banner. */
  reasons: string[];
};

function railReason(name: string, value: string | null | undefined, sandboxText: string) {
  if (typeof value === "string" && value.trim().toLowerCase() === "sandbox") return sandboxText;
  return `The ${name} mode is ${typeof value === "string" && value.trim() ? `“${value.trim()}”` : "not set"}, not “live”, so it is treated as a test.`;
}

/** What a screen using `rails` should warn about; `test` false and no reasons when everything it uses is live. */
export function modeWarning(settings: PaymentModeSettings, rails: readonly ModeRail[]): ModeWarning {
  const reasons: string[] = [];
  let test = false;
  if (rails.includes("bank") && railMode(settings.bankMode) === "test") {
    test = true;
    reasons.push(railReason("bank connection", settings.bankMode, "The bank connection is a sandbox: payouts and Coop account payments are simulated and no money moves."));
  }
  if (rails.includes("qr") && railMode(settings.ethqrMode) === "test") {
    test = true;
    reasons.push(railReason("EthQR", settings.ethqrMode, "EthQR is a sandbox: QR codes are fake and no money moves."));
  }
  if (rails.includes("otp") && settings.defaultOtpEnabled) {
    reasons.push("The fixed test confirmation code is on, so Coop account payments are not confirmed by SMS.");
  }
  return { test, reasons };
}

/**
 * The fixed test confirmation code while the bank connection is live: a launch
 * blocker (gap-r1-2-3). The backend should refuse this combination (§5, §29).
 */
export function fixedCodeOnLiveBank(settings: PaymentModeSettings): boolean {
  return Boolean(settings.defaultOtpEnabled) && railMode(settings.bankMode) === "live";
}
