import { InstitutionRegistrationUnavailable } from "../unavailable";

// Institution registration is switched off (see ../unavailable.tsx). This step was
// <InstitutionDocumentsStep /> from "@/components/registration/institution-documents-step".
export default function InstitutionDocumentsPage() {
  return <InstitutionRegistrationUnavailable />;
}
