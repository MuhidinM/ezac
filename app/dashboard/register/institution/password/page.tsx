import { InstitutionRegistrationUnavailable } from "../unavailable";

// Institution registration is switched off (see ../unavailable.tsx). This step was:
//   <SetPasswordStep registrationType="institution" steps={["Details", "Password", "Documents"]}
//     currentStep={1} successHref="/dashboard/register/institution/documents" />
// from "@/components/registration/set-password-step".
export default function InstitutionPasswordPage() {
  return <InstitutionRegistrationUnavailable />;
}
