import type { Metadata } from "next";
import { SitePage } from "@/components/site/site-page";
import { FeaturedWaqfCampaigns } from "@/components/landing/featured-waqf-campaigns";
import { CtaBand } from "@/components/site/sections";

export const metadata: Metadata = {
  title: "Crowdfunding Projects — EZAC",
  description:
    "Fund Shari'ah-reviewed Waqf projects — water, education, and shelter — alongside your Zakat, with transparent progress toward every goal.",
};

export default function WaqfCrowdfundingPage() {
  return (
    <SitePage
      eyebrow="Waqf"
      title="Crowdfunding"
      accent="projects"
      intro="Back perpetual, Shari'ah-reviewed endowment projects that keep giving long after they are funded — every listing shows transparent progress toward its goal."
    >
      <FeaturedWaqfCampaigns />
      <CtaBand
        title="Have an asset to endow?"
        body="Turn property, cash, or shares into a lasting Waqf that funds these causes for generations."
        primary={{ label: "Register a Waqf asset", href: "/waqf/register-asset" }}
        secondary={{ label: "Explore Waqf investments", href: "/waqf/investments" }}
      />
    </SitePage>
  );
}
