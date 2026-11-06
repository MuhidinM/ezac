import type { Messages } from "@/lib/i18n/messages";

import about from "./about";
import calculator from "./calculator";
import common from "./common";
import giving from "./giving";
import home from "./home";
import transparency from "./transparency";

/**
 * The English dictionary: the source every other language is checked
 * against (lib/i18n/messages.ts). One namespace per area of the site:
 * - common: shell (navigation, footer, errors, language switcher)
 * - home: the landing page sections
 * - calculator: the Zakat calculator
 * - about: About, governance, Shari'ah board, contact, privacy
 * - giving: pay, corporate, donate, causes, Waqf pages, certificate check
 * - transparency: transparency pages, how it works, fatwas, FAQ
 *
 * House terms for English (the translations have their own lists in
 * docs/translation-review/<lang>-glossary.md). One word per concept:
 * - Majlis, never Mejlis: the Ethiopian Islamic Affairs Supreme Council.
 * - cause / causes for what Zakat is given to ("Active causes"), never
 *   "project" or "campaign". "Waqf project" is a different thing.
 * - The Shari'ah Advisory Board ("the board") guides and reviews. Say
 *   "reviewed" for what the Commission or the board checks, never
 *   "certified" or "compliant", which claim a sign-off nobody has published.
 * - Payments are "matched to the bank's record". Say "audited" only for
 *   figures or reports backed by a published audit report.
 * - An Arabic term keeps an English gloss: "Poor (Faqir)", "In the cause of
 *   Allah (Fi sabilillah)". Fiqh terms the calculator explains (Nisab, Hawl,
 *   Ushr, Rikaz) may stand alone.
 * - Amounts: "ETB 1,234", the code before the number.
 */
const en = { common, home, calculator, about, giving, transparency };

/** Read-only: pages and components only read the text, and every language shares this shape. */
export type Dictionary = Messages<typeof en>;

export default en;
