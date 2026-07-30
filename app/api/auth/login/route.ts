import { NextResponse } from "next/server";

import { ApiError } from "@/lib/api/errors";
import { gatewayRequest } from "@/lib/api/gateway";
import type { LoginData } from "@/lib/api/types";
import {
  setAuthCookies,
  shouldUseSecureCookies,
} from "@/lib/auth/session";

type LoginBody = {
  username?: string;
  password?: string;
};

export async function POST(request: Request) {
  let body: LoginBody;

  try {
    body = (await request.json()) as LoginBody;
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid request body" },
      { status: 400 },
    );
  }

  const username = body.username?.trim();
  const password = body.password;

  if (!username || !password) {
    return NextResponse.json(
      { success: false, message: "Username and password are required" },
      { status: 400 },
    );
  }

  try {
    const data = await gatewayRequest<LoginData>("/api/auth/v1/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });

    await setAuthCookies(
      {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresIn: data.expiresIn,
      },
      { secure: shouldUseSecureCookies(request) },
    );

    return NextResponse.json({
      success: true,
      data: {
        passwordChangeRequired: data.passwordChangeRequired,
      },
      message: "Login successful",
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.status === 401 ? 401 : error.status },
      );
    }

    return NextResponse.json(
      { success: false, message: "Unable to reach authentication service" },
      { status: 502 },
    );
  }
}
