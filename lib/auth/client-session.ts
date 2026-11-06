import { clearAllSubmitInputs } from "@/components/assessment/steps/step-submit";
import { clearDraft } from "@/components/ngo-registration/draft-storage";
import { resetSessionCache } from "@/lib/auth/use-session";
import { clearNotices } from "@/lib/backoffice/notice";
import { clearRegistrationSession, consumeRegistrationSuccessFlag } from "@/lib/registration/session";

// Several components can ask to leave at once (logout click, idle timer, a
// 401); only the first one runs.
let leaving = false;

/**
 * Written on every sign-out so other open dashboard tabs leave too (they get a
 * "storage" event); each write is a new value so the event always fires.
 */
export const SIGNED_OUT_KEY = "ezac_signed_out";

function tellOtherTabs() {
  try {
    window.localStorage.setItem(SIGNED_OUT_KEY, String(Date.now()));
  } catch {
    // Storage blocked: other tabs find out on their next request (401).
  }
}

/**
 * Forget everything this browser holds for the signed-in staff member: the
 * cached session (name, roles), the saved institution draft (TIN, national
 * ID, bank account), the registration setup tokens, the review notes kept for
 * a pending submit and any notice not yet shown (it can name a household).
 * Branch PCs are shared,
 * so the next person must not inherit any of it.
 */
export function clearClientSession(): void {
  resetSessionCache();
  try {
    clearDraft();
  } catch {
    // Storage blocked (private mode, policy): nothing was saved there either.
  }
  try {
    clearRegistrationSession();
    consumeRegistrationSuccessFlag();
  } catch {
    // Same as above.
  }
  // Both catch their own storage errors.
  clearAllSubmitInputs();
  clearNotices();
}

/**
 * Sign out from anywhere in the portal: clear browser state, ask the server to
 * drop the cookies, then load the sign-in page fresh (a hard navigation, so
 * no module state survives). If the request fails because the server is
 * unreachable, the page still leaves the dashboard.
 */
export async function signOut(options?: { reason?: "idle" }): Promise<void> {
  if (leaving) return;
  leaving = true;
  clearClientSession();
  tellOtherTabs();
  try {
    await fetch("/bff/auth/logout", { method: "POST", cache: "no-store", keepalive: true });
  } catch {
    // Offline or the server is down: still leave the dashboard.
  }
  window.location.replace(options?.reason ? `/login?reason=${options.reason}` : "/login");
}

/**
 * Another tab signed out: leave this one too, without a second logout call.
 */
export function leaveAfterSignOutElsewhere(): void {
  if (leaving) return;
  leaving = true;
  clearClientSession();
  window.location.replace("/login");
}

/**
 * The server says the session is over (401): clear browser state and go to
 * sign-in, coming back to `path` afterwards. With `reason: "ended"` the
 * sign-in page says the session ended, for a form the user was filling in.
 */
export async function sendToSignIn(path?: string, options?: { reason?: "ended" }): Promise<void> {
  if (leaving) return;
  leaving = true;
  clearClientSession();
  tellOtherTabs();
  try {
    // Drops any cookie the server didn't already clear, so /login doesn't
    // bounce straight back to the dashboard.
    await fetch("/bff/auth/logout", { method: "POST", cache: "no-store", keepalive: true });
  } catch {
    // Ignore; the sign-in page still loads.
  }
  const query = new URLSearchParams();
  if (path?.startsWith("/dashboard")) query.set("redirect", path);
  if (options?.reason) query.set("reason", options.reason);
  const search = query.toString();
  window.location.replace(search ? `/login?${search}` : "/login");
}
