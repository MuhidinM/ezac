import type { Metadata } from "next";
import {
  BadgeCheckIcon,
  BookOpenIcon,
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
  title: "Shari'ah Advisory Board — EZAC",
  description:
    "The scholars and mandate behind every EZAC ruling, product, and disbursement — ensuring full Shari'ah compliance.",
};

const MANDATE = [
  {
    icon: BookOpenIcon,
    title: "Rulings & fatwas",
    description:
      "Issues authoritative guidance on Zakat, Waqf, and contemporary financial questions.",
  },
  {
    icon: BadgeCheckIcon,
    title: "Product certification",
    description:
      "Reviews and certifies every calculator rule, Waqf structure, and investment product.",
  },
  {
    icon: ScaleIcon,
    title: "Disbursement review",
    description:
      "Confirms that funds reach only eligible categories of beneficiaries under Shari'ah.",
  },
  {
    icon: UsersIcon,
    title: "Independent scholars",
    description:
      "Composed of qualified Ethiopian and international scholars serving independently.",
  },
];

const PROCESS = [
  {
    title: "Review",
    body: "Each product, rule, or disbursement policy is submitted to the board for study.",
  },
  {
    title: "Deliberate",
    body: "Scholars assess it against Qur'an, Sunnah, and established fiqh.",
  },
  {
    title: "Certify",
    body: "Approved items receive a documented Shari'ah opinion before going live.",
  },
];

export default function ShariahBoardPage() {
  return (
    <SitePage
      eyebrow="About Us"
      title="Shari'ah Advisory"
      accent="Board"
      intro="An independent body of scholars that safeguards the religious integrity of everything EZAC does — from the calculator's rulings to how funds are distributed."
    >
      <Section>
        <SectionHeading eyebrow="Mandate" title="What the board oversees" />
        <FeatureGrid items={MANDATE} columns={2} />
      </Section>
      <Section muted>
        <SectionHeading
          eyebrow="Assurance process"
          title="How compliance is certified"
        />
        <StepList steps={PROCESS} />
      </Section>
      <CtaBand
        title="Read the rulings"
        body="Explore the fatwas and Islamic rulings on Zakat that guide the Commission."
        primary={{ label: "View fatwas & rulings", href: "/fatwas" }}
        secondary={{ label: "About our governance", href: "/about/governance" }}
      />
    </SitePage>
  );
}
