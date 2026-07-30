"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { useSession } from "@/lib/auth/use-session";

const HQ_PATH_PREFIXES = [
  "/dashboard/beneficiary",
  "/dashboard/institutions",
  "/dashboard/branches",
  "/dashboard/register",
];

/** Keeps branch officers inside their own portal. */
export function DashboardRoleGuard() {
  const pathname = usePathname();
  const router = useRouter();
  const { session } = useSession();

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
