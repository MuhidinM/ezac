"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { apiClient } from "@/lib/api/client";
import type { SessionInfo } from "@/lib/api/types";

type MenuItem = {
  href: string;
  label: string;
  /** Shown for HQ staff (ADMIN / FIELD_OFFICER) */
  hqOnly?: boolean;
  /** ADMIN only */
  adminOnly?: boolean;
  /** BRANCH-only portal */
  branchOnly?: boolean;
};

const MENU_ITEMS: MenuItem[] = [
  { href: "/dashboard", label: "Overview", hqOnly: true },
  { href: "/dashboard/beneficiary", label: "Beneficiary", hqOnly: true },
  { href: "/dashboard/institutions", label: "Institution review", hqOnly: true },
  { href: "/dashboard/branches", label: "Branches", adminOnly: true },
  { href: "/dashboard/register", label: "Register beneficiary", hqOnly: true },
  { href: "/dashboard/branch", label: "My branch", branchOnly: true },
  { href: "/dashboard/profile", label: "Profile" },
];

const HQ_PATH_PREFIXES = [
  "/dashboard/beneficiary",
  "/dashboard/institutions",
  "/dashboard/branches",
  "/dashboard/register",
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<SessionInfo | null>(null);

  useEffect(() => {
    void apiClient<SessionInfo>("/api/auth/session")
      .then((data) => {
        setSession(data);

        if (data.isBranch) {
          const onHqPath =
            pathname === "/dashboard" ||
            HQ_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
          if (onHqPath) {
            router.replace("/dashboard/branch");
          }
        }
      })
      .catch(() => setSession(null));
  }, [pathname, router]);

  const isAdmin = session?.isAdmin ?? false;
  const isBranch = session?.isBranch ?? false;
  const isStaff = session?.isStaff ?? !isBranch;

  const visibleItems = MENU_ITEMS.filter((item) => {
    if (item.branchOnly) return isBranch;
    if (item.adminOnly) return isAdmin;
    if (item.hqOnly) return isStaff && !isBranch;
    return true;
  });

  return (
    <aside className="sticky top-0 hidden h-full w-64 shrink-0 overflow-y-auto border-r border-black/5 bg-white/90 p-4 backdrop-blur-xl md:block">
      <Link href={isBranch ? "/dashboard/branch" : "/dashboard"} className="mb-6 flex items-center gap-2.5 px-2">
        {/* eslint-disable-next-line @next/next/no-img-element -- brand mark served as a static asset */}
        <img src="/logo.svg" alt="EZAC" className="h-8 w-auto" />
        <span
          className="font-serif-display text-lg tracking-tight"
          style={{ color: "#001539" }}
        >
          EZAC
        </span>
      </Link>
      <p className="px-3 text-xs uppercase tracking-[0.16em] text-black/45">
        Dashboard
      </p>
      <nav className="mt-3 space-y-1.5">
        {visibleItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className="block rounded-xl px-3 py-2 text-sm transition hover:bg-black/3"
              style={
                isActive
                  ? {
                      backgroundColor: "rgba(0,112,80,0.1)",
                      color: "#007050",
                      fontWeight: 500,
                    }
                  : { color: "#001539" }
              }
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
