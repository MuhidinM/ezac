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
      "The Ethiopian Islamic Affairs Supreme Council established the Commission under Proclamation 1207/2020. The Commission is accountable to it and independent in its professional and administrative work.",
  },
  {
    icon: UsersIcon,
    title: "Board of Directors",
    description:
      "25 members serving five-year terms, at most two in a row. The board supervises the Commission, appoints the Commissioner, issues directives and approves the plan and budget.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Control committee",
    description:
      "An oversight committee is part of the Commission's structure, and every change in the Zakat system is recorded with who made it and when.",
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
            Under its establishment regulation, the Commission collects Zakat
            in Ethiopia and abroad and distributes it to those entitled,
            according to Shari&apos;ah and current fatwas, through a system
            that is transparent, accountable and trustworthy. Funds are
            reconciled with the bank and reported publicly, so trust is earned
            through evidence, not assertion.
          </p>
        </div>
      </Section>
      <CtaBand
        title="Religious assurance you can rely on"
        body="Our Shari'ah Advisory Board reviews every ruling, product, and disbursement."
        primary={{ label: "Meet the Shari'ah board", href: "/about/shariah-board" }}
        secondary={{ label: "Read the legal documents", href: "/about#documents" }}
      />
    </SitePage>
  );
}
