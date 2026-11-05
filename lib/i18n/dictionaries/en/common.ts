/**
 * Strings shared by every public page: site name, skip link, language
 * switcher, error pages. The site-shell work adds the navigation and footer
 * here. English is the source; am, om and ar must have the same keys.
 */
const common = {
  site: {
    name: "EZAC",
    organization: "Ethiopian Zakat and Awqaf Commission",
    tagline: "Ethiopia's trusted digital home for Zakat and Waqf. Calculate, give, and endow with precision and transparency.",
    defaultTitle: "EZAC — Ethiopian Zakat and Awqaf Commission",
    keywords: "Zakat, Waqf, Awqaf, Ethiopia, Zakat calculator, nisab, Sadaqah, Islamic charity, EZAC",
  },
  skipToContent: "Skip to content",
  language: {
    label: "Language",
    choose: "Choose a language",
    current: "Current language",
  },
  errors: {
    notFoundEyebrow: "Page not found",
    notFoundTitle: "We couldn't find",
    notFoundAccent: "that page",
    notFoundBody: "The link may be wrong, or the page may have moved or been taken down.",
    goHome: "Go to the home page",
    seeCauses: "See open causes",
    errorEyebrow: "Something went wrong",
    errorTitle: "Something went wrong",
    errorAccent: "on our side",
    errorBody: "The page couldn't load. Try again in a moment.",
    tryAgain: "Try again",
    reference: "Reference: {digest}",
  },
};

export default common;
