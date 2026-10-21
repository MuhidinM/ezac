import { NextResponse } from "next/server";

import { ApiError } from "@/lib/api/errors";
import { gatewayRequest } from "@/lib/api/gateway";
import type { MeProfile, SessionInfo } from "@/lib/api/types";
import {
  filterAppRoles,
  hasStaffRole,
  isAdminRole,
  isBranchRole,
} from "@/lib/auth/constants";
import {
  getAccessToken,
  getSessionFromJwt,
  sessionFromMeProfile,
} from "@/lib/auth/session";

/**
 * Prefer /me for display fields, but union roles with the access token so the
 * Branches menu still appears when Keycloak puts ADMIN on the JWT and /me
 * returns an empty roles array.
 */
function mergeSessionWithJwt(
  fromMe: SessionInfo,
  fromJwt: SessionInfo | null,
): SessionInfo {
  if (!fromJwt) return fromMe;

  const combined = filterAppRoles([
    ...fromMe.allRoles,
    ...fromMe.roles,
    ...fromJwt.allRoles,
    ...fromJwt.roles,
  ]);
  const allRoles = Array.from(
    new Set([...fromMe.allRoles, ...fromJwt.allRoles, ...combined]),
  );
  const staff = hasStaffRole(combined) || hasStaffRole(allRoles);
  const branch = isBranchRole(combined) || isBranchRole(allRoles);

  return {
    ...fromMe,
    roles: combined,
    allRoles,
    isAdmin: isAdminRole(combined) || isAdminRole(allRoles),
    isBranch: branch && !staff,
    isStaff: staff || !branch,
  };
}

export async function GET() {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json(
      { success: false, message: "Not authenticated" },
      { status: 401 },
    );
  }

  const fromJwt = await getSessionFromJwt();

  try {
    const profile = await gatewayRequest<MeProfile>("/api/auth/v1/me", {
      accessToken,
    });
    return NextResponse.json({
      success: true,
      data: mergeSessionWithJwt(sessionFromMeProfile(profile), fromJwt),
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 },
      );
    }

    if (!fromJwt) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 },
      );
    }

    return NextResponse.json({ success: true, data: fromJwt });
  }
}
