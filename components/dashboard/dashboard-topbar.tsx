"use client";

import Link from "next/link";
import { ChevronRight, CircleUserRound } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

import { clearSessionCache, useSession } from "@/lib/auth/use-session";

function formatSegment(segment: string) {
  return segment
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function roleLabel(session: {
  isAdmin: boolean;
  isBranch: boolean;
  roles: string[];
}): string {
  if (session.isAdmin) return "Administrator";
  if (session.isBranch) return "Branch officer";
  if (session.roles.includes("FIELD_OFFICER")) return "Field officer";
  return "Staff user";
}

export function DashboardTopbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { session } = useSession();

  const segments = pathname.split("/").filter(Boolean);
  const crumbs = ["Dashboard", ...segments.slice(1).map(formatSegment)];

  async function onLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    clearSessionCache();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-20 border-b border-black/5 bg-white/80 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between gap-4 px-4 md:px-6">
        <nav aria-label="Breadcrumb" className="min-w-0 overflow-x-auto">
          <ol className="flex items-center gap-1.5 text-sm text-black/55">
            {crumbs.map((crumb, index) => {
              const isLast = index === crumbs.length - 1;
              return (
                <li key={`${crumb}-${index}`} className="flex items-center gap-1.5">
                  {index > 0 && <ChevronRight className="h-3.5 w-3.5 text-black/35" />}
                  <span className={isLast ? "font-medium text-[#001539]" : ""}>{crumb}</span>
                </li>
              );
            })}
          </ol>
        </nav>

        <details className="group relative">
          <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1.5 text-sm text-black/70 transition hover:border-black/20 hover:text-[#001539]">
            <CircleUserRound className="h-4 w-4" />
            <span className="hidden sm:inline">
              {session?.username ?? "Staff user"}
            </span>
          </summary>
          <div className="absolute right-0 mt-2 w-48 overflow-hidden rounded-xl border border-black/8 bg-white shadow-lg shadow-black/5">
            {session ? (
              <p className="border-b border-black/5 px-4 py-2.5 text-xs text-black/50">
                {roleLabel(session)}
              </p>
            ) : null}
            <Link
              href="/dashboard/profile"
              className="block px-4 py-2.5 text-sm text-black/70 transition hover:bg-black/3 hover:text-[#001539]"
            >
              Profile
            </Link>
            <button
              type="button"
              onClick={() => void onLogout()}
              className="block w-full px-4 py-2.5 text-left text-sm text-black/70 transition hover:bg-black/3 hover:text-[#001539]"
            >
              Log out
            </button>
          </div>
        </details>
      </div>
    </header>
  );
}
