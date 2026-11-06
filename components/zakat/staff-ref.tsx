import type { ReactNode } from "react";

/**
 * Who did something: the person's name when the API sends one, otherwise
 * their staff account id, so the record still says who acted. Names next to
 * ids are requested from the backend (docs/backend-go-live-requests.md §20,
 * §46). Null when nobody is recorded, so a DetailList shows "—".
 */
export function staffRef(id: string | null | undefined, name?: string | null): ReactNode {
  if (name?.trim()) return name.trim();
  if (!id?.trim()) return null;
  if (id === "system") return "System (automatic)";
  return (
    <span className="font-mono text-xs break-all" title="Staff account id. Names aren't sent by the server yet.">
      {id}
    </span>
  );
}
