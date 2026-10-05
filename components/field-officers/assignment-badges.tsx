import { MapPin, Store } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { StaffAssignment } from "@/lib/api/backoffice-types";

export function assignmentLabel(assignment: StaffAssignment) {
  if (assignment.branchId) {
    return assignment.branchName?.trim() || `Branch #${assignment.branchId}`;
  }
  return assignment.region ? `${assignment.region} region` : "Unassigned";
}

/** Active assignments as compact badges; inactive ones are left out. */
export function AssignmentBadges({ assignments }: { assignments: StaffAssignment[] }) {
  const active = assignments.filter((assignment) => assignment.active);

  if (active.length === 0) {
    return <span className="text-sm text-black/40">No active assignment</span>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {active.map((assignment) => (
        <Badge key={assignment.id} tone={assignment.branchId ? "brand" : "navy"}>
          {assignment.branchId ? <Store /> : <MapPin />}
          {assignmentLabel(assignment)}
        </Badge>
      ))}
    </div>
  );
}
