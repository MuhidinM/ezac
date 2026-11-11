"use client";

import { useResource } from "@/lib/api/use-resource";
import type { PayoutBank } from "@/lib/beneficiary/types";

/** The banks a household can be paid into (`GET /payout-banks`), read when `enabled`. */
export function usePayoutBanks(enabled = true) {
  const { data, error, isLoading, reload } = useResource<PayoutBank[]>(enabled ? "/bff/backoffice/payout-banks" : null);
  return { banks: data ?? null, error, isLoading, reload };
}
