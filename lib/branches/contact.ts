/**
 * The branch officer's contact details. Branch responses name them
 * `officerName` / `officerPhone` / `officerEmail` (detail and list), the branch
 * portal sends `fullName` / `phone` / `email`, and older responses used
 * `branchFullName`, `branchPhone` and `branchEmail`. Read whichever is present.
 */
type BranchContactFields = {
  fullName?: string | null;
  officerName?: string | null;
  branchFullName?: string | null;
  phone?: string | null;
  officerPhone?: string | null;
  branchPhone?: string | null;
  email?: string | null;
  officerEmail?: string | null;
  branchEmail?: string | null;
};

export function branchContact(branch: BranchContactFields) {
  return {
    fullName: branch.fullName ?? branch.officerName ?? branch.branchFullName ?? null,
    phone: branch.phone ?? branch.officerPhone ?? branch.branchPhone ?? null,
    email: branch.email ?? branch.officerEmail ?? branch.branchEmail ?? null,
  };
}
