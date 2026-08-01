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
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#1a3d2b]/10">
          <Icon className="h-6 w-6 text-[#1a3d2b]" aria-hidden />
        </div>
        <div>
          <h2 className="font-playfair text-2xl font-semibold text-[#1a3d2b] sm:text-3xl">
            {title}
          </h2>
          <p className="mt-1 text-base text-[#5a6e62]">{description}</p>
        </div>
      </div>
      <div className="rounded-2xl border border-[#1a3d2b]/10 bg-white p-5 shadow-sm sm:p-6">
        {children}
      </div>
    </div>
  );
}
