"use client";

import {
  type AssessmentEvent,
  type EventTone,
  eventNotes,
  eventTitle,
  eventTone,
} from "@/components/assessment/assessment-events";
import { ErrorAlert } from "@/components/dashboard/error-alert";
import { useResource } from "@/lib/api/use-resource";
import { formatDateTime } from "@/lib/beneficiary/format";
import { cn } from "@/lib/utils";

const DOT: Record<EventTone, string> = {
  success: "bg-brand",
  warning: "bg-amber-500",
  danger: "bg-rose-500",
  neutral: "bg-navy/40",
};

/** Every decision on the assessment, oldest first, as the backend recorded it. */
export function DecisionHistory({ assessmentId }: { assessmentId: string }) {
  const { data, error, isLoading, reload } = useResource<AssessmentEvent[]>(
    `/bff/backoffice/assessments/${encodeURIComponent(assessmentId)}/events`,
  );
  const events = data ?? [];

  if (error) {
    return (
      <div className="p-5">
        <ErrorAlert error={error} onRetry={reload} fallback="The decision history couldn't be loaded." />
      </div>
    );
  }

  if (isLoading && events.length === 0) {
    return <div className="m-5 h-40 animate-pulse rounded-lg bg-black/[0.04]" role="status" aria-label="Loading" />;
  }

  if (events.length === 0) {
    return <p className="p-5 text-sm text-black/60">Nothing recorded yet.</p>;
  }

  return (
    <ol className="space-y-5 p-5">
      {events.map((event, index) => {
        const notes = eventNotes(event);
        return (
          <li key={`${event.type}-${event.occurredAt ?? index}-${index}`} className="relative flex gap-3">
            {index < events.length - 1 ? (
              <span className="absolute top-4 bottom-[-1.25rem] left-[5px] w-px bg-black/10" aria-hidden />
            ) : null}
            <span className={cn("relative mt-1.5 size-2.5 shrink-0 rounded-full", DOT[eventTone(event.type)])} aria-hidden />
            <div className="min-w-0">
              <p className="text-sm font-medium text-navy">{eventTitle(event.type)}</p>
              <p className="text-xs text-black/60">
                {[event.actorName, event.occurredAt ? formatDateTime(event.occurredAt) : null].filter(Boolean).join(" · ")}
              </p>
              {notes.map((note, noteIndex) => (
                <p key={noteIndex} className="mt-1 text-sm whitespace-pre-line text-black/70">
                  {note}
                </p>
              ))}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
