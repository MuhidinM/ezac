import {
  Building2,
  LayoutDashboard,
  Network,
  Store,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";

import type { SessionInfo } from "@/lib/api/types";

export type NavAudience = "hq" | "admin" | "branch";

export type NavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
  audience: NavAudience;
  items?: { title: string; url: string }[];
};

export type NavSection = {
  label: string;
  items: NavItem[];
};

export const NAV_SECTIONS: NavSection[] = [
  {
    label: "Workspace",
    items: [
      {
        title: "Overview",
        url: "/dashboard",
        icon: LayoutDashboard,
        audience: "hq",
      },
      {
        title: "Beneficiaries",
        url: "/dashboard/beneficiary",
        icon: Users,
        audience: "hq",
      },
      {
        title: "Register beneficiary",
        url: "/dashboard/register",
        icon: UserPlus,
        audience: "hq",
      },
      {
        title: "Institution review",
        url: "/dashboard/institutions",
        icon: Building2,
        audience: "hq",
      },
      {
        title: "My branch",
        url: "/dashboard/branch",
        icon: Store,
        audience: "branch",
      },
    ],
  },
  {
    label: "Administration",
    items: [
      {
        title: "Branches",
        url: "/dashboard/branches",
        icon: Network,
        audience: "admin",
      },
    ],
  },
];

export function canSee(audience: NavAudience, session: SessionInfo | null) {
  const isAdmin = session?.isAdmin ?? false;
  const isBranch = session?.isBranch ?? false;
  const isStaff = session?.isStaff ?? true;

  if (audience === "branch") return isBranch;
  if (audience === "admin") return isAdmin;
  return isStaff && !isBranch;
}

export function isActivePath(pathname: string, url: string) {
  return url === "/dashboard"
    ? pathname === "/dashboard"
    : pathname === url || pathname.startsWith(`${url}/`);
}

/** Breadcrumb labels for dashboard path segments. */
export const SEGMENT_LABELS: Record<string, string> = {
  beneficiary: "Beneficiaries",
  institutions: "Institution review",
  branches: "Branches",
  branch: "My branch",
  register: "Register beneficiary",
  profile: "Profile",
  donations: "Donations",
  reports: "Reports",
  household: "Household",
  institution: "Institution",
  documents: "Documents",
  manual: "Manual entry",
  password: "Set password",
  type: "Beneficiary type",
};

export function roleLabel(session: SessionInfo): string {
  if (session.isAdmin) return "Administrator";
  if (session.isBranch) return "Branch officer";
  if (session.roles.includes("FIELD_OFFICER")) return "Field officer";
  return "Staff user";
}
