import { SetPasswordStep } from "@/components/registration/set-password-step";
import { REGISTRATION_STEPS } from "@/lib/registration/constants";

export default function ManualPasswordPage() {
  return (
    <SetPasswordStep
      registrationType="manual"
      steps={REGISTRATION_STEPS}
      currentStep={2}
      successHref="/dashboard/beneficiary?registered=1"
    />
  );
}
