import type { ReactNode } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export function TableMessageRow({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={colSpan} className="py-12 text-center text-sm text-black/50">
        {children}
      </TableCell>
    </TableRow>
  );
}

// Varied bar widths so the placeholder reads as a table, not a striped block.
const CELL_WIDTHS = ["w-3/4", "w-1/2", "w-2/3", "w-5/12", "w-7/12", "w-1/3"];

function cellWidth(row: number, column: number) {
  return CELL_WIDTHS[(row * 2 + column * 3) % CELL_WIDTHS.length];
}

/**
 * Placeholder rows inside an existing <TableBody> while a list loads: one bar
 * per column, so the columns line up with the header. `colSpan` is the
 * table's column count.
 */
export function TableSkeletonRows({ colSpan, rows = 5 }: { colSpan: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }, (_, row) => (
        // The first row says "Loading…" to screen readers; the rest are only visual.
        <TableRow key={row} aria-hidden={row > 0 ? true : undefined} className="hover:bg-transparent">
          {Array.from({ length: Math.max(1, colSpan) }, (_, column) => (
            <TableCell key={column} className={cn("py-3.5", column === 0 && "pl-5")}>
              {row === 0 && column === 0 ? <span className="sr-only">Loading…</span> : null}
              <Skeleton className={cn("h-4 bg-black/[0.06]", column === 0 ? "w-4/5" : cellWidth(row, column))} />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

/**
 * A whole table's placeholder (header + rows), for a page that has nothing
 * to show yet. Pass the real column titles when known so the layout doesn't
 * jump when data arrives.
 */
export function TableSkeleton({
  columns = 4,
  rows = 6,
  className,
}: {
  /** Column titles, or how many columns. */
  columns?: string[] | number;
  rows?: number;
  className?: string;
}) {
  const titles = typeof columns === "number" ? Array.from({ length: columns }, () => null) : columns;
  return (
    <div role="status" className={className}>
      <span className="sr-only">Loading…</span>
      <Table aria-hidden="true">
        <TableHeader>
          <TableRow className="bg-black/[0.015] hover:bg-transparent">
            {titles.map((title, index) => (
              <TableHead key={index} className={index === 0 ? "pl-5" : undefined}>
                {title ?? <Skeleton className="h-3 w-16 bg-black/[0.06]" />}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableSkeletonRows colSpan={titles.length} rows={rows} />
        </TableBody>
      </Table>
    </div>
  );
}
