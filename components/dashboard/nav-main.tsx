"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { isActivePath, type NavItem } from "@/components/dashboard/nav-config";

export function NavMain({ label, items }: { label: string; items: NavItem[] }) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

  if (items.length === 0) return null;

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-[11px] font-medium tracking-wide text-sidebar-foreground/60 uppercase">
        {label}
      </SidebarGroupLabel>
      <SidebarMenu className="gap-0.5">
        {items.map((item) => {
          const active = isActivePath(pathname, item.url);
          return (
            <SidebarMenuItem key={item.url}>
              <SidebarMenuButton
                asChild
                isActive={active}
                tooltip={item.title}
                className="h-9 font-medium text-sidebar-foreground data-active:bg-white data-active:text-[#001539] data-active:shadow-xs data-active:ring-1 data-active:ring-black/5 [&>svg]:text-sidebar-foreground/70 data-active:[&>svg]:text-[#007050]"
              >
                <Link
                  href={item.url}
                  onClick={() => {
                    if (isMobile) setOpenMobile(false);
                  }}
                >
                  <item.icon />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
