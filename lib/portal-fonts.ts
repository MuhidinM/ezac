import { Geist, Geist_Mono, Instrument_Serif, Inter, Noto_Sans_Arabic, Noto_Sans_Ethiopic } from "next/font/google";

/**
 * Fonts of the staff portal (app/(portal)/layout.tsx). The public site's are
 * in lib/fonts.ts; see there why the two are separate modules.
 *
 * Only the dashboard's Geist and Geist Mono are preloaded: staff spend their
 * day there. The sign-in pages borrow the public site's look (Inter and
 * Instrument Serif), which load when those pages ask for them.
 */

// Dashboard typeface; swapped in via --font-app-sans in globals.css.
const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

// Ids, account numbers and references in the dashboard's tables.
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

// /login and /login/change-password.
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
  preload: false,
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
  display: "swap",
  preload: false,
});

/*
 * Names and addresses in Amharic or Arabic script, typed in by staff. Only
 * downloaded when a page shows such text (each file has a unicode-range).
 */
const notoSansEthiopic = Noto_Sans_Ethiopic({
  subsets: ["ethiopic"],
  weight: ["400", "500", "600"],
  variable: "--font-noto-ethiopic",
  display: "swap",
  preload: false,
});

const notoSansArabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600"],
  variable: "--font-noto-arabic",
  display: "swap",
  preload: false,
});

/** The portal's font variables, for the <html> className of its root layout. */
export const portalFontVariables = [geist, geistMono, inter, instrumentSerif, notoSansEthiopic, notoSansArabic]
  .map((font) => font.variable)
  .join(" ");
