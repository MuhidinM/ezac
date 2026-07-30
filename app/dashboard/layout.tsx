import type { ReactNode } from "react";
import { DashboardRoleGuard } from "@/components/dashboard/role-guard";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardTopbar } from "@/components/dashboard/dashboard-topbar";

export default function DashboardLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <div className="min-h-screen bg-[#ececec]">
      <DashboardRoleGuard />
      <DashboardTopbar />
      <div className="flex h-[calc(100vh-4rem)] w-full overflow-hidden">
        <DashboardSidebar />
        <main className="min-w-0 flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
