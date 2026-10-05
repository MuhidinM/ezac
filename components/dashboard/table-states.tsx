import type { ReactNode } from "react";

import { TableCell, TableRow } from "@/components/ui/table";

export function TableMessageRow({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={colSpan} className="py-12 text-center text-sm text-black/50">
        {children}
      </TableCell>
    </TableRow>
  );
}

export function TableSkeletonRows({ colSpan, rows = 5 }: { colSpan: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, index) => (
        <TableRow key={index} className="hover:bg-transparent">
          <TableCell colSpan={colSpan} className="py-3.5">
            <div className="h-4 animate-pulse rounded bg-black/[0.05]" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}
