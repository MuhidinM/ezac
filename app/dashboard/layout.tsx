import type { ReactNode } from "react";
import { cookies } from "next/headers";

import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardRoleGuard } from "@/components/dashboard/role-guard";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

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
        <AppSidebar />
        <SidebarInset className="h-svh overflow-hidden bg-(--dashboard-canvas) md:h-[calc(100svh-1rem)] md:peer-data-[variant=inset]:ring-1 md:peer-data-[variant=inset]:ring-black/[0.06]">
          <DashboardHeader />
          <main className="min-w-0 flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8">
              {children}
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
