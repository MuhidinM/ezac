/**
 * Pure rules for the Zakat settings page (payment settings, home figures,
 * Zakat al-Fitr seasons), kept apart so they are unit-tested.
 */

import { cleanReceivingAccount, receivingAccountProblem } from "@/lib/zakat/payments";

/** Today's date in Addis Ababa (YYYY-MM-DD), whatever the browser's clock zone. */
export function addisToday(now: number = Date.now()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Addis_Ababa" }).format(new Date(now));
}

/**
 * The receiving account to send on save. payment-service returns it masked
 * ("*********7357") and keeps the stored account when that value comes back,
 * so an untouched field is sent as it was read.
 */
export function receivingAccountToSend(input: string, stored: string | null): { value: string | null; changed: boolean; problem: string | null } {
  const unchanged = input.trim() === (stored ?? "").trim();
  if (unchanged) return { value: stored, changed: false, problem: null };
  return { value: cleanReceivingAccount(input) || null, changed: true, problem: receivingAccountProblem(input) };
}

export type SeasonStatus = "upcoming" | "open" | "closed";

export type SeasonDeletion =
  /** An open season can't be deleted (the server answers 409). */
  | { allowed: false; why: string }
  /** `force` (with a reason) is needed for a season that has ended. */
  | { allowed: true; force: boolean };

/**
 * How a Zakat al-Fitr season can be deleted: one that hasn't started goes
 * without more, an ended one needs force and a reason, an open one never.
 */
export function seasonDeletion(status: SeasonStatus | string): SeasonDeletion {
  if (status === "open") return { allowed: false, why: "An open season can't be deleted." };
  return { allowed: true, force: status === "closed" };
}

export const SEASON_DELETE_REASON_MAX = 500;

/** The zakat-admin path that deletes a season. */
export function seasonDeletePath(hijriYear: number, force: boolean, reason: string): string {
  const base = `/bff/zakat-admin/zakat-al-fitr/${encodeURIComponent(String(hijriYear))}`;
  if (!force) return base;
  const params = new URLSearchParams({ force: "true", reason: reason.trim() });
  return `${base}?${params}`;
}

/**
 * Why an offline-figures change can't be sent, per field, or an empty object.
 * The note says where the figures come from; the as-of date can't be in the future.
 */
export function homeFiguresProblems(input: { households: string; note: string; asOfDate: string }, today: string): Record<string, string> {
  const problems: Record<string, string> = {};
  if (input.households.trim() && !Number.isInteger(Number(input.households))) problems.offlineBeneficiaries = "Enter a whole number of households.";
  if (input.note.trim().length < 10) problems.note = "Say where these figures come from (at least 10 characters).";
  if (!input.asOfDate) problems.asOfDate = "Enter the date the figures are counted to.";
  else if (input.asOfDate > today) problems.asOfDate = "Can't be in the future.";
  return problems;
}
