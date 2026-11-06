import type { Metadata } from "next";
import type { ReactNode } from "react";

import "../globals.css";

import { portalFontVariables } from "@/lib/portal-fonts";
import { siteUrl } from "@/lib/site";

/**
 * Root layout of the staff portal (/dashboard) and staff sign-in (/login).
 * English only, and kept out of search results. The public site has its own
 * root layout under app/[lang]; moving between the two is a full page load.
 */
export const metadata: Metadata = {
  metadataBase: siteUrl(),
  // No template here: /login pages set complete titles, and app/(portal)/dashboard/layout.tsx
  // adds "— EZAC staff" for portal pages.
  title: "Staff portal — EZAC",
  robots: { index: false, follow: false },
};

export default function PortalRootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={`${portalFontVariables} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {/* First stop for keyboard users: jumps past the navigation to the page's <main id="main">. */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-[#001539] focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#007050]"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
