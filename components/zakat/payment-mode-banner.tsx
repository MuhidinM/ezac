"use client";

import { ErrorAlert } from "@/components/dashboard/error-alert";
import { InlineAlert } from "@/components/dashboard/inline-alert";
import { useResource } from "@/lib/api/use-resource";
import { type ModeRail, type PaymentModeSettings, modeWarning, railMode } from "@/lib/zakat/payment-mode";

/** The payment settings that say whether each rail is live. */
export function usePaymentMode() {
  const { data, error, reload } = useResource<PaymentModeSettings>("/bff/payments-admin/payment-settings");
  return { settings: data ?? null, error, reload };
}

export type PaymentMode = ReturnType<typeof usePaymentMode>;

/** True once the settings are known and the rail isn't live (unknown values count as test). */
export function isTestRail(mode: PaymentMode, rail: "bank" | "qr") {
  if (!mode.settings) return false;
  return railMode(rail === "bank" ? mode.settings.bankMode : mode.settings.ethqrMode) === "test";
}

/**
 * A red "Test mode" banner on screens that show money moving, whenever a rail
 * the screen uses isn't live, so simulated results aren't read as real. If
 * the settings can't be read, says so: nothing here is assumed live.
 */
export function PaymentModeBanner({
  mode,
  rails,
  className,
}: {
  mode: PaymentMode;
  rails: readonly ModeRail[];
  className?: string;
}) {
  if (mode.error) {
    return (
      <ErrorAlert
        error={mode.error}
        title="Couldn't check whether payments are live"
        onRetry={mode.reload}
        className={className}
      />
    );
  }
  if (!mode.settings) return null;
  const warning = modeWarning(mode.settings, rails);
  if (warning.reasons.length === 0) return null;
  return (
    <InlineAlert
      tone={warning.test ? "error" : "warning"}
      title={warning.test ? "Test mode: no real money moves" : "Test setting on"}
      className={className}
    >
      {warning.reasons.length === 1 ? (
        warning.reasons[0]
      ) : (
        <ul className="list-disc space-y-0.5 pl-4">
          {warning.reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      )}
      {warning.test ? <span className="mt-1 block">Don&apos;t treat results on this page as real payments.</span> : null}
    </InlineAlert>
  );
}
