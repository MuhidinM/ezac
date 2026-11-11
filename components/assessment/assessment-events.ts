import { OFFICER_RECOMMENDATION, labelFor } from "@/lib/backoffice/options";
import { formatDate } from "@/lib/backoffice/format";

/** One step of an assessment's decision history (`GET /assessments/{id}/events`, oldest first). */
export type AssessmentEvent = {
  type: string;
  occurredAt: string | null;
  actorId?: string | null;
  actorName?: string | null;
  actorRole?: string | null;
  comment?: string | null;
  details?: Record<string, unknown> | null;
};

export type EventTone = "success" | "warning" | "danger" | "neutral";

const EVENTS: Record<string, { title: string; tone: EventTone }> = {
  CREATED: { title: "Assessment started", tone: "neutral" },
  SUBMITTED: { title: "Submitted for branch review", tone: "neutral" },
  RESUBMITTED: { title: "Corrected and submitted again", tone: "neutral" },
  RETURNED: { title: "Returned to the officer by the branch", tone: "warning" },
  APPROVED: { title: "Approved by the branch", tone: "success" },
  REJECTED: { title: "Rejected by the branch", tone: "danger" },
  DEFERRED: { title: "Deferred by the branch", tone: "warning" },
  CANCELLED: { title: "Cancelled", tone: "danger" },
  REASSIGNED: { title: "Moved to another field officer", tone: "neutral" },
  SENT_BACK_BY_ADMIN: { title: "Sent back by head office", tone: "warning" },
  POOLED: { title: "Added to the disbursement pool", tone: "success" },
  POOL_DECLINED: { title: "Not added to the pool", tone: "danger" },
  POOL_REMOVED: { title: "Removed from the pool", tone: "danger" },
  DISBURSED: { title: "Paid out", tone: "success" },
};

function humanize(code: string) {
  const words = code.replaceAll("_", " ").toLowerCase().trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function eventTitle(type: string): string {
  return EVENTS[type]?.title ?? humanize(type);
}

export function eventTone(type: string): EventTone {
  return EVENTS[type]?.tone ?? "neutral";
}

function textOf(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/** The plain-language lines under an event: recommendations, dates and the comment or reason. */
export function eventNotes(event: AssessmentEvent): string[] {
  const details = event.details ?? {};
  const notes: string[] = [];
  if (event.type === "SUBMITTED" || event.type === "RESUBMITTED") {
    const officer = textOf(details.officerRecommendation);
    const system = textOf(details.systemRecommendation);
    const parts = [
      officer ? `Officer recommends ${labelFor(OFFICER_RECOMMENDATION, officer).toLowerCase()}` : null,
      system ? `system recommends ${labelFor(OFFICER_RECOMMENDATION, system).toLowerCase()}` : null,
    ].filter((part): part is string => !!part);
    if (parts.length) {
      const line = parts.join("; ");
      notes.push(`${line.charAt(0).toUpperCase()}${line.slice(1)}.`);
    }
  }
  if (event.type === "DEFERRED") {
    const until = textOf(details.deferredUntil);
    if (until) notes.push(`Look again from ${formatDate(until)}.`);
  }
  if (event.type === "REASSIGNED") {
    const from = textOf(details.fromOfficerName);
    const to = textOf(details.toOfficerName);
    if (from && to) notes.push(`From ${from} to ${to}.`);
    else if (to) notes.push(`To ${to}.`);
    else if (from) notes.push(`From ${from}.`);
  }
  const comment = textOf(event.comment) ?? textOf(details.reason) ?? textOf(details.comment);
  if (comment) notes.push(comment);
  return notes;
}
