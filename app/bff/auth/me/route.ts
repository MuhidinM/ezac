import { withStaffAccess } from "@/lib/api/bff";
import { gatewayRequest } from "@/lib/api/gateway";
import type { MeProfile, UpdateMeBody } from "@/lib/api/types";
import { authError } from "@/lib/auth/http";

// Your own profile: any signed-in account may read it, including during the
// forced password change and before roles are known. withStaffAccess answers
// 401, or 503 when the sign-in service is down.
const OWN_PROFILE = { access: "signed-in", label: "auth/me" } as const;

export async function GET() {
  return withStaffAccess(
    (accessToken) => gatewayRequest<MeProfile>("/api/auth/v1/me", { accessToken, label: "auth/me" }),
    OWN_PROFILE,
  );
}

export async function PATCH(request: Request) {
  let body: UpdateMeBody;

  try {
    body = (await request.json()) as UpdateMeBody;
  } catch {
    return authError(400, "Invalid request body");
  }

  // The API takes only the fields that change; anything left out stays as it is.
  const payload: UpdateMeBody = {};
  if (typeof body?.displayName === "string") {
    const displayName = body.displayName.trim();
    // A blank name also blanks the officer's name on their branch record and
    // on every decision they sign.
    if (!displayName) {
      return authError(400, "Enter your name.");
    }
    if (displayName.length > 120) {
      return authError(400, "Keep the display name under 120 characters.");
    }
    payload.displayName = displayName;
  }
  if (body?.phone !== undefined) {
    // The phone is how staff sign in. The gateway answers 200 but keeps the
    // old number (and the old sign-in), so refuse it rather than report a
    // change that never happened.
    return authError(400, "Your sign-in phone is managed by an administrator and can't be changed here.");
  }

  if (Object.keys(payload).length === 0) {
    return authError(400, "No profile fields to update");
  }

  return withStaffAccess(
    (accessToken) =>
      gatewayRequest<MeProfile>("/api/auth/v1/me", {
        method: "PATCH",
        body: JSON.stringify(payload),
        accessToken,
        label: "auth/me",
      }),
    OWN_PROFILE,
  );
}
