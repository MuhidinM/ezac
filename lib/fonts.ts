import { Geist_Mono, Instrument_Serif, Inter, Noto_Naskh_Arabic, Noto_Sans_Arabic, Noto_Sans_Ethiopic, Noto_Serif_Ethiopic } from "next/font/google";

/**
 * Fonts of the public site (app/[lang]/layout.tsx and app/global-not-found.tsx).
 * The staff portal has its own set in lib/portal-fonts.ts. They are separate
 * modules because Next preloads every font a root layout's imports declare,
 * whether the page uses it or not: one shared module made the public site
 * preload the portal's Geist and the portal preload the public serif.
 *
 * Each font is a download, so only the weights the site uses are listed.
 */

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

// For the few monospaced bits (certificate numbers, error references): not preloaded.
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

/*
 * Amharic (Ethiopic script) and Arabic. The Latin fonts above have no glyphs
 * for them, so globals.css lists these as fallbacks in every font stack: the
 * browser switches per character, and only downloads a file when the page
 * actually contains that script (each file has a unicode-range). Afaan Oromoo
 * is written in Latin script and needs nothing extra. Not preloaded: most
 * pages never need them.
 */
const notoSansEthiopic = Noto_Sans_Ethiopic({
  subsets: ["ethiopic"],
  weight: ["400", "500", "600"],
  variable: "--font-noto-ethiopic",
  display: "swap",
  preload: false,
});

const notoSerifEthiopic = Noto_Serif_Ethiopic({
  subsets: ["ethiopic"],
  weight: ["400"],
  variable: "--font-noto-serif-ethiopic",
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

const notoNaskhArabic = Noto_Naskh_Arabic({
  subsets: ["arabic"],
  weight: ["400"],
  variable: "--font-noto-naskh-arabic",
  display: "swap",
  preload: false,
});

/** The public site's font variables, for the <html> className of its root layout. */
export const fontVariables = [
  inter,
  instrumentSerif,
  geistMono,
  notoSansEthiopic,
  notoSerifEthiopic,
  notoSansArabic,
  notoNaskhArabic,
]
  .map((font) => font.variable)
  .join(" ");
