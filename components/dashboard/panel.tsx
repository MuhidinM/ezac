import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type PanelProps = {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Drop body padding, e.g. for edge-to-edge tables. */
  flush?: boolean;
};

/** White card used for every content block in the dashboard. */
export function Panel({ title, description, actions, children, className, flush }: PanelProps) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-xl border border-black/[0.06] bg-white shadow-xs",
        className,
      )}
    >
      {title || actions ? (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-black/[0.06] px-5 py-4">
          <div className="min-w-0">
            {title ? <h2 className="text-sm font-semibold text-[#001539]">{title}</h2> : null}
            {description ? <p className="mt-0.5 text-sm text-black/55">{description}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </header>
      ) : null}
      <div className={flush ? undefined : "p-5"}>{children}</div>
    </section>
  );
}

/** Label/value pairs inside a panel. */
export function DetailList({
  items,
  columns = 3,
}: {
  items: { label: string; value: ReactNode }[];
  columns?: 2 | 3 | 4;
}) {
  return (
    <dl
      className={cn(
        "grid gap-x-6 gap-y-4 sm:grid-cols-2",
        columns === 3 && "lg:grid-cols-3",
        columns === 4 && "lg:grid-cols-4",
      )}
    >
      {items.map((item) => (
        <div key={item.label} className="min-w-0">
          <dt className="text-xs font-medium text-black/45">{item.label}</dt>
          <dd className="mt-1 text-sm break-words text-[#001539]">
            {item.value === null || item.value === undefined || item.value === ""
              ? "—"
              : item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
