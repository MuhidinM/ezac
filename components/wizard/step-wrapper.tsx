import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { typeScale } from "@/components/backoffice/type-scale";
import { cn } from "@/lib/utils";

type StepWrapperProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  children: ReactNode;
};

export function StepWrapper({ title, description, icon: Icon, children }: StepWrapperProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 border-b border-black/[0.06] pb-4">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand/[0.08] text-brand">
          <Icon className="size-4.5" aria-hidden />
        </span>
        <div>
          <h2 className={typeScale.section}>{title}</h2>
          <p className={cn("mt-0.5", typeScale.description)}>{description}</p>
        </div>
      </div>
      <div>{children}</div>
    </div>
  );
}
