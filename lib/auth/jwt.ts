import type { AppRole } from "@/lib/api/types";
import { filterAppRoles } from "@/lib/auth/constants";

type JwtPayload = {
  preferred_username?: string;
  username?: string;
  name?: string;
  phone?: string;
  sub?: string;
  exp?: number;
  roles?: string[];
  realm_access?: { roles?: string[] };
  resource_access?: Record<string, { roles?: string[] }>;
};

export function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const json = Buffer.from(padded, "base64").toString("utf8");
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

export function getAppRolesFromPayload(payload: JwtPayload): AppRole[] {
  const realmRoles = payload.realm_access?.roles ?? [];
  const claimRoles = Array.isArray(payload.roles) ? payload.roles : [];
  const access = payload.resource_access ?? {};
  const preferredResourceRoles =
    access["gateway-client"]?.roles ??
    access["gateway_client"]?.roles ??
    access.account?.roles ??
    [];
  const allResourceRoles = Object.values(access).flatMap(
    (entry) => entry?.roles ?? [],
  );
  const resourceRoles =
    preferredResourceRoles.length > 0 ? preferredResourceRoles : allResourceRoles;

  return filterAppRoles([...realmRoles, ...resourceRoles, ...claimRoles]);
}

export function getUsernameFromPayload(payload: JwtPayload): string {
  return (
    payload.preferred_username ??
    payload.username ??
    payload.name ??
    payload.phone ??
    payload.sub ??
    "Staff user"
  );
}

export function isTokenExpired(payload: JwtPayload): boolean {
  if (!payload.exp) return false;
  return payload.exp * 1000 <= Date.now();
}
