import { InstitutionRegistrationUnavailable } from "./unavailable";

// Was <NgoRegistrationWizard /> from "@/components/ngo-registration/ngo-registration-wizard".
// It is switched off until it submits to the backend; see ./unavailable.tsx.
export default function InstitutionRegisterPage() {
  return <InstitutionRegistrationUnavailable />;
}
