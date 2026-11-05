import { withStaffAccess } from "@/lib/api/bff";
import { gatewayRequest } from "@/lib/api/gateway";
import type { MeProfile, UpdateMeBody } from "@/lib/api/types";
import { authError } from "@/lib/auth/http";
import { isValidEthiopianPhone, normalizePhoneToE164 } from "@/lib/registration/phone";

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
    if (displayName.length > 120) {
      return authError(400, "Keep the display name under 120 characters.");
    }
    payload.displayName = displayName;
  }
  if (typeof body?.phone === "string") {
    const phone = body.phone.trim();
    // The phone is also how many staff sign in, so never send a blank or
    // malformed one upstream.
    if (!phone) {
      return authError(400, "Enter a phone number. To keep the current one, leave the field as it is.");
    }
    if (!isValidEthiopianPhone(phone)) {
      return authError(400, "Enter an Ethiopian mobile number, for example +251911223344.");
    }
    payload.phone = normalizePhoneToE164(phone);
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
