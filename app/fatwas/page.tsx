import type { Metadata } from "next";
import { SitePage } from "@/components/site/site-page";
import { Section, SectionHeading, FaqAccordion, CtaBand } from "@/components/site/sections";

export const metadata: Metadata = {
  title: "Fatwas & Islamic Rulings on Zakat — EZAC",
  description:
    "Authoritative rulings from the EZAC Shari'ah Advisory Board on Zakat, Waqf, and contemporary financial questions.",
};

const RULINGS = [
  {
    q: "On which assets is Zakat obligatory?",
    a: "Zakat is due on cash and savings, gold and silver, trade goods, agricultural produce, livestock, and certain modern assets such as tradable shares — once each meets its Nisab and, where required, a full lunar year (Hawl).",
  },
  {
    q: "Is the Nisab based on gold or silver?",
    a: "The Commission adopts the silver standard (595g) for monetary Zakat, following the position that the lower threshold is more beneficial to the poor by widening the base of those who pay.",
  },
  {
    q: "When is agricultural Zakat (Ushr) paid?",
    a: "Ushr is due on the day of harvest, with no Hawl required: 10% for rain-fed produce, 7.5% for mixed irrigation, and 5% for artificially irrigated crops, once the harvest reaches roughly 653 kg.",
  },
  {
    q: "How is Zakat on business assets calculated?",
    a: "Trade goods bought with the intention of resale — inventory, business cash, and receivables, less short-term payables — are assessed at 2.5%. Fixed assets such as machinery, vehicles, and premises are exempt.",
  },
  {
    q: "What is the ruling on Rikaz and mined minerals?",
    a: "Rikaz (buried treasure) owes 20% immediately on discovery, with no Nisab or Hawl. Extracted minerals owe 2.5% once they reach the gold/silver Nisab value.",
  },
  {
    q: "Can long-term debts be deducted before Zakat?",
    a: "Only short-term debts due within the lunar year, and the next twelve months of long-term loan payments, may be deducted. Deducting full long-term debt would unduly keep payers below Nisab.",
  },
];

export default function FatwasPage() {
  return (
    <SitePage
      eyebrow="Knowledge"
      title="Fatwas & Islamic"
      accent="rulings"
      intro="Guidance issued by the EZAC Shari'ah Advisory Board. These rulings underpin the calculator's logic and the Commission's disbursement policy."
    >
      <Section>
        <SectionHeading
          eyebrow="Rulings"
          title="Zakat rulings, explained"
          intro="Each ruling reflects the considered opinion of qualified scholars."
        />
        <FaqAccordion items={RULINGS} />
      </Section>
      <CtaBand
        title="Put the rulings into practice"
        body="The calculator applies each of these rulings automatically across your assets."
        primary={{ label: "Open the calculator", href: "/zakat/calculator" }}
        secondary={{ label: "Meet the Shari'ah board", href: "/about/shariah-board" }}
      />
    </SitePage>
  );
}
