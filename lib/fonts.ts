import { Geist, Geist_Mono, Instrument_Serif, Inter, Noto_Naskh_Arabic, Noto_Sans_Arabic, Noto_Sans_Ethiopic, Noto_Serif_Ethiopic } from "next/font/google";

/**
 * Fonts for both root layouts (public site and staff portal). Each one is a
 * download, so only the weights the site uses are listed.
 */

export const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

export const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
  display: "swap",
});

// Dashboard typeface; swapped in via --font-app-sans in globals.css.
export const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

export const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/*
 * Amharic (Ethiopic script) and Arabic. The Latin fonts above have no glyphs
 * for them, so globals.css lists these as fallbacks in every font stack: the
 * browser switches per character, and only downloads a file when the page
 * actually contains that script (each file has a unicode-range). Afaan Oromoo
 * is written in Latin script and needs nothing extra. Not preloaded: most
 * pages never need them.
 */
export const notoSansEthiopic = Noto_Sans_Ethiopic({
  subsets: ["ethiopic"],
  weight: ["400", "500", "600"],
  variable: "--font-noto-ethiopic",
  display: "swap",
  preload: false,
});

export const notoSerifEthiopic = Noto_Serif_Ethiopic({
  subsets: ["ethiopic"],
  weight: ["400"],
  variable: "--font-noto-serif-ethiopic",
  display: "swap",
  preload: false,
});

export const notoSansArabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600"],
  variable: "--font-noto-arabic",
  display: "swap",
  preload: false,
});

export const notoNaskhArabic = Noto_Naskh_Arabic({
  subsets: ["arabic"],
  weight: ["400"],
  variable: "--font-noto-naskh-arabic",
  display: "swap",
  preload: false,
});

/** Every font variable, for the <html> className of a root layout. */
export const fontVariables = [
  inter,
  instrumentSerif,
  geist,
  geistMono,
  notoSansEthiopic,
  notoSerifEthiopic,
  notoSansArabic,
  notoNaskhArabic,
]
  .map((font) => font.variable)
  .join(" ");
