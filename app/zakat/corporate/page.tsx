import type { Metadata } from "next";
import {
  BadgeCheckIcon,
  BarChart3Icon,
  ScaleIcon,
  UsersIcon,
} from "lucide-react";
import { SitePage } from "@/components/site/site-page";
import {
  CtaBand,
  FeatureGrid,
  Section,
  SectionHeading,
  StepList,
} from "@/components/site/sections";

export const metadata: Metadata = {
  title: "Corporate Zakat — EZAC",
  description:
    "Asset-level Zakat calculation, audited disbursement, and board-ready impact reporting for companies and institutions.",
};

const FEATURES = [
  {
    icon: ScaleIcon,
    title: "Audited calculation",
    description:
      "Company assets assessed to recognised standards, with working papers your auditors can rely on.",
  },
  {
    icon: UsersIcon,
    title: "Bulk disbursement",
    description:
      "Distribute across thousands of Fayda-verified beneficiaries in a single, reconciled settlement.",
  },
  {
    icon: BarChart3Icon,
    title: "Impact reporting",
    description:
      "Board-ready and CSR reports that tie every birr to measurable, verifiable outcomes.",
  },
  {
    icon: BadgeCheckIcon,
    title: "Shari'ah review",
    description:
      "Every assessment is reviewed and certified by the EZAC Shari'ah Advisory Board.",
  },
];

const STEPS = [
  {
    title: "Engage our corporate desk",
    body: "Tell us about your organisation, sector, and reporting requirements.",
  },
  {
    title: "Submit financials",
    body: "Share the disclosures needed to assess zakatable assets securely.",
  },
  {
    title: "Review & certify",
    body: "We compute, the Shari'ah board reviews, and you receive a certified figure.",
  },
  {
    title: "Disburse & report",
    body: "Funds are distributed to verified causes and reported back to your board.",
  },
];

export default function CorporateZakatPage() {
  return (
    <SitePage
      eyebrow="Zakat"
      title="Corporate"
      accent="Zakat"
      intro="A managed service for companies and institutions — accurate assessment, compliant disbursement, and transparent reporting at scale."
    >
      <Section>
        <SectionHeading
          eyebrow="What you get"
          title="Built for organisations"
          intro="From a single ledger to a nationwide CSR programme, corporate Zakat is handled end to end."
        />
        <FeatureGrid items={FEATURES} columns={2} />
      </Section>
      <Section muted>
        <SectionHeading eyebrow="The process" title="From engagement to impact" />
        <StepList steps={STEPS} />
      </Section>
      <CtaBand
        title="Discuss your corporate Zakat"
        body="Our corporate desk will scope assessment, disbursement, and reporting around your needs."
        primary={{ label: "Contact the corporate desk", href: "/contact" }}
        secondary={{ label: "Estimate with the calculator", href: "/zakat/calculator" }}
      />
    </SitePage>
  );
}
