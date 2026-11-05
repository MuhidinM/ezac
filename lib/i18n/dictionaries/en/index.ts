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
 */
const en = { common, home, calculator, about, giving, transparency };

export type Dictionary = typeof en;

export default en;
