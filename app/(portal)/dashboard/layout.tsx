import type { Metadata } from "next";
import type { ReactNode } from "react";
import { cookies } from "next/headers";

import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { IdleSignOut } from "@/components/auth/idle-sign-out";
import { DashboardRoleGuard } from "@/components/dashboard/role-guard";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

// Staff-only pages: keep them out of search results, and name the tab so it
// isn't mistaken for the public site.
export const metadata: Metadata = {
  title: { default: "Staff portal — EZAC", template: "%s — EZAC staff" },
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  // Persisted by SidebarProvider so the collapsed state survives reloads.
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";

  return (
    <TooltipProvider delayDuration={0}>
      <SidebarProvider defaultOpen={defaultOpen} className="dashboard-theme">
        <DashboardRoleGuard />
        <IdleSignOut />
        <AppSidebar />
        <SidebarInset className="h-svh overflow-hidden bg-(--dashboard-canvas) md:h-[calc(100svh-1rem)] md:peer-data-[variant=inset]:ring-1 md:peer-data-[variant=inset]:ring-black/[0.06]">
          <DashboardHeader />
          {/* SidebarInset is already the <main> landmark; this scroll area is the skip link's
              target. tabIndex lets the skip link focus it, so arrow keys scroll it next. */}
          <div id="main" tabIndex={-1} className="min-w-0 flex-1 overflow-y-auto outline-none">
            <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8">
              {children}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
