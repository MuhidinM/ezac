import type { Metadata } from "next";
import { SitePage } from "@/components/site/site-page";
import { ImpactMapTeaser } from "@/components/landing/impact-map-teaser";
import { Section, SectionHeading, CtaBand } from "@/components/site/sections";

export const metadata: Metadata = {
  title: "Live Dashboard — EZAC",
  description:
    "Real-time, audited figures on Zakat collected, families supported, and funds disbursed across Ethiopia.",
};

const STATS = [
  { value: "ETB 45.2M", label: "Zakat collected this season" },
  { value: "12,450", label: "Families supported" },
  { value: "847", label: "Waqf assets registered" },
  { value: "ETB 8.4M", label: "Disbursed this week" },
  { value: "3,210", label: "Diaspora donors" },
  { value: "124", label: "Active crowdfunding projects" },
];

export default function LiveDashboardPage() {
  return (
    <SitePage
      eyebrow="Transparency & Impact"
      title="Live"
      accent="dashboard"
      intro="Public, audited, and traceable. Follow Zakat and Waqf flows across Ethiopia in real time — every figure reconciled and every birr accounted for."
    >
      <Section>
        <SectionHeading
          eyebrow="At a glance"
          title="The numbers, in real time"
          intro="Indicative figures refreshed continuously from reconciled settlement data."
        />
        <div className="mt-12 grid grid-cols-2 gap-4 lg:grid-cols-3">
          {STATS.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm"
            >
              <p
                className="font-serif-display text-3xl sm:text-4xl"
                style={{ color: "#007050", letterSpacing: "-1px" }}
              >
                {s.value}
              </p>
              <p
                className="mt-2 text-xs uppercase tracking-[0.12em]"
                style={{ color: "#6F6F6F" }}
              >
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </Section>
      <ImpactMapTeaser />
      <CtaBand
        title="Want the detail behind the numbers?"
        body="Download audited impact reports or get in touch with our transparency office."
        primary={{ label: "View impact reports", href: "/transparency/reports" }}
        secondary={{ label: "Contact us", href: "/contact" }}
      />
    </SitePage>
  );
}
