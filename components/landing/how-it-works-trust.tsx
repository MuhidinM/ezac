import { BadgeCheckIcon, IdCardIcon, LockIcon } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type TrustStep = {
  title: string;
  description: string;
  icon: LucideIcon;
};

const TRUST_STEPS: TrustStep[] = [
  {
    title: "100% Shari'ah Compliant",
    description:
      "Every campaign and fund flow is screened against approved Shari'ah governance standards.",
    icon: BadgeCheckIcon,
  },
  {
    title: "Fayda Verified Beneficiaries",
    description:
      "Aid disbursement targets validated recipients, reducing fraud and ensuring funds reach the right people.",
    icon: IdCardIcon,
  },
  {
    title: "Immutable Audit Logs",
    description:
      "Critical events are logged with tamper-evident records for transparent and secure accountability.",
    icon: LockIcon,
  },
];

export function HowItWorksTrust() {
  return (
    <section className="relative z-10 w-full border-t border-black/5 bg-[#ececec]">
      <div className="mx-auto max-w-7xl px-8 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <p
            className="text-[10px] uppercase tracking-[0.18em]"
            style={{ color: "#6F6F6F" }}
          >
            How It Works
          </p>
          <h2
            className="font-serif-display mt-3 text-4xl sm:text-5xl md:text-6xl"
            style={{
              color: "#001539",
              lineHeight: 1,
              letterSpacing: "-1.8px",
            }}
          >
            Transparency, Verification, Security
          </h2>
        </div>

        <div className="relative mx-auto mt-12 w-full max-w-6xl">
          <div className="grid gap-5 md:grid-cols-3 md:gap-6">
            {TRUST_STEPS.map(({ title, description, icon: Icon }, idx) => (
              <article
                key={title}
                className="rounded-3xl border border-black/5 bg-white p-2 shadow-xl shadow-black/5"
              >
                <div className="flex h-full flex-col rounded-2xl border border-black/5 bg-white p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <span
                      className="rounded-full border border-black/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em]"
                      style={{ color: "#6F6F6F" }}
                    >
                      Step {idx + 1}
                    </span>
                    <span className="rounded-full border border-black/10 p-2">
                      <Icon className="h-4 w-4" style={{ color: "#001539" }} />
                    </span>
                  </div>
                  <h3
                    className="font-serif-display text-2xl leading-tight"
                    style={{ color: "#001539", letterSpacing: "-0.5px" }}
                  >
                    {title}
                  </h3>
                  <p
                    className="mt-3 text-sm leading-relaxed"
                    style={{ color: "#6F6F6F" }}
                  >
                    {description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
