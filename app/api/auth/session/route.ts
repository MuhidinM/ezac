import { NextResponse } from "next/server";

import { ApiError } from "@/lib/api/errors";
import { gatewayRequest } from "@/lib/api/gateway";
import type { MeProfile } from "@/lib/api/types";
import {
  getAccessToken,
  getSessionFromJwt,
  sessionFromMeProfile,
} from "@/lib/auth/session";

export async function GET() {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json(
      { success: false, message: "Not authenticated" },
      { status: 401 },
    );
  }

  try {
    const profile = await gatewayRequest<MeProfile>("/api/auth/v1/me", {
      accessToken,
    });
    return NextResponse.json({
      success: true,
      data: sessionFromMeProfile(profile),
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 },
      );
    }

    const fallback = await getSessionFromJwt();
    if (!fallback) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 },
      );
    }

    return NextResponse.json({ success: true, data: fallback });
  }
}
