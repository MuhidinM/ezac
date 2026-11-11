"use client";

import { RotateCw } from "lucide-react";

import { InlineAlert } from "@/components/dashboard/inline-alert";
import { Button } from "@/components/ui/button";
import { VERSION_CONFLICT_MESSAGE } from "@/lib/api/errors";

/** Someone else saved the record first (409 VERSION_CONFLICT): offer a reload. */
export function VersionConflictAlert({ onReload, className }: { onReload: () => void; className?: string }) {
  return (
    <InlineAlert
      tone="warning"
      className={className}
      action={
        <Button type="button" variant="outline" size="sm" onClick={onReload}>
          <RotateCw />
          Reload
        </Button>
      }
    >
      {VERSION_CONFLICT_MESSAGE}
    </InlineAlert>
  );
}
