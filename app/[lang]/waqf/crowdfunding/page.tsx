import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon, HandCoinsIcon, InfinityIcon, UsersIcon } from "lucide-react";
import { SitePage } from "@/components/site/site-page";
import { CtaBand, FeatureGrid, Section, SectionHeading } from "@/components/site/sections";

export const metadata: Metadata = {
  title: "Waqf Crowdfunding — EZAC",
  description:
    "How Waqf crowdfunding will let many people fund one lasting project together. Projects will be listed here once the Commission publishes them.",
};

// No projects are published yet. When they are, list real records from the
// zakat service here; never stand-in campaigns, figures or certification tags.
const HOW_IT_WORKS = [
  {
    icon: UsersIcon,
    title: "Many givers, one project",
    description:
      "Each person gives what they can toward a single Waqf project, so together they can fund something no one could fund alone.",
  },
  {
    icon: InfinityIcon,
    title: "The principal is kept",
    description:
      "A Waqf is not spent. The endowed asset is kept, and only what it earns or provides goes to the cause.",
  },
  {
    icon: HandCoinsIcon,
    title: "Lasting benefit",
    description:
      "Once a project is funded, it keeps serving the community for years after the last gift.",
  },
];

const NEXT_STEPS = [
  {
    href: "/causes",
    title: "Give to an open Zakat cause",
    body: "See the causes accepting Zakat right now, with their goals and what has been raised.",
  },
  {
    href: "/contact",
    title: "Talk to our team",
    body: "Ask about endowing a Waqf or about upcoming projects.",
  },
];

export default function WaqfCrowdfundingPage() {
  return (
    <SitePage
      eyebrow="Waqf"
      title="Waqf"
      accent="crowdfunding"
      intro="Waqf crowdfunding will let many people fund one lasting endowment together, such as a water point or a school, that keeps giving long after it is funded."
    >
      <Section>
        <SectionHeading
          eyebrow="Projects"
          title="No projects are listed yet"
          intro="Waqf projects will be listed here once the Commission publishes them. Until then, nothing can be funded on this page."
        />
        <div className="mx-auto mt-10 grid max-w-3xl gap-4 sm:grid-cols-2">
          {NEXT_STEPS.map((step) => (
            <Link
              key={step.href}
              href={step.href}
              className="group rounded-2xl border border-black/5 bg-white p-6 shadow-sm transition hover:border-[#007050] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007050] focus-visible:ring-offset-2"
            >
              <p className="flex items-center justify-between gap-3 font-medium" style={{ color: "#001539" }}>
                {step.title}
                <ArrowRightIcon className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" style={{ color: "#007050" }} />
              </p>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "#6F6F6F" }}>
                {step.body}
              </p>
            </Link>
          ))}
        </div>
      </Section>
      <Section muted>
        <SectionHeading eyebrow="How it will work" title="Lasting projects, funded together" />
        <FeatureGrid items={HOW_IT_WORKS} />
      </Section>
      <CtaBand
        title="Have an asset to endow?"
        body="Property, cash or shares can become a lasting Waqf. Our team will guide you through each step."
        primary={{ label: "Register a Waqf asset", href: "/waqf/register-asset" }}
        secondary={{ label: "Explore Waqf investments", href: "/waqf/investments" }}
      />
    </SitePage>
  );
}
