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
    q: "How is it decided who receives Zakat?",
    a: "By a published process: registration at a branch, a household assessment, a need score out of 270 points, a decision by the branch supervisor, and payment by head office. Emergencies can be fast-tracked with evidence. The 'How it works' page explains every step.",
  },
  {
    q: "What is Nisab and how is it set?",
    a: "Nisab is the minimum wealth you must hold before Zakat is due: the value of 85 g of gold or 595 g of silver. The Commission's published rules say which one applies, and the calculator converts it to birr with gold and silver prices updated every morning. The 'How it works' page shows the rules in force today.",
  },
  {
    q: "Do I pay Zakat on gold jewellery I wear?",
    a: "According to the majority of scholars, yes — Zakat is due on gold and silver whether worn or stored, calculated on the fine-metal weight once the Nisab and a full lunar year (Hawl) are met.",
  },
  {
    q: "How is my payment kept secure and traceable?",
    a: "You pay by scanning a QR code with any Ethiopian bank app. The money goes straight into the Commission's account at Cooperative Bank of Oromia, the payment is matched to the bank's own record, and you get a numbered certificate anyone can verify on the 'How it works' page.",
  },
  {
    q: "How do you verify that funds reach the right people?",
    a: "Each household is registered at a branch, checked for duplicates, visited by a field officer and scored against a published points table. The branch supervisor approves it, head office adds it to the pool, and support is paid only to a bank account checked with the bank. Every step is recorded.",
  },
  {
    q: "What is the difference between Zakat and Waqf?",
    a: "Zakat is an annual obligation distributed to eligible recipients. Waqf is a perpetual endowment — the principal is preserved and invested, and only its returns are spent, so it keeps giving indefinitely.",
  },
  {
    q: "Can I give from outside Ethiopia?",
    a: "Payments currently go through Ethiopian bank apps by QR code. If you live abroad but hold an Ethiopian bank account with a mobile app, you can pay the same way.",
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
