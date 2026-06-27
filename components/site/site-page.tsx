import type { ReactNode } from "react";
import { Navbar } from "@/components/landing/navbar";
import { SiteFooter } from "@/components/landing/site-footer";

type SitePageProps = {
  eyebrow: string;
  title: string;
  accent?: string;
  intro?: string;
  children?: ReactNode;
};

/**
 * Shared chrome for every interior page: the fixed Navbar, a branded light
 * header (readable under the transparent nav), the page body, and SiteFooter.
 */
export function SitePage({
  eyebrow,
  title,
  accent,
  intro,
  children,
}: SitePageProps) {
  return (
    <div className="relative w-full overflow-x-hidden bg-white">
      <Navbar />
      <header className="relative overflow-hidden border-b border-black/5 bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element -- decorative brand watermark served as a static asset */}
        <img
          src="/bg2.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -top-16 -right-24 z-0 h-[150%] w-auto max-w-none select-none opacity-[0.05]"
        />
        <div className="relative z-10 mx-auto max-w-4xl px-6 pt-36 pb-16 text-center sm:px-8 sm:pt-40 sm:pb-20">
          <p
            className="text-[10px] uppercase tracking-[0.18em]"
            style={{ color: "#007050" }}
          >
            {eyebrow}
          </p>
          <h1
            className="font-serif-display mt-3 text-4xl sm:text-5xl md:text-6xl"
            style={{ color: "#001539", lineHeight: 1, letterSpacing: "-1.5px" }}
          >
            {title}
            {accent && (
              <>
                {" "}
                <span className="italic" style={{ color: "#e18f35" }}>
                  {accent}
                </span>
              </>
            )}
          </h1>
          {intro && (
            <p
              className="mx-auto mt-6 max-w-2xl text-base leading-relaxed sm:text-lg"
              style={{ color: "#6F6F6F" }}
            >
              {intro}
            </p>
          )}
        </div>
      </header>
      <main className="relative z-10">{children}</main>
      <SiteFooter />
    </div>
  );
}
