import type { Metadata } from "next";
import {
  InfinityIcon,
  ShieldCheckIcon,
  SproutIcon,
  TrendingUpIcon,
} from "lucide-react";
import { SitePage } from "@/components/site/site-page";
import {
  CtaBand,
  FeatureGrid,
  Section,
  SectionHeading,
} from "@/components/site/sections";

export const metadata: Metadata = {
  title: "Waqf Investments — EZAC",
  description:
    "How endowed Waqf capital is invested in ethical, Shari'ah-compliant assets so the principal is preserved and the returns fund causes forever.",
};

const PRINCIPLES = [
  {
    icon: InfinityIcon,
    title: "Perpetual principal",
    description:
      "The endowed capital is preserved in perpetuity — only the returns it generates are spent on causes.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Shari'ah-compliant assets",
    description:
      "Capital is placed only in screened, halal asset classes approved by the Shari'ah Advisory Board.",
  },
  {
    icon: TrendingUpIcon,
    title: "Returns fund causes",
    description:
      "Investment income flows continuously to water, education, healthcare, and poverty relief.",
  },
  {
    icon: SproutIcon,
    title: "Compounding impact",
    description:
      "As the endowment grows, so does the annual giving it can sustain — a gift that keeps giving.",
  },
];

export default function WaqfInvestmentsPage() {
  return (
    <SitePage
      eyebrow="Waqf"
      title="Waqf"
      accent="investments"
      intro="A Waqf endowment is invested, not spent. The principal is protected forever while its returns are channelled into the causes you care about — year after year."
    >
      <Section>
        <SectionHeading
          eyebrow="How it works"
          title="Endowment, not expenditure"
          intro="Waqf turns a one-time gift into a permanent income stream for the community."
        />
        <FeatureGrid items={PRINCIPLES} columns={2} />
      </Section>
      <CtaBand
        title="Build a lasting endowment"
        body="Register an asset as Waqf and let it generate ongoing support for generations to come."
        primary={{ label: "Register a Waqf asset", href: "/waqf/register-asset" }}
        secondary={{ label: "Fund a live project", href: "/waqf/crowdfunding" }}
      />
    </SitePage>
  );
}
