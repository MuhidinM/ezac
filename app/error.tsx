"use client"; // Error boundaries must be Client Components.

import Link from "next/link";

import { ErrorReference } from "@/components/errors/error-reference";
import { useLoggedError } from "@/components/errors/use-logged-error";
import { Section } from "@/components/site/sections";
import { SitePage } from "@/components/site/site-page";

/**
 * Catches render errors in public pages (the portal has its own boundary in
 * app/dashboard/error.tsx). A public page that can't reach the zakat service
 * and has no cached copy lands here too. Errors in the root layout itself go
 * to app/global-error.tsx.
 */
export default function PublicError({ error, retry }: { error: unknown; retry: () => void }) {
  const reference = useLoggedError("site", error);

  return (
    <SitePage
      eyebrow="Error"
      title="Something went"
      accent="wrong"
      intro="The problem is on our side, not yours. Try again in a moment."
    >
      <title>Something went wrong — EZAC</title>
      <Section>
        <div className="mx-auto flex max-w-xl flex-col items-center gap-6 text-center">
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            {/* retry() fetches the page again, so it also recovers from a brief outage. */}
            <button
              type="button"
              onClick={() => retry()}
              className="inline-flex items-center justify-center rounded-full px-7 py-3.5 text-sm font-medium transition-transform duration-300 hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007050] focus-visible:ring-offset-2"
              style={{ backgroundColor: "#007050", color: "#FFFFFF" }}
            >
              Try again
            </button>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full border border-black/15 px-7 py-3.5 text-sm transition-colors hover:bg-black/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007050] focus-visible:ring-offset-2"
              style={{ color: "#001539" }}
            >
              Go to the home page
            </Link>
          </div>
          {reference ? (
            <div className="space-y-1">
              <p className="text-sm" style={{ color: "#6F6F6F" }}>
                If it keeps happening,{" "}
                <Link href="/contact" className="underline underline-offset-4" style={{ color: "#007050" }}>
                  contact us
                </Link>{" "}
                and quote this reference.
              </p>
              <ErrorReference digest={reference} />
            </div>
          ) : null}
        </div>
      </Section>
    </SitePage>
  );
}
