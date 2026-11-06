import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export { TableSkeleton, TableSkeletonRows } from "@/components/dashboard/table-states";

function Bar({ className }: { className?: string }) {
  return <Skeleton className={cn("bg-black/[0.06]", className)} />;
}

/** A Panel-shaped placeholder: title bar, then label/value pairs like DetailList. */
export function PanelSkeleton({
  rows = 3,
  columns = 2,
  className,
}: {
  rows?: number;
  columns?: 1 | 2;
  className?: string;
}) {
  return (
    <div className={cn("overflow-hidden rounded-xl border border-black/[0.06] bg-white shadow-xs", className)}>
      <div className="border-b border-black/[0.06] px-5 py-4">
        <Bar className="h-4 w-40" />
      </div>
      <div className={cn("grid gap-x-6 gap-y-5 p-5", columns === 2 && "sm:grid-cols-2")}>
        {Array.from({ length: rows * columns }, (_, index) => (
          <div key={index} className="space-y-2">
            <Bar className="h-3 w-20" />
            <Bar className={cn("h-4", index % 3 === 0 ? "w-3/4" : index % 3 === 1 ? "w-1/2" : "w-2/3")} />
          </div>
        ))}
      </div>
    </div>
  );
}

/** PageHeader-shaped placeholder: back link, title, description and an action. */
export function PageHeaderSkeleton({ back = true, actions = true }: { back?: boolean; actions?: boolean }) {
  return (
    <div className="space-y-3">
      {back ? <Bar className="h-4 w-28" /> : null}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <Bar className="h-7 w-64 max-w-full" />
          <Bar className="h-4 w-96 max-w-full" />
        </div>
        {actions ? <Bar className="h-8 w-28 rounded-lg" /> : null}
      </div>
    </div>
  );
}

/**
 * The loading state of a record page (beneficiary, assessment, branch…):
 * the header, then a wide column of panels and a narrow side column, the
 * layout most detail pages use. Screen readers hear "Loading…" once.
 */
export function DetailSkeleton({
  header = true,
  side = true,
  className,
}: {
  /** Include the PageHeader placeholder; false when the real header is already shown. */
  header?: boolean;
  /** Include the narrow side column. */
  side?: boolean;
  className?: string;
}) {
  return (
    <div role="status" className={cn("space-y-6", className)}>
      <span className="sr-only">Loading…</span>
      <div aria-hidden="true" className="space-y-6">
        {header ? <PageHeaderSkeleton /> : null}
        <div className={cn("grid gap-6", side && "xl:grid-cols-3")}>
          <div className={cn("space-y-6", side && "xl:col-span-2")}>
            <PanelSkeleton rows={3} />
            <PanelSkeleton rows={2} />
          </div>
          {side ? (
            <div className="space-y-6">
              <PanelSkeleton rows={3} columns={1} />
              <PanelSkeleton rows={2} columns={1} />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
