/**
 * The branch officer's contact details. The backend now sends `fullName`, `phone`
 * and `email`; older responses used `officerName` / `branchFullName`,
 * `branchPhone` and `branchEmail`. Read whichever is present.
 */
type BranchContactFields = {
  fullName?: string | null;
  officerName?: string | null;
  branchFullName?: string | null;
  phone?: string | null;
  branchPhone?: string | null;
  email?: string | null;
  branchEmail?: string | null;
};

export function branchContact(branch: BranchContactFields) {
  return {
    fullName: branch.fullName ?? branch.officerName ?? branch.branchFullName ?? null,
    phone: branch.phone ?? branch.branchPhone ?? null,
    email: branch.email ?? branch.branchEmail ?? null,
  };
}
