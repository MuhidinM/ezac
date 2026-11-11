import type { ReactNode } from "react";
import { Navbar } from "@/components/landing/navbar";
import { SiteFooter } from "@/components/landing/site-footer";

type SitePageProps = {
  eyebrow: string;
  title: string;
  accent?: string;
  intro?: string;
  /** The language of `title` and `intro` when it isn't the page's (admin text that fell back to English). */
  lang?: string;
  children?: ReactNode;
};

/**
 * Shared chrome for every interior page: the fixed Navbar, a branded light
 * header (readable under the transparent nav), the page body, and SiteFooter.
 * The navbar and footer read their strings from the language context, so the
 * page only passes its own heading text (already in its language).
 */
export function SitePage({
  eyebrow,
  title,
  accent,
  intro,
  lang,
  children,
}: SitePageProps) {
  return (
    <div className="relative w-full overflow-x-hidden bg-white">
      <Navbar />
      {/* The page heading belongs to the main content, so "Skip to content" (#main) lands on it. */}
      <main id="main" tabIndex={-1} className="outline-none">
        <header className="relative overflow-hidden border-b border-black/5 bg-white">
          {/* Decorative brand watermark: a CSS background, so it isn't an image without a description. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-16 -end-24 z-0 aspect-[900/1245] h-[150%] bg-[url(/images/bg2.webp)] bg-contain bg-no-repeat opacity-[0.05] select-none"
          />
          <div className="relative z-10 mx-auto max-w-4xl px-6 pt-36 pb-16 text-center sm:px-8 sm:pt-40 sm:pb-20">
            <p className="text-xs uppercase tracking-[0.16em] text-brand">{eyebrow}</p>
            <h1 lang={lang} className="font-serif-display mt-3 text-4xl leading-none tracking-[-1.5px] text-navy sm:text-5xl md:text-6xl">
              {title}
              {accent && (
                <>
                  {" "}
                  <span className="italic text-accent-ink">{accent}</span>
                </>
              )}
            </h1>
            {intro && (
              <p lang={lang} className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-ink sm:text-lg">
                {intro}
              </p>
            )}
          </div>
        </header>
        <div className="relative z-10">{children}</div>
      </main>
      <SiteFooter />
    </div>
  );
}
