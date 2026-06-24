import { SetPasswordStep } from "@/components/registration/set-password-step";

const INSTITUTION_STEPS = ["Details", "Password", "Documents"];

export default function InstitutionPasswordPage() {
  return (
    <SetPasswordStep
      registrationType="institution"
      steps={INSTITUTION_STEPS}
      currentStep={1}
      backHref="/dashboard/register/institution"
      successHref="/dashboard/register/institution/documents"
    />
  );
}
