import {
  Building2,
  ClipboardCheck,
  Coins,
  FileText,
  LayoutDashboard,
  Network,
  SlidersHorizontal,
  Store,
  UserPlus,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";

import type { SessionInfo } from "@/lib/api/types";

/**
 * hq: any head-office staff (ADMIN, FIELD_OFFICER, or a staff token without a
 * recognised role); admin / officer / branch: that role only.
 */
export type NavAudience = "hq" | "admin" | "officer" | "branch";

export type NavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
  audience: NavAudience[];
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
        audience: ["hq"],
      },
      {
        title: "Beneficiaries",
        url: "/dashboard/beneficiary",
        icon: Users,
        audience: ["hq"],
      },
      {
        title: "Register beneficiary",
        url: "/dashboard/register",
        icon: UserPlus,
        audience: ["hq"],
      },
      {
        title: "Institution review",
        url: "/dashboard/institutions",
        icon: Building2,
        audience: ["hq"],
      },
      {
        title: "Assessments",
        url: "/dashboard/assessments",
        icon: ClipboardCheck,
        audience: ["hq", "branch"],
      },
      {
        title: "My branch",
        url: "/dashboard/branch",
        icon: Store,
        audience: ["branch"],
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
        audience: ["admin"],
      },
      {
        title: "Field officers",
        url: "/dashboard/field-officers",
        icon: UserCog,
        audience: ["admin"],
      },
      {
        title: "Scoring config",
        url: "/dashboard/scoring-config",
        icon: SlidersHorizontal,
        audience: ["admin"],
      },
    ],
  },
  {
    label: "Zakat & transparency",
    items: [
      {
        title: "Prices & nisab",
        url: "/dashboard/zakat/prices",
        icon: Coins,
        audience: ["admin"],
      },
      {
        title: "Impact reports",
        url: "/dashboard/zakat/reports",
        icon: FileText,
        audience: ["admin"],
      },
    ],
  },
];

export function isFieldOfficer(session: SessionInfo | null) {
  return session?.roles.includes("FIELD_OFFICER") ?? false;
}

export function canSee(audience: NavAudience[], session: SessionInfo | null) {
  const isAdmin = session?.isAdmin ?? false;
  const isBranch = session?.isBranch ?? false;
  const isStaff = session?.isStaff ?? true;

  return audience.some((target) => {
    if (target === "branch") return isBranch;
    if (target === "admin") return isAdmin;
    if (target === "officer") return isFieldOfficer(session);
    return isStaff && !isBranch;
  });
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
  assessments: "Assessments",
  "field-officers": "Field officers",
  edit: "Edit",
  "scoring-config": "Scoring config",
  duplicates: "Duplicate review",
  zakat: "Zakat",
  prices: "Prices & nisab",
};

export function roleLabel(session: SessionInfo): string {
  if (session.isAdmin) return "Administrator";
  if (session.isBranch) return "Branch officer";
  if (session.roles.includes("FIELD_OFFICER")) return "Field officer";
  return "Staff user";
}
