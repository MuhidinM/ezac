import type { Metadata } from "next";
import {
  Building2Icon,
  CreditCardIcon,
  ReceiptIcon,
  SmartphoneIcon,
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
  title: "Pay Zakat Now — EZAC",
  description:
    "Pay your Zakat securely through Telebirr, Cooperative Bank of Oromia, card, or bank transfer — every payment traced to the families it reaches.",
};

const CHANNELS = [
  {
    icon: SmartphoneIcon,
    title: "Telebirr & mobile money",
    description:
      "Pay instantly from your mobile wallet — the fastest option for donors inside Ethiopia.",
  },
  {
    icon: Building2Icon,
    title: "Bank transfer",
    description:
      "Direct settlement through Cooperative Bank of Oromia and other major Ethiopian banks.",
  },
  {
    icon: CreditCardIcon,
    title: "Card payment",
    description:
      "Visa and Mastercard support for diaspora and online donors giving from anywhere.",
  },
  {
    icon: ReceiptIcon,
    title: "Traceable receipt",
    description:
      "Every payment issues a digital receipt you can follow on the live impact dashboard.",
  },
];

const STEPS = [
  {
    title: "Calculate your obligation",
    body: "Use the Zakat calculator to find the exact amount due across all your assets.",
  },
  {
    title: "Choose how to pay",
    body: "Select mobile money, bank transfer, or card — whichever suits you best.",
  },
  {
    title: "Confirm and track",
    body: "Confirm your payment and follow exactly where it goes on the public dashboard.",
  },
];

export default function PayZakatPage() {
  return (
    <SitePage
      eyebrow="Zakat"
      title="Pay Zakat"
      accent="now"
      intro="Settle your obligation in a few taps through trusted, audited channels — with every birr traced from your hand to the families and futures it builds."
    >
      <Section>
        <SectionHeading
          eyebrow="Ways to give"
          title="Pay through the channel that suits you"
          intro="All channels are operated on regulated payment infrastructure with full reconciliation."
        />
        <FeatureGrid items={CHANNELS} columns={2} />
      </Section>
      <Section muted>
        <SectionHeading eyebrow="How it works" title="Three simple steps" />
        <StepList steps={STEPS} />
      </Section>
      <CtaBand
        title="Know your number first"
        body="Work out exactly what you owe, then pay with confidence."
        primary={{ label: "Open the calculator", href: "/zakat/calculator" }}
        secondary={{ label: "See where it goes", href: "/transparency/dashboard" }}
      />
    </SitePage>
  );
}
