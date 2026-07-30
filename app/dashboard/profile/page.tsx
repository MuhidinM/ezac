import { ProfileForm } from "@/components/profile/profile-form";

export default function DashboardProfilePage() {
  return (
    <section className="space-y-5">
      <div>
        <h1 className="font-serif-display text-4xl tracking-tight text-[#001539]">
          Profile
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-black/60">
          Manage your account details and password.
        </p>
      </div>
      <ProfileForm />
    </section>
  );
}
