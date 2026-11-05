/**
 * Strings shared by every public page: site name, skip link, language
 * switcher, navigation, footer, error pages. English is the source; am, om and
 * ar must have the same keys. `title` strings are link tooltips: say where the
 * link goes or what it does, not the link text again.
 */
const common = {
  site: {
    name: "EZAC",
    organization: "Ethiopian Zakat and Awqaf Commission",
    tagline: "Ethiopia's trusted digital home for Zakat and Waqf. Calculate, give, and endow with precision and transparency.",
    defaultTitle: "EZAC — Ethiopian Zakat and Awqaf Commission",
    keywords: "Zakat, Waqf, Awqaf, Ethiopia, Zakat calculator, nisab, Sadaqah, Islamic charity, EZAC",
    logoAlt: "EZAC logo",
  },
  skipToContent: "Skip to content",
  /** Added (visually hidden) after the text of links that open a new tab. */
  newTab: "(opens in a new tab)",
  language: {
    label: "Language",
    choose: "Choose a language",
    current: "Current language",
    /** Tooltip on each language in the switcher. */
    switchTo: "Read this page in {language}",
  },
  nav: {
    ariaLabel: "Main",
    mobileAriaLabel: "Main menu",
    home: {
      tagline: "Ethiopian Zakat & Awqaf Commission",
      title: "Go to the EZAC home page",
    },
    groups: {
      zakat: "Zakat",
      waqf: "Waqf",
      transparency: "Transparency & Impact",
      about: "About Us",
    },
    links: {
      calculator: { label: "Zakat Calculator", title: "Open the Zakat calculator" },
      pay: { label: "Pay Zakat Now", title: "See how to pay your Zakat" },
      causes: { label: "Causes", title: "See the causes your Zakat supports" },
      corporate: { label: "Corporate Zakat", title: "Zakat for companies and businesses" },
      waqfCrowdfunding: { label: "Waqf Crowdfunding", title: "Give together to Waqf projects" },
      waqfInvestments: { label: "Waqf Investments", title: "See how Waqf assets are invested" },
      waqfRegister: { label: "Register a Waqf Asset", title: "Register an asset as Waqf with the Commission" },
      dashboard: { label: "Live Dashboard", title: "See live collection and distribution figures" },
      howItWorks: { label: "How It Works", title: "How Zakat is collected, checked and paid out" },
      stories: { label: "Impact Stories", title: "Read stories of the people and projects Zakat reached" },
      reports: { label: "Impact Reports", title: "Read the Commission's published reports" },
      about: { label: "About the Commission", title: "Who we are and what the Commission does" },
      documents: { label: "Legal Documents", title: "Read the Commission's legal documents" },
      governance: { label: "Governance & Majlis", title: "How the Commission is governed" },
      shariahBoard: { label: "Shari'ah Advisory Board", title: "Meet the Shari'ah Advisory Board" },
    },
    donate: { label: "Donate Now", title: "Give to an open cause" },
    staffSignIn: { label: "Staff sign-in", title: "Sign in to the staff portal (staff only)" },
    openMenu: "Open menu",
    closeMenu: "Close menu",
    menuTitle: "Menu",
    menuDescription: "Pages on the EZAC website",
  },
  footer: {
    ariaLabel: "Footer",
    app: {
      eyebrow: "Mobile access",
      title: "Get the citizen app",
      body: "For Android phones only. The app is a direct download (APK file), not from an app store.",
      download: "Download the Android app",
      downloadNote: "(APK file, opens in a new tab)",
      downloadTitle: "Download the EZAC citizen app for Android (APK file, opens in a new tab)",
    },
    links: {
      privacy: { label: "Privacy Policy", title: "How we collect, use and protect your data" },
      faq: { label: "FAQ", title: "Answers to common questions about Zakat and EZAC" },
      fatwas: { label: "Fatwas / Islamic Rulings on Zakat", title: "Read the rulings the Zakat rules follow" },
      contact: { label: "Contact Support", title: "Get help from the EZAC team" },
    },
    copyright: "© {year} EZAC. All rights reserved.",
    developedBy: "Developed and sponsored by DX Valley.",
    developedByTitle: "Visit the DX Valley website (opens in a new tab)",
  },
  errors: {
    notFound: {
      metaTitle: "Page not found",
      eyebrow: "Page not found",
      title: "We couldn't find",
      accent: "that page",
      body: "The link may be wrong, or the page may have moved or been taken down.",
      goHome: { label: "Go to the home page", title: "Go to the EZAC home page" },
      seeCauses: { label: "See open causes", title: "See the causes open for Zakat now" },
    },
    error: {
      metaTitle: "Something went wrong",
      eyebrow: "Error",
      title: "Something went",
      accent: "wrong",
      body: "The problem is on our side, not yours. Try again in a moment.",
      tryAgain: "Try again",
      goHome: { label: "Go to the home page", title: "Go to the EZAC home page" },
      contact: {
        before: "If it keeps happening,",
        link: "contact us",
        after: "and quote this reference.",
        title: "Contact the EZAC team",
      },
      reference: "Reference:",
    },
  },
};

export default common;
