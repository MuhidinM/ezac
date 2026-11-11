import { NextResponse } from "next/server";

import { SESSION_ENDED_MESSAGE, bffError } from "@/lib/api/bff";
import { ApiError } from "@/lib/api/errors";
import { gatewayRequest } from "@/lib/api/gateway";
import type { ChangePasswordBody, MeProfile } from "@/lib/api/types";
import { authError, authUnavailableResponse, clientIp } from "@/lib/auth/http";
import { staffPasswordProblems } from "@/lib/auth/password-policy";
import { UNKNOWN_IP, passwordChangeLimiter, tooManyAttemptsMessage } from "@/lib/auth/rate-limit";
import {
  AUTH_REQUEST_TIMEOUT_MS,
  AuthUnavailableError,
  clearAuthCookies,
  getAccessToken,
  sessionFromAccessToken,
} from "@/lib/auth/session";

const WRONG_CURRENT_PASSWORD = "Your current password is not correct.";

/**
 * Whether the gateway still accepts this token. Only a 401 from /me means
 * the session is over; anything else (an answer, a 403, an outage) leaves
 * the session alone.
 */
async function tokenState(accessToken: string): Promise<"valid" | "ended"> {
  try {
    await gatewayRequest<MeProfile>("/api/auth/v1/me", {
      accessToken,
      label: "auth/me/password token check",
      timeoutMs: AUTH_REQUEST_TIMEOUT_MS,
    });
    return "valid";
  } catch (error) {
    return error instanceof ApiError && error.status === 401 ? "ended" : "valid";
  }
}

export async function POST(request: Request) {
  let body: Partial<ChangePasswordBody>;

  try {
    body = (await request.json()) as Partial<ChangePasswordBody>;
  } catch {
    return authError(400, "Invalid request body");
  }

  const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";
  const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";
  const confirmNewPassword = typeof body?.confirmNewPassword === "string" ? body.confirmNewPassword : "";

  if (!currentPassword || !newPassword || !confirmNewPassword) {
    return authError(400, "All password fields are required");
  }

  const problems = staffPasswordProblems(currentPassword, newPassword, confirmNewPassword);
  if (problems.length > 0) {
    return NextResponse.json(
      {
        success: false,
        // Every problem at once, so nobody fixes the rules one by one.
        message: `${problems.join(". ")}.`,
        errors: problems.map((message) => ({ field: "newPassword", message })),
      },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  let accessToken: string | null;
  try {
    accessToken = await getAccessToken();
  } catch (error) {
    if (error instanceof AuthUnavailableError) return authUnavailableResponse();
    throw error;
  }
  if (!accessToken) {
    return authError(401, "Authentication required");
  }

  // Guessing the current password from a hijacked session is throttled like sign-in.
  const ip = clientIp(request);
  const account = sessionFromAccessToken(accessToken)?.username ?? "unknown";
  const attempt = passwordChangeLimiter.begin(ip, account);
  if (attempt.retryAfter > 0) {
    return authError(429, tooManyAttemptsMessage(attempt.retryAfter, "password attempts"), {
      "Retry-After": String(attempt.retryAfter),
    });
  }

  // Held until the gateway answers, so parallel guesses count straight away.
  try {
    await gatewayRequest<unknown>("/api/auth/v1/me/password", {
      method: "POST",
      headers: ip === UNKNOWN_IP ? undefined : { "X-Forwarded-For": ip },
      body: JSON.stringify({
        currentPassword,
        newPassword,
        confirmNewPassword,
      }),
      accessToken,
      label: "auth/me/password",
      timeoutMs: AUTH_REQUEST_TIMEOUT_MS,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      // Since the 10 November release a wrong current password is 400 CURRENT_PASSWORD_INVALID.
      if (error.code === "CURRENT_PASSWORD_INVALID") {
        attempt.finish("failure");
        return authError(400, WRONG_CURRENT_PASSWORD);
      }
      // Older gateways answer a wrong current password with 401, the same
      // status as a dead token. Only a dead token ends the session; a typo
      // must leave the user signed in to try again.
      if (error.status === 401) {
        if ((await tokenState(accessToken)) === "ended") {
          attempt.finish("neutral");
          await clearAuthCookies();
          return authError(401, SESSION_ENDED_MESSAGE);
        }
        attempt.finish("failure");
        return authError(400, WRONG_CURRENT_PASSWORD);
      }

      const wrongPassword = error.status === 400 || error.status === 403;
      attempt.finish(wrongPassword ? "failure" : "neutral");

      // 502/504 arrive here too, already logged, with a plain message.
      return bffError(error);
    }
    attempt.finish("neutral");
    throw error;
  }

  attempt.finish("success");

  // The old token is no longer valid for the new credentials.
  await clearAuthCookies();

  return NextResponse.json(
    {
      success: true,
      data: null,
      message: "Password updated. Please sign in again.",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
