import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono, Instrument_Serif, Inter } from "next/font/google";
import "./globals.css";

// Only the weights the site uses (no font-light anywhere); each one is a download.
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
  display: "swap",
});

// Dashboard typeface; swapped in via --font-app-sans in globals.css.
const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/** The public origin from SITE_URL (e.g. https://ezac.gov.et); null when unset or invalid. */
function siteUrl(): URL | null {
  const raw = process.env.SITE_URL?.trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return url.protocol === "https:" || url.protocol === "http:" ? new URL(url.origin) : null;
  } catch {
    return null;
  }
}

const metadataBase = siteUrl();

export const metadata: Metadata = {
  // Lets pages give canonical and social-preview URLs as paths. Static pages
  // read SITE_URL when they are built, so it must be set at build time too.
  ...(metadataBase ? { metadataBase } : {}),
  // No title template: every public page already ends its title with "— EZAC",
  // so a "%s — EZAC" template would print it twice.
  title: "EZAC — Ethiopian Zakat & Awqaf Commission",
  description:
    "Ethiopia's trusted digital home for Zakat and Waqf. Calculate, give, and endow with precision and transparency.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${instrumentSerif.variable} ${geist.variable} ${geistMono.variable} h-full antialiased`}
    >
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
