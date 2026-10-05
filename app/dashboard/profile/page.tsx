import { PageHeader } from "@/components/dashboard/page-header";
import { ProfileForm } from "@/components/profile/profile-form";

export default function DashboardProfilePage() {
  return (
    <section className="space-y-6">
      <PageHeader title="Profile & security" description="Your account details and password." />
      <ProfileForm />
    </section>
  );
}
