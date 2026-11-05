import {
  Banknote,
  Building2,
  Calculator,
  ClipboardCheck,
  Coins,
  FileText,
  HandHeart,
  Inbox,
  ListChecks,
  MapPinned,
  Newspaper,
  LayoutDashboard,
  Network,
  Settings2,
  SlidersHorizontal,
  Store,
  UserPlus,
  UserCog,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import type { SessionInfo } from "@/lib/api/types";

/**
 * hq: any head-office staff (ADMIN or FIELD_OFFICER; a roleless account only
 * when TRUST_ROLELESS_ACCOUNTS is on); admin / officer / branch: that role only.
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
        title: "Disbursement pool",
        url: "/dashboard/pool",
        icon: Inbox,
        audience: ["admin"],
      },
      {
        title: "Payouts",
        url: "/dashboard/disbursements",
        icon: Banknote,
        audience: ["admin"],
      },
      {
        title: "Whitelist",
        url: "/dashboard/whitelist",
        icon: ListChecks,
        audience: ["admin"],
      },
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
        title: "Scoring",
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
        title: "Zakat payments",
        url: "/dashboard/zakat/payments",
        icon: Wallet,
        audience: ["admin"],
      },
      {
        title: "Prices & nisab",
        url: "/dashboard/zakat/prices",
        icon: Coins,
        audience: ["admin"],
      },
      {
        title: "Calculator rules",
        url: "/dashboard/zakat/rules",
        icon: Calculator,
        audience: ["admin"],
      },
      {
        title: "Causes",
        url: "/dashboard/zakat/causes",
        icon: HandHeart,
        audience: ["admin"],
      },
      {
        title: "Impact regions",
        url: "/dashboard/zakat/regions",
        icon: MapPinned,
        audience: ["admin"],
      },
      {
        title: "Impact stories",
        url: "/dashboard/zakat/stories",
        icon: Newspaper,
        audience: ["admin"],
      },
      {
        title: "Impact reports",
        url: "/dashboard/zakat/reports",
        icon: FileText,
        audience: ["admin"],
      },
      {
        title: "Zakat settings",
        url: "/dashboard/zakat/settings",
        icon: Settings2,
        audience: ["admin"],
      },
    ],
  },
];

export function isFieldOfficer(session: SessionInfo | null) {
  return session?.roles.includes("FIELD_OFFICER") ?? false;
}

/**
 * Deny by default: no session (not loaded, signed out, or an account without
 * an EZAC role) sees nothing. Callers show a skeleton while the session loads
 * instead of asking this.
 */
export function canSee(audience: NavAudience[], session: SessionInfo | null) {
  if (!session) return false;
  const { isAdmin, isBranch, isStaff } = session;

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

/** Breadcrumb labels for dashboard path segments; they match the sidebar names. */
export const SEGMENT_LABELS: Record<string, string> = {
  beneficiary: "Beneficiaries",
  institutions: "Institution review",
  branches: "Branches",
  branch: "My branch",
  register: "Register beneficiary",
  profile: "Profile",
  household: "Household",
  institution: "Institution",
  documents: "Documents",
  manual: "Register an individual",
  password: "Set password",
  type: "Beneficiary type",
  assessments: "Assessments",
  "field-officers": "Field officers",
  edit: "Edit",
  "scoring-config": "Scoring",
  duplicates: "Duplicate review",
  zakat: "Zakat",
  pool: "Disbursement pool",
  disbursements: "Payouts",
  whitelist: "Whitelist",
  prices: "Prices & nisab",
  settings: "Settings",
};

/** Labels that depend on the folder above, keyed `<parent>/<segment>`. */
export const SECTION_SEGMENT_LABELS: Record<string, string> = {
  "zakat/payments": "Zakat payments",
  "zakat/prices": "Prices & nisab",
  "zakat/rules": "Calculator rules",
  "zakat/causes": "Causes",
  "zakat/regions": "Impact regions",
  "zakat/stories": "Impact stories",
  "zakat/reports": "Impact reports",
  "zakat/settings": "Zakat settings",
};

/** Folders with no page of their own; their crumb is plain text, not a link. */
export const UNLINKED_SEGMENTS = new Set(["/dashboard/zakat"]);

export function roleLabel(session: SessionInfo): string {
  if (session.isAdmin) return "Administrator";
  if (session.isBranch) return "Branch officer";
  if (session.roles.includes("FIELD_OFFICER")) return "Field officer";
  return "Staff user";
}
