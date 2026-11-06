import { ApiError } from "@/lib/api/errors";

function sentence(text: string): string {
  const trimmed = text.trim();
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

/**
 * The problems to list for a refused password change: every field error the
 * server sent, or its single message. Empty when there is nothing to list.
 */
export function passwordProblemsFrom(error: unknown): string[] {
  if (!(error instanceof ApiError)) return [];
  const listed = error.errors.map((item) => item.message).filter(Boolean);
  return listed.length > 1 ? listed : [];
}

/** All password problems at once: one sentence, or a short list. */
export function PasswordProblems({ problems }: { problems: string[] }) {
  if (problems.length === 1) return <>{sentence(problems[0])}</>;
  return (
    <>
      <p>Your new password needs a few changes:</p>
      <ul className="mt-1 list-disc space-y-0.5 pl-5">
        {problems.map((problem) => (
          <li key={problem}>{sentence(problem)}</li>
        ))}
      </ul>
    </>
  );
}
