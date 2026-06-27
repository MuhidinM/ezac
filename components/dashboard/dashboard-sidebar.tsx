"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const MENU_ITEMS = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/beneficiary", label: "Beneficiary" },
  { href: "/dashboard/register", label: "Register beneficiary" },
  { href: "/dashboard/donations", label: "Donations" },
  { href: "/dashboard/reports", label: "Reports" },
  { href: "/dashboard/profile", label: "Profile" },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-full w-64 shrink-0 overflow-y-auto border-r border-black/5 bg-white/90 p-4 backdrop-blur-xl md:block">
      <Link href="/dashboard" className="mb-6 flex items-center gap-2.5 px-2">
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
        {MENU_ITEMS.map((item) => {
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
