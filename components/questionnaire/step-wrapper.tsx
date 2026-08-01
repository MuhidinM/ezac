import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type StepWrapperProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  children: ReactNode;
};

export function StepWrapper({
  title,
  description,
  icon: Icon,
  children,
}: StepWrapperProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[rgba(0,112,80,0.1)]">
          <Icon className="h-6 w-6 text-[#007050]" aria-hidden />
        </div>
        <div>
          <h2 className="font-serif-display text-2xl tracking-tight text-[#001539] sm:text-3xl">
            {title}
          </h2>
          <p className="mt-1 text-base text-black/60">{description}</p>
        </div>
      </div>
      <div>{children}</div>
    </div>
  );
}
