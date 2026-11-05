import { cn } from "@/lib/utils";

/**
 * "Reference: abc123". Support can match it to the server log entry, so the
 * page never has to show the raw error. Renders nothing without a digest
 * (errors thrown in the browser have none).
 */
export function ErrorReference({ digest, className }: { digest: string | null; className?: string }) {
  if (!digest) return null;
  return (
    <p className={cn("text-xs", className)} style={{ color: "#6F6F6F" }}>
      Reference: <span className="font-mono select-all" style={{ color: "#001539" }}>{digest}</span>
    </p>
  );
}
