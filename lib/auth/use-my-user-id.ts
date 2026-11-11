"use client";

import type { MeProfile } from "@/lib/api/types";
import { useResource } from "@/lib/api/use-resource";

/**
 * The signed-in staff member's id (the `sub` that `createdBy` and
 * `requestedBy` hold), null until it is known. Used to tell an admin that a
 * step they started waits for another admin (403 SAME_APPROVER).
 */
export function useMyUserId(): string | null {
  const { data } = useResource<MeProfile>("/bff/auth/me");
  return data?.sub ?? null;
}
