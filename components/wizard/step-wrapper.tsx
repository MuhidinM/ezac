import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

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
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#007050]/[0.08] text-[#007050]">
          <Icon className="size-4.5" aria-hidden />
        </span>
        <div>
          <h2 className="text-base font-semibold text-[#001539]">{title}</h2>
          <p className="mt-0.5 text-sm text-black/55">{description}</p>
        </div>
      </div>
      <div>{children}</div>
    </div>
  );
}
