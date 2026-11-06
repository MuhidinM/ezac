/**
 * English strings for the landing page (app/[lang]/page.tsx) and its sections
 * in components/landing. am, om and ar mirror this shape. Headings with an
 * orange accent word are split into { before, accent, after } so a
 * translation can move the accent; leave a part empty when it has no text.
 */
const home = {
  meta: {
    title: "EZAC — Ethiopian Zakat and Awqaf Commission",
    description:
      "Ethiopia's trusted digital home for Zakat and Waqf. Calculate Zakat with live nisab prices, pay by QR from any Ethiopian bank app, and follow every birr.",
    keywords:
      "Zakat calculator Ethiopia, pay Zakat, nisab today, gold price Ethiopia, Waqf Ethiopia, Zakat causes, Ethiopian Zakat and Awqaf Commission",
  },
  hero: {
    title: {
      accent1: "Trusted",
      text1: "Zakat.",
      accent2: "Eternal",
      text2: "Waqf.",
    },
    body: "Ethiopia's trusted digital home for Zakat and Waqf. Calculate, give, and endow with mathematical precision and radical transparency — every birr traced from your hand to the families and futures it builds.",
    calculate: { label: "Calculate Your Zakat", title: "Open the Zakat calculator" },
    receive: {
      label: "How to Receive Zakat",
      title: "How households are registered to receive Zakat",
    },
    partnersLabel: "In collaboration with",
    partners: {
      coopbank: { alt: "Coopbank Alhuda", title: "Visit the Coopbank Alhuda website (opens in a new tab)" },
      dxvalley: { alt: "DX Valley", title: "Visit the DX Valley website (opens in a new tab)" },
    },
  },
  trustStrip: {
    eyebrow: "Built on trusted infrastructure",
    title: "Precision, transparency, accessibility.",
    link: { label: "See how it works", title: "How Zakat is collected, checked and paid out" },
    items: {
      nisab: { label: "Live Nisab Pricing", sub: "Gold and silver prices updated daily" },
      households: { label: "Assessed Households", sub: "Visited, scored and approved at a branch" },
      qr: { label: "Pay by QR", sub: "From any Ethiopian bank app" },
      languages: { label: "Four Languages", sub: "English, Amharic, Afaan Oromoo and Arabic" },
      dashboard: { label: "Real-Time Dashboard", sub: "Public figures, refreshed every few minutes" },
    },
  },
  ticker: {
    ariaLabel: "Live impact ticker",
    live: "Live Impact",
    groupLabel: "Live impact figures. Hover or focus to pause.",
    /** An amount in birr. */
    etb: "ETB {amount}",
    /** A price in birr per gram. */
    etbPerGram: "ETB {amount}/g",
    nisabGold: "Nisab today (gold)",
    nisabSilver: "Nisab today (silver)",
    gold24k: "Gold 24k",
    collected: "Zakat Collected",
    thisMonth: "This Month",
    families: "Families Supported",
    distributed: "Funds Distributed",
    lives: "Lives Touched",
    projects: "Active Causes",
  },
  causes: {
    eyebrowUrgent: "Urgent needs",
    eyebrowOpen: "Open causes",
    eyebrowEmpty: "Causes",
    title: { before: "Causes your", accent: "Zakat", after: "reaches." },
    intro: "Causes across Ethiopia, each reviewed before it is listed and showing its progress toward its goal.",
    introEmpty: "No causes are open right now. New causes appear here as soon as the Commission publishes them.",
    seeAll: { label: "See all causes", title: "Browse every open cause" },
    eyebrowClosed: "Recently completed",
    introClosed: "No causes are open right now. These recently completed causes show where Zakat has gone.",
    seeClosed: { label: "See all completed causes", title: "Causes that have closed and what they raised" },
    howReaches: { label: "How Zakat reaches families", title: "How households are assessed and paid" },
  },
  howItWorks: {
    eyebrow: "Transparency, verification, security",
    title: "How is your Zakat kept safe?",
    intro:
      "Shari'ah scholars guide the rules, every household is assessed before it is paid, and every payment is matched to a bank record.",
    step: "Step {n}",
    steps: [
      {
        title: "Shari'ah Guidance",
        description: "A Shari'ah Advisory Board, set up under the Commission's establishment regulation, guides how Zakat is calculated and distributed.",
      },
      {
        title: "Assessed, Scored Households",
        description:
          "Every household is visited, scored against a published points table and approved at its branch before head office pays it by bank transfer.",
      },
      {
        title: "Bank-Matched, Logged",
        description:
          "Payments in are matched to bank transactions, payouts go only to bank-checked accounts, and every change is logged.",
      },
    ],
    cta: { label: "See the full process", title: "Read how Zakat is collected, checked and paid out, step by step" },
  },
  impactMap: {
    eyebrow: "Nationwide visibility",
    title: { before: "Where support", accent: "reaches", after: "." },
    mapLabel: "Map of regions reached",
    beneficiaries: "{count} beneficiaries",
    distributed: "ETB {amount} distributed",
    projects: "{count} active causes",
    noFigures: "No figures published yet",
    dashboardLink: {
      label: "View Full Transparency Dashboard",
      title: "Open the live transparency dashboard",
    },
  },
  partners: {
    eyebrow: "Institutional backing",
    title: { before: "Partners", accent: "& sponsors", after: "." },
    names: {
      majlis: "Supreme Council of Islamic Affairs (Majlis)",
      coopbank: "Coopbank Alhuda",
      dxvalley: "DX Valley",
      fayda: "Fayda",
      ethswitch: "EthSwitch",
    },
    /** Tooltip on a partner's logo link. */
    visit: "Visit the {name} website (opens in a new tab)",
  },
};

export default home;
