import { SetPasswordStep } from "@/components/registration/set-password-step";

const MANUAL_STEPS = ["Identity", "Password"];

export default function ManualPasswordPage() {
  return (
    <SetPasswordStep
      registrationType="manual"
      steps={MANUAL_STEPS}
      currentStep={1}
      backHref="/dashboard/register/manual"
      successHref="/dashboard/beneficiary?registered=1"
    />
  );
}
