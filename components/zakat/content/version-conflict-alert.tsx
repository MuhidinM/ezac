"use client";

import { RotateCw } from "lucide-react";

import { InlineAlert } from "@/components/dashboard/inline-alert";
import { Button } from "@/components/ui/button";
import { VERSION_CONFLICT_MESSAGE } from "@/lib/api/errors";

/** A save was refused because someone else changed the record first (409 VERSION_CONFLICT). */
export function VersionConflictAlert({ onReload }: { onReload: () => void }) {
  return (
    <InlineAlert
      tone="warning"
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
