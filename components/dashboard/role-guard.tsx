"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { sendToSignIn } from "@/lib/auth/client-session";
import { useSession } from "@/lib/auth/use-session";

const HQ_PATH_PREFIXES = [
  "/dashboard/beneficiary",
  "/dashboard/institutions",
  "/dashboard/branches",
  "/dashboard/register",
  "/dashboard/field-officers",
  "/dashboard/scoring-config",
  "/dashboard/zakat",
  "/dashboard/pool",
  "/dashboard/disbursements",
  "/dashboard/whitelist",
  "/dashboard/bank-changes",
  "/dashboard/staff",
];

/**
 * Mounted once in the dashboard layout. Sends the browser to sign-in when the
 * session has ended (deactivated account, expired IdP session), and keeps
 * branch officers inside their own portal.
 */
export function DashboardRoleGuard() {
  const pathname = usePathname();
  const router = useRouter();
  const { session, signedOut } = useSession();

  useEffect(() => {
    if (signedOut) void sendToSignIn(pathname);
  }, [pathname, signedOut]);

  useEffect(() => {
    if (!session?.isBranch) return;

    const onHqPath =
      pathname === "/dashboard" ||
      HQ_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));

    if (onHqPath) {
      router.replace("/dashboard/branch");
    }
  }, [pathname, router, session]);

  return null;
}
