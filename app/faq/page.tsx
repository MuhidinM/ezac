import type { Metadata } from "next";
import { SitePage } from "@/components/site/site-page";
import { Section, SectionHeading, FaqAccordion, CtaBand } from "@/components/site/sections";

export const metadata: Metadata = {
  title: "FAQ — EZAC",
  description:
    "Answers to common questions about Zakat, Waqf, payments, verification, and how EZAC keeps every birr traceable.",
};

const FAQS = [
  {
    q: "What is Nisab and how is it set?",
    a: "Nisab is the minimum wealth you must hold before Zakat is due. EZAC pegs it to the value of 595g of silver, refreshed from live market rates, because the silver threshold is lower and brings more people into the bracket that benefits the poor.",
  },
  {
    q: "Do I pay Zakat on gold jewellery I wear?",
    a: "According to the majority of scholars, yes — Zakat is due on gold and silver whether worn or stored, calculated on the fine-metal weight once the Nisab and a full lunar year (Hawl) are met.",
  },
  {
    q: "How is my payment kept secure and traceable?",
    a: "Payments run on regulated infrastructure with Cooperative Bank of Oromia and licensed providers. Every transaction issues a digital receipt and can be followed on the public live dashboard.",
  },
  {
    q: "How do you verify that funds reach the right people?",
    a: "Beneficiaries are validated through Fayda national ID integration, and disbursements are independently audited to reduce fraud and ensure funds reach eligible recipients.",
  },
  {
    q: "What is the difference between Zakat and Waqf?",
    a: "Zakat is an annual obligation distributed to eligible recipients. Waqf is a perpetual endowment — the principal is preserved and invested, and only its returns are spent, so it keeps giving indefinitely.",
  },
  {
    q: "Can I give from outside Ethiopia?",
    a: "Yes. Diaspora donors can pay by Visa or Mastercard, and every gift is traced and reported just like domestic contributions.",
  },
];

export default function FaqPage() {
  return (
    <SitePage
      eyebrow="Support"
      title="Frequently asked"
      accent="questions"
      intro="The essentials on Zakat, Waqf, payments, and verification. Can't find your answer? Our support team is one message away."
    >
      <Section>
        <SectionHeading eyebrow="Answers" title="Common questions" />
        <FaqAccordion items={FAQS} />
      </Section>
      <CtaBand
        title="Still have a question?"
        body="Reach our support team and we'll get back to you quickly."
        primary={{ label: "Contact support", href: "/contact" }}
        secondary={{ label: "Read the fatwas", href: "/fatwas" }}
      />
    </SitePage>
  );
}
