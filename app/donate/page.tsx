import type { Metadata } from "next";
import {
  CoinsIcon,
  HeartHandshakeIcon,
  InfinityIcon,
  MoonIcon,
} from "lucide-react";
import { SitePage } from "@/components/site/site-page";
import {
  CtaBand,
  FeatureGrid,
  Section,
  SectionHeading,
} from "@/components/site/sections";

export const metadata: Metadata = {
  title: "Donate — EZAC",
  description:
    "Give Zakat, Sadaqah, Zakat al-Fitr, or endow a Waqf — securely, transparently, and traceably through EZAC.",
};

const WAYS = [
  {
    icon: CoinsIcon,
    title: "Zakat",
    description:
      "Fulfil your obligation precisely. Calculate what's due, then pay through a trusted channel.",
  },
  {
    icon: HeartHandshakeIcon,
    title: "Sadaqah",
    description:
      "Give voluntary charity, any amount, any time — directed to the causes that move you.",
  },
  {
    icon: MoonIcon,
    title: "Zakat al-Fitr",
    description:
      "Pay the per-person Fitr charity before Eid, distributed to families in time for the day.",
  },
  {
    icon: InfinityIcon,
    title: "Waqf endowment",
    description:
      "Make a perpetual gift whose returns support the community for generations.",
  },
];

export default function DonatePage() {
  return (
    <SitePage
      eyebrow="Give"
      title="Donate"
      accent="now"
      intro="Choose how you'd like to give. Every contribution — obligatory or voluntary — is traced from your hand to the families and futures it builds."
    >
      <Section>
        <SectionHeading
          eyebrow="Ways to give"
          title="Pick the giving that fits"
          intro="All gifts are processed through audited, regulated payment channels."
        />
        <FeatureGrid items={WAYS} columns={2} />
      </Section>
      <CtaBand
        title="Ready to give?"
        body="Start with your Zakat obligation, or back a live Waqf project today."
        primary={{ label: "Calculate & pay Zakat", href: "/zakat/calculator" }}
        secondary={{ label: "Fund a Waqf project", href: "/waqf/crowdfunding" }}
      />
    </SitePage>
  );
}
