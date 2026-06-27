import type { Metadata } from "next";
import {
  Building2Icon,
  CoinsIcon,
  LeafIcon,
  TrendingUpIcon,
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
  title: "Register a Waqf Asset — EZAC",
  description:
    "Endow property, cash, shares, or agricultural land as a perpetual Waqf — registered, documented, and managed under EZAC governance.",
};

const ASSET_TYPES = [
  {
    icon: Building2Icon,
    title: "Property & real estate",
    description:
      "Buildings and land whose rental income perpetually supports designated causes.",
  },
  {
    icon: CoinsIcon,
    title: "Cash Waqf",
    description:
      "Monetary endowments pooled and invested, with only the returns disbursed.",
  },
  {
    icon: TrendingUpIcon,
    title: "Shares & securities",
    description:
      "Shari'ah-compliant equities and sukuk dedicated as a lasting endowment.",
  },
  {
    icon: LeafIcon,
    title: "Agricultural land",
    description:
      "Farmland whose harvest or lease income funds community programmes.",
  },
];

const STEPS = [
  {
    title: "Declare your intent",
    body: "Tell us the asset you wish to endow and the causes you want it to serve.",
  },
  {
    title: "Document & verify",
    body: "We verify ownership and prepare the Waqf deed with Shari'ah oversight.",
  },
  {
    title: "Endow & manage",
    body: "The asset is registered as Waqf and professionally managed on your behalf.",
  },
];

export default function RegisterWaqfAssetPage() {
  return (
    <SitePage
      eyebrow="Waqf"
      title="Register a Waqf"
      accent="asset"
      intro="Dedicate property, cash, shares, or land as a perpetual endowment. We handle documentation, Shari'ah review, and ongoing management so your gift gives forever."
    >
      <Section>
        <SectionHeading
          eyebrow="What you can endow"
          title="Assets that qualify as Waqf"
        />
        <FeatureGrid items={ASSET_TYPES} columns={2} />
      </Section>
      <Section muted>
        <SectionHeading eyebrow="The process" title="From intent to endowment" />
        <StepList steps={STEPS} />
      </Section>
      <CtaBand
        title="Start your Waqf registration"
        body="Begin the process online or speak with our endowment team for guidance."
        primary={{ label: "Begin registration", href: "/dashboard/register" }}
        secondary={{ label: "Talk to our team", href: "/contact" }}
      />
    </SitePage>
  );
}
