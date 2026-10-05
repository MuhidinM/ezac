import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

type ListPaginationProps = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  disabled?: boolean;
  onPageChange: (page: number) => void;
};

export function ListPagination({
  page,
  pageSize,
  totalItems,
  totalPages,
  disabled,
  onPageChange,
}: ListPaginationProps) {
  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/[0.06] px-5 py-3">
      <p className="text-sm text-black/55 tabular-nums">
        {totalItems === 0
          ? "No results"
          : `${start}–${end} of ${totalItems.toLocaleString()}`}
      </p>
      <div className="flex items-center gap-2">
        <span className="text-sm text-black/55 tabular-nums">
          Page {page} of {Math.max(1, totalPages)}
        </span>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Previous page"
          disabled={disabled || page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Next page"
          disabled={disabled || page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}
