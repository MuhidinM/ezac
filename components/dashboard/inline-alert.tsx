import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";

import { SignInAgainButton } from "@/components/auth/sign-in-again";
import { asksToSignInAgain } from "@/lib/api/errors";
import { cn } from "@/lib/utils";

const TONES = {
  error: { className: "border-red-200 bg-red-50 text-red-800", icon: AlertCircle },
  success: { className: "border-emerald-200 bg-emerald-50 text-emerald-800", icon: CheckCircle2 },
  warning: { className: "border-amber-200 bg-amber-50 text-amber-900", icon: TriangleAlert },
  info: { className: "border-sky-200 bg-sky-50 text-sky-900", icon: Info },
};

/**
 * A message box. An error whose text is the ended-session message ("…Sign in
 * again.") gets a "Sign in again" button automatically when it has no other
 * action; ErrorAlert (error-alert.tsx) does the same from the error itself
 * and adds Retry and the support reference.
 */
export function InlineAlert({
  tone = "error",
  title,
  children,
  action,
  reference,
  className,
}: {
  tone?: keyof typeof TONES;
  title?: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  /** Request id to quote to support ("Reference: 4f2a…"). */
  reference?: string | null;
  className?: string;
}) {
  const { className: toneClass, icon: Icon } = TONES[tone];
  const signInAgain =
    tone === "error" && !action && (asksToSignInAgain(children) || asksToSignInAgain(title));
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex flex-wrap items-start gap-3 rounded-lg border px-4 py-3 text-sm",
        toneClass,
        className,
      )}
    >
      <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0 flex-1 basis-48">
        {title ? <p className="font-medium">{title}</p> : null}
        {children ? <div className={title ? "mt-0.5 opacity-90" : undefined}>{children}</div> : null}
        {reference ? (
          <p className="mt-1 text-xs opacity-80">
            Reference: <span className="font-mono select-all">{reference}</span>
          </p>
        ) : null}
      </div>
      {signInAgain ? <SignInAgainButton /> : action}
    </div>
  );
}
