import type { Metadata } from "next";
import Link from "next/link";

import "./globals.css";

import { fontVariables } from "@/lib/fonts";

/**
 * 404 for URLs that match no route at all (the app has two root layouts, the
 * public site under app/[lang] and the staff portal under app/(portal), so
 * there is no single layout to build it from). Public URLs normally reach the
 * localized 404 in app/[lang]/not-found.tsx; this covers the rest, e.g.
 * /login/typo. Enabled by experimental.globalNotFound in next.config.ts.
 */
export const metadata: Metadata = {
  title: "Page not found — EZAC",
  robots: { index: false, follow: false },
};

export default function GlobalNotFound() {
  return (
    <html lang="en" className={`${fontVariables} h-full antialiased`}>
      <body className="flex min-h-full flex-col items-center justify-center bg-white px-6 py-24 text-center">
        <main id="main" className="flex max-w-md flex-col items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element -- brand mark served as a static asset */}
          <img src="/logo.svg" alt="EZAC" width={48} height={48} className="h-12 w-12" />
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-brand">Page not found</p>
          <h1 className="font-serif-display text-4xl text-navy">We couldn&apos;t find that page</h1>
          <p className="text-sm text-[#4b5563]">The link may be wrong, or the page may have moved or been taken down.</p>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full bg-brand px-7 py-3 text-sm font-medium text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            >
              Go to the home page
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-full border border-black/15 px-7 py-3 text-sm text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            >
              Staff sign-in
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}
