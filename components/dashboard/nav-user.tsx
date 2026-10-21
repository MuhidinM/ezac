"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronsUpDown, LogOut, UserRound } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { roleLabel } from "@/components/dashboard/nav-config";
import { clearSessionCache, useSession } from "@/lib/auth/use-session";

function initials(name: string) {
  const parts = name.split(/[\s._@-]+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0][0] + parts[1][0] : name.slice(0, 2);
  return letters.toUpperCase();
}

export function NavUser() {
  const router = useRouter();
  const { isMobile } = useSidebar();
  const { session, isLoading } = useSession();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-2">
        <Skeleton className="size-8 rounded-lg" />
        <div className="grid flex-1 gap-1.5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-2.5 w-16" />
        </div>
      </div>
    );
  }

  const name = session?.displayName?.trim() || session?.username || "Staff user";
  const subtitle = session ? roleLabel(session) : "Signed in";

  async function onLogout() {
    await fetch("/bff/auth/logout", { method: "POST" });
    clearSessionCache();
    router.push("/login");
    router.refresh();
  }

  const identity = (
    <>
      <Avatar className="size-8 rounded-lg">
        <AvatarFallback className="rounded-lg bg-[#001539] text-xs font-semibold text-white">
          {initials(name)}
        </AvatarFallback>
      </Avatar>
      <div className="grid flex-1 text-left text-sm leading-tight">
        <span className="truncate font-medium text-[#001539]">{name}</span>
        <span className="truncate text-xs text-muted-foreground">{subtitle}</span>
      </div>
    </>
  );

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground"
            >
              {identity}
              <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                {identity}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/profile">
                  <UserRound />
                  Profile &amp; security
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => void onLogout()}>
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
