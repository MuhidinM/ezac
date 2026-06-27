import type { Metadata } from "next";
import {
  BarChart3Icon,
  LandmarkIcon,
  ShieldCheckIcon,
  UsersIcon,
} from "lucide-react";
import { SitePage } from "@/components/site/site-page";
import {
  CtaBand,
  FeatureGrid,
  Section,
  SectionHeading,
} from "@/components/site/sections";

export const metadata: Metadata = {
  title: "Governance & Majlis — EZAC",
  description:
    "How the Ethiopian Zakat & Awqaf Commission is governed — the Majlis, oversight structure, and accountability framework.",
};

const PILLARS = [
  {
    icon: LandmarkIcon,
    title: "The Majlis",
    description:
      "The Supreme Council of Islamic Affairs provides religious authority and strategic direction for the Commission.",
  },
  {
    icon: UsersIcon,
    title: "Board of Commissioners",
    description:
      "An appointed board sets policy, approves budgets, and is accountable for the Commission's mandate.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Independent oversight",
    description:
      "External auditors and a risk committee review controls, disbursement, and fund integrity.",
  },
  {
    icon: BarChart3Icon,
    title: "Public accountability",
    description:
      "Audited figures and impact reports are published openly so the public can hold us to account.",
  },
];

export default function GovernancePage() {
  return (
    <SitePage
      eyebrow="About Us"
      title="Governance &"
      accent="Majlis"
      intro="EZAC operates under clear religious and institutional governance — combining the authority of the Majlis with modern, audited oversight."
    >
      <Section>
        <SectionHeading
          eyebrow="Structure"
          title="How EZAC is governed"
          intro="Authority, accountability, and transparency are built into every layer."
        />
        <FeatureGrid items={PILLARS} columns={2} />
      </Section>
      <Section muted>
        <div className="mx-auto max-w-3xl text-center">
          <h2
            className="font-serif-display text-2xl sm:text-3xl"
            style={{ color: "#001539", letterSpacing: "-0.5px" }}
          >
            Mandate &amp; accountability
          </h2>
          <p
            className="mt-4 text-base leading-relaxed"
            style={{ color: "#6F6F6F" }}
          >
            The Commission is mandated to collect, safeguard, invest, and
            distribute Zakat and Waqf in accordance with Shari&apos;ah and
            Ethiopian law. Every flow of funds is reconciled, independently
            audited, and
            reported publicly — so trust is earned through evidence, not
            assertion.
          </p>
        </div>
      </Section>
      <CtaBand
        title="Religious assurance you can rely on"
        body="Our Shari'ah Advisory Board reviews every ruling, product, and disbursement."
        primary={{ label: "Meet the Shari'ah board", href: "/about/shariah-board" }}
        secondary={{ label: "See our transparency", href: "/transparency/dashboard" }}
      />
    </SitePage>
  );
}
