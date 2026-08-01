"use client";

import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { useState, type ReactNode } from "react";

type DynamicListProps<T> = {
  items: T[];
  maxItems?: number;
  addLabel?: string;
  canRemove?: (index: number) => boolean;
  onAdd: () => void;
  onRemove: (index: number) => void;
  renderMobileCard: (item: T, index: number) => ReactNode;
  renderTableRow: (item: T, index: number) => ReactNode;
  tableHeaders: ReactNode;
};

export function DynamicList<T>({
  items,
  maxItems = 10,
  addLabel = "Add Item",
  canRemove = (i) => i > 0,
  onAdd,
  onRemove,
  renderMobileCard,
  renderTableRow,
  tableHeaders,
}: DynamicListProps<T>) {
  return (
    <div className="space-y-3">
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[#1a3d2b]/10 text-[#5a6e62]">
              {tableHeaders}
              <th className="pb-2" />
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index} className="border-b border-[#1a3d2b]/5">
                {renderTableRow(item, index)}
                <td className="py-2">
                  {canRemove(index) ? (
                    <button
                      type="button"
                      onClick={() => onRemove(index)}
                      className="text-[#c0392b]"
                      aria-label={`Remove item ${index + 1}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {items.map((item, index) => (
          <DynamicListCard
            key={index}
            index={index}
            canRemove={canRemove(index)}
            onRemove={() => onRemove(index)}
          >
            {renderMobileCard(item, index)}
          </DynamicListCard>
        ))}
      </div>

      {items.length < maxItems ? (
        <button
          type="button"
          onClick={onAdd}
          className="flex min-h-[48px] items-center gap-2 rounded-xl border-2 border-dashed border-[#1a3d2b]/30 px-4 py-2 text-base font-medium text-[#1a3d2b] transition hover:border-[#1a3d2b]/50 hover:bg-[#1a3d2b]/5"
        >
          <Plus className="h-5 w-5" /> {addLabel}
        </button>
      ) : null}
    </div>
  );
}

function DynamicListCard({
  index,
  canRemove,
  onRemove,
  children,
}: {
  index: number;
  canRemove: boolean;
  onRemove: () => void;
  children: ReactNode;
}) {
  const [expanded, setExpanded] = useState(index === 0);

  return (
    <div className="rounded-xl border border-[#1a3d2b]/15 bg-[#f7f3ec]/50">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="font-medium text-[#1a3d2b]">Item {index + 1}</span>
        <ChevronDown
          className={`h-5 w-5 text-[#5a6e62] transition ${expanded ? "rotate-180" : ""}`}
        />
      </button>
      {expanded ? (
        <div className="space-y-3 border-t border-[#1a3d2b]/10 p-4">
          {children}
          {canRemove ? (
            <button
              type="button"
              onClick={onRemove}
              className="flex items-center gap-1 text-sm text-[#c0392b]"
            >
              <Trash2 className="h-4 w-4" /> Remove
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
