import type { Metadata } from "next";
import { SitePage } from "@/components/site/site-page";
import { Section, LegalProse } from "@/components/site/sections";

export const metadata: Metadata = {
  title: "Privacy Policy — EZAC",
  description:
    "How the Ethiopian Zakat & Awqaf Commission collects, uses, and protects your personal and financial information.",
};

const SECTIONS = [
  {
    heading: "Overview",
    paragraphs: [
      "The Ethiopian Zakat & Awqaf Commission (“EZAC”, “we”) is committed to protecting your privacy. This policy explains what information we collect, how we use it, and the choices you have. It applies to our website, calculator, and donation services.",
    ],
  },
  {
    heading: "Information we collect",
    paragraphs: [
      "We collect information you provide directly — such as your name, contact details, and the figures you enter to calculate or pay Zakat. Where you make a payment, our regulated payment partners process your transaction details on our behalf.",
      "We also collect limited technical information, such as device and usage data, to operate and secure the service.",
    ],
  },
  {
    heading: "How we use your information",
    paragraphs: [
      "We use your information to calculate your obligation, process and reconcile payments, assess households, issue certificates, and report on impact. We do not sell your personal information.",
    ],
  },
  {
    heading: "Households we support",
    paragraphs: [
      "When a household applies for support, our staff record what is needed to assess it: its members, income, assets, housing and health, and a bank account for payment. This information, the household's score and every decision about it are visible only to the staff who handle the case, and are never published.",
      "Public figures on this website are totals. An impact story about a family is published only with their consent.",
    ],
  },
  {
    heading: "Data security & retention",
    paragraphs: [
      "We apply technical and organisational safeguards to protect your data, and retain it only as long as necessary for the purposes above or as required by law and audit obligations.",
    ],
  },
  {
    heading: "Your rights & contact",
    paragraphs: [
      "You may request access to, correction of, or deletion of your personal information, subject to legal and audit requirements. To exercise these rights or ask questions about this policy, please contact our support team.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <SitePage
      eyebrow="Legal"
      title="Privacy"
      accent="policy"
      intro="How we collect, use, and protect your personal and financial information across EZAC services."
    >
      <Section>
        <LegalProse sections={SECTIONS} />
      </Section>
    </SitePage>
  );
}
