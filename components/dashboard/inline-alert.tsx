import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";

import { cn } from "@/lib/utils";

const TONES = {
  error: { className: "border-red-200 bg-red-50 text-red-800", icon: AlertCircle },
  success: { className: "border-emerald-200 bg-emerald-50 text-emerald-800", icon: CheckCircle2 },
  warning: { className: "border-amber-200 bg-amber-50 text-amber-900", icon: TriangleAlert },
  info: { className: "border-sky-200 bg-sky-50 text-sky-900", icon: Info },
};

export function InlineAlert({
  tone = "error",
  title,
  children,
  action,
  className,
}: {
  tone?: keyof typeof TONES;
  title?: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  const { className: toneClass, icon: Icon } = TONES[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-3 rounded-lg border px-4 py-3 text-sm",
        toneClass,
        className,
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0 flex-1">
        {title ? <p className="font-medium">{title}</p> : null}
        {children ? <div className={title ? "mt-0.5 opacity-90" : undefined}>{children}</div> : null}
      </div>
      {action}
    </div>
  );
}
