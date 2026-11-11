import type { ReactNode } from "react";

/**
 * Who did something: the person's name when the API sends one, otherwise
 * their staff account id, so the record still says who acted. The API sends
 * names (`createdByName`, `updatedByName`, `actorName`) since 11 November;
 * older records only have the id. Null when nobody is recorded, so a
 * DetailList shows "—".
 */
export function staffRef(id: string | null | undefined, name?: string | null): ReactNode {
  if (name?.trim()) return name.trim();
  if (!id?.trim()) return null;
  if (id === "system") return "System (automatic)";
  return (
    <span className="font-mono text-xs break-all" title="Staff account id. This record was saved before names were kept.">
      {id}
    </span>
  );
}
