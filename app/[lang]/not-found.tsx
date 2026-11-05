import type { Metadata } from "next";
import Link from "next/link";

import { Section } from "@/components/site/sections";
import { SitePage } from "@/components/site/site-page";

// Next adds `noindex` to 404 responses on its own.
export const metadata: Metadata = {
  title: "Page not found — EZAC",
};

/** 404 for unknown URLs and for causes or stories that don't exist (or were taken down). */
export default function NotFound() {
  return (
    <SitePage
      eyebrow="Page not found"
      title="We couldn't find"
      accent="that page"
      intro="The link may be wrong, or the page may have moved or been taken down."
    >
      <Section>
        <div className="mx-auto flex max-w-xl flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full px-7 py-3.5 text-sm font-medium transition-transform duration-300 hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007050] focus-visible:ring-offset-2"
            style={{ backgroundColor: "#007050", color: "#FFFFFF" }}
          >
            Go to the home page
          </Link>
          <Link
            href="/causes"
            className="inline-flex items-center justify-center rounded-full border border-black/15 px-7 py-3.5 text-sm transition-colors hover:bg-black/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007050] focus-visible:ring-offset-2"
            style={{ color: "#001539" }}
          >
            See open causes
          </Link>
        </div>
      </Section>
    </SitePage>
  );
}
