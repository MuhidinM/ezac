import { NextResponse } from "next/server";

import { getApiBaseUrl } from "@/lib/api/config";
import {
  setAuthCookies,
  shouldUseSecureCookies,
} from "@/lib/auth/session";
import { errorText, readTokens } from "@/lib/auth/tokens";

type LoginBody = {
  username?: string;
  password?: string;
};

/** POST /api/auth/v1/login `{ username, password }`; tokens go into httpOnly cookies. */
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

  let upstream: Response;
  try {
    upstream = await fetch(`${getApiBaseUrl()}/api/auth/v1/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
      cache: "no-store",
    });
  } catch (error) {
    console.error("[auth] login request failed:", error);
    return NextResponse.json(
      { success: false, message: "Unable to reach authentication service" },
      { status: 502 },
    );
  }

  const payload = (await upstream.json().catch(() => null)) as unknown;

  if (!upstream.ok) {
    const status = upstream.status === 401 || upstream.status === 403 ? 401 : upstream.status;
    return NextResponse.json(
      {
        success: false,
        message:
          upstream.status === 401
            ? errorText(payload, "Invalid username or password")
            : errorText(payload, "Sign-in failed. Try again."),
      },
      { status },
    );
  }

  const tokens = readTokens(payload);
  if (!tokens) {
    // Log the shape only; the body may hold credentials-adjacent data.
    const keys = payload && typeof payload === "object" ? Object.keys(payload as object) : typeof payload;
    console.error("[auth] login returned no tokens; response keys:", keys);
    return NextResponse.json(
      { success: false, message: "The authentication service sent an unexpected response" },
      { status: 502 },
    );
  }

  await setAuthCookies(
    {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
    },
    { secure: shouldUseSecureCookies(request) },
  );

  return NextResponse.json({
    success: true,
    data: { passwordChangeRequired: tokens.passwordChangeRequired },
    message: "Login successful",
  });
}
