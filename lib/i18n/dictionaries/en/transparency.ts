/**
 * English strings for the "transparency" namespace: the live dashboard,
 * impact reports, impact stories, How it works, Fatwas and the FAQ. am, om
 * and ar mirror this shape.
 *
 * Arrays are aligned by position with icons in the page code (How it works
 * steps and safeguards): translate items in place, never add, drop or
 * reorder them. {name} placeholders are filled by format() in the page.
 * Story, report and region text from the zakat service is shown as entered
 * and is not translated here.
 */
const transparency = {
  /** Names for the BreadcrumbList structured data. */
  breadcrumbs: {
    home: "Home",
    dashboard: "Live dashboard",
    reports: "Impact reports",
    stories: "Impact stories",
    howItWorks: "How it works",
    fatwas: "Fatwas and rulings",
    faq: "FAQ",
  },

  /** Shown in place of a figure that hasn't been published yet. */
  notPublished: "—",

  /** Story categories, keyed by the value the admin sets (lib/zakat/content.ts CONTENT_CATEGORIES). */
  categories: {
    education: "Education",
    water: "Water",
    health: "Health",
    food: "Food",
    shelter: "Shelter",
    livelihood: "Livelihood",
    emergency: "Emergency",
    general: "General",
  },

  /** The eligible categories (asnaf), keyed by the value the zakat service sends (lib/backoffice/options.ts ASNAF). */
  asnaf: {
    poor: "Poor (Faqir)",
    needy: "Needy (Miskin)",
    zakat_administrator: "Zakat administrator (Amil)",
    muallaf: "Muallaf",
    freeing_captives: "Freeing captives (Riqab)",
    debtor: "Debtor (Gharim)",
    fi_sabilillah: "Fi sabilillah",
    stranded_traveler: "Stranded traveller (Ibn sabil)",
    other: "Other",
  },

  dashboard: {
    meta: {
      title: "Live Dashboard",
      description:
        "Published figures on Zakat collected, families supported, and funds distributed across Ethiopia.",
      keywords:
        "Zakat dashboard, Zakat collected, Zakat distributed, Zakat transparency, beneficiaries, asnaf, Zakat by region, Ethiopia",
    },
    header: {
      eyebrow: "Transparency & Impact",
      title: "Live",
      accent: "dashboard",
      intro:
        "Public and traceable. Follow Zakat collection and distribution across Ethiopia, figures published as they are recorded.",
    },
    glance: {
      eyebrow: "At a glance",
      title: "The numbers",
      asOf: "Published figures as of {date}.",
      noDate: "Published figures. A dash means the figure hasn't been published yet.",
    },
    stats: {
      totalCollected: "Zakat collected (all time)",
      collectedThisMonth: "Collected this month",
      familiesSupported: "Families supported",
      fundsDistributed: "Funds distributed",
      livesTouched: "Lives touched",
      activeProjects: "Active projects",
    },
    /** {percent} is the change, e.g. "12.5%". */
    trend: "{percent} vs last month",
    /** Read by screen readers in place of the ▲ / ▼ arrows. */
    trendUp: "Up",
    trendDown: "Down",
    monthly: {
      titleBoth: "Zakat collected and distributed per month",
      titleCollected: "Zakat collected per month",
      collected: "Collected",
      distributed: "Distributed",
    },
    asnafTitle: "Families supported, by eligible category (asnaf)",
    regions: {
      caption: "Published figures by region",
      region: "Region",
      beneficiaries: "Beneficiaries",
      fundsDistributed: "Funds distributed",
      activeProjects: "Active projects",
    },
    cta: {
      title: "Want the detail behind the numbers?",
      body: "Download published impact reports or get in touch with our transparency office.",
      primary: "View impact reports",
      primaryTitle: "Open the published impact reports",
      secondary: "Contact us",
      secondaryTitle: "Contact the Commission about these figures",
    },
  },

  reports: {
    meta: {
      title: "Impact Reports",
      description:
        "Audited quarterly and annual reports detailing how Zakat and Waqf funds were collected, invested, and disbursed.",
      keywords:
        "Zakat impact report, Waqf report, audited report, annual report, quarterly report, Zakat transparency, EZAC reports",
    },
    header: {
      eyebrow: "Transparency & Impact",
      title: "Impact",
      accent: "reports",
      intro:
        "Audited, downloadable reports detailing exactly how funds were collected, invested, and distributed — published on a regular cycle.",
    },
    library: {
      eyebrow: "Library",
      title: "Published reports",
      intro: "Each report is reviewed before release.",
    },
    empty: "No reports have been published yet.",
    published: "Published {date}",
    file: "PDF",
    fileWithSize: "PDF · {size}",
    /** Title and screen-reader hint on each report link. */
    linkTitle: "Download {title} (PDF, opens in a new tab)",
    /** Screen-reader hint after each report link's text. */
    newTab: "(opens in a new tab)",
    cta: {
      title: "See the live picture",
      body: "Reports are point-in-time. For continuous figures, follow the live dashboard.",
      primary: "Open the live dashboard",
      primaryTitle: "See Zakat collection and distribution figures as they are published",
    },
  },

  stories: {
    meta: {
      title: "Impact Stories",
      description: "Stories from the families and communities your Zakat has reached, shared with their consent.",
      keywords: "Zakat impact stories, Zakat beneficiaries, Zakat in Ethiopia, charity stories, Zakat results",
    },
    header: {
      eyebrow: "Transparency & Impact",
      title: "Impact",
      accent: "stories",
      intro:
        "What Zakat changes, in the words of the communities it reaches. Every story is shared with the family's consent.",
    },
    empty: "No stories have been published yet.",
    /** Alt text for a story's photo; {title} is the story title as entered. */
    imageAlt: "Photo from the story: {title}",
    cta: {
      title: "Be part of the next story",
      body: "Your Zakat reaches verified families across Ethiopia.",
      primary: "Pay Zakat now",
      primaryTitle: "Pay your Zakat by QR code from any Ethiopian bank app",
      secondary: "See the numbers",
      secondaryTitle: "Open the live transparency dashboard",
    },
  },

  story: {
    meta: {
      /** Used when the story can't be found (the page then shows the 404). */
      fallbackTitle: "Impact story",
      keywords: "Zakat impact story, Zakat beneficiaries, Zakat in Ethiopia",
    },
    published: "Published {date}",
    cta: {
      title: "More stories of impact",
      body: "See what Zakat is changing across Ethiopia.",
      primary: "All stories",
      primaryTitle: "Read all published impact stories",
      secondary: "Pay Zakat now",
      secondaryTitle: "Pay your Zakat by QR code from any Ethiopian bank app",
    },
  },

  howItWorks: {
    meta: {
      title: "How It Works",
      description:
        "The full process behind EZAC: how Zakat is calculated and paid, how households are registered, assessed and scored, how decisions are made, and how support is paid out.",
      keywords:
        "how Zakat works, pay Zakat by QR, Zakat certificate, nisab today, Zakat eligibility, asnaf, need score, Zakat distribution Ethiopia",
    },
    header: {
      eyebrow: "Transparency",
      title: "How EZAC",
      accent: "works",
      intro:
        "From the moment you calculate your Zakat to the day support reaches a family's bank account: every step, every rule and every safeguard, in the open.",
    },
    /** The two cards at the top that jump to the giving and receiving steps. */
    paths: {
      giving: {
        title: "Giving Zakat",
        body: "Calculate, pay by QR, get a verifiable certificate.",
        linkTitle: "Jump to the steps for giving Zakat",
      },
      receiving: {
        title: "Receiving support",
        body: "Register, be assessed and scored, decided on, and paid.",
        linkTitle: "Jump to the steps for receiving support",
      },
    },
    live: {
      collected: "Collected",
      familiesSupported: "Families supported",
      distributed: "Distributed",
      activeCauses: "Active causes",
    },
    step: "Step {n}",
    giving: {
      eyebrow: "Giving",
      title: "How do I pay Zakat through EZAC?",
      intro:
        "You calculate what is due, pay by QR from any Ethiopian bank app, and receive a numbered certificate once the payment is confirmed.",
      /** Aligned with the icons in the page: calculator, QR code, check, certificate. */
      steps: [
        {
          title: "Calculate what is due",
          body: "The calculator applies the published Zakat rules to your cash, gold, silver, business stock, crops and livestock.",
          detail: [
            "Gold and silver prices are fetched every morning at 06:00 (Addis Ababa) from the international market and converted to birr.",
            "If the price feed is down, an administrator enters the day's prices by hand until the next automatic fetch.",
            "The rules (nisab, rates, livestock tables) are versioned: a change creates a new version and the calculator always uses the active one.",
          ],
        },
        {
          title: "Pay by QR from any bank app",
          body: "The EZAC app shows a QR code for the amount. Scan it with any Ethiopian bank app; the money goes straight into the Commission's account at Cooperative Bank of Oromia.",
          detail: [
            "The QR is valid for 30 minutes.",
            "You can pay the general Zakat fund or a specific cause that accepts Zakat.",
          ],
        },
        {
          title: "Confirmed automatically",
          body: "The payment is matched to the bank's own transaction record, then marked paid.",
          detail: [
            "The system keeps checking pending payments with the QR network for up to a day after the QR expires.",
            "One bank transaction can confirm only one payment, so nothing is counted twice.",
            "Anything unclear goes to a person at head office, who checks it with the bank before settling it.",
          ],
        },
        {
          title: "Receive a certificate",
          body: "Every confirmed payment issues a numbered Zakat certificate that anyone can verify below.",
          detail: [] as string[],
        },
      ],
    },
    rules: {
      eyebrow: "The rules in force",
      title: "What does the calculator apply today?",
      intro:
        "It applies the active rules version, shown below. These figures are read live from it, so what you see here is exactly what the calculator uses.",
      nisabTitle: "Nisab and rates",
      nisabBasis: "Nisab basis",
      /** {metal} is gold or silver below. */
      nisabBasisValue: "{metal} ({grams} g)",
      gold: "Gold",
      silver: "Silver",
      nisabToday: "Nisab today",
      goldNisab: "Gold nisab ({grams} g)",
      silverNisab: "Silver nisab ({grams} g)",
      wealth: "Wealth, cash and trade goods",
      wealthAfterDays: "{rate} after {days} lunar days",
      wealthAfterHawl: "{rate} after a full lunar year (Hawl)",
      cropsNisab: "Crops: nisab",
      cropsNisabValue: "{kg} kg",
      cropsRates: "Crops: rain-fed / irrigated",
      cropsRatesValue: "{rainFed} / {irrigated}",
      pricesAsOf: "Prices as of",
      version: "Rules version {version}",
      versionWithSource: "Rules version {version} · prices from {source}",
      livestockTitle: "Livestock",
      sheepGoats: "Sheep and goats",
      camels: "Camels",
      rangeBetween: "{min}–{max}",
      rangeFrom: "{min} and above",
      cattle:
        "Cattle: from {minimum} head, one one-year calf per {tabiPer} and one two-year cow per {musinnahPer}.",
      averagePrices: "Average prices used to value animals: {prices}.",
      animalPrice: "{animal} {price}",
      /** Keys of the livestock price list set by the admin; an unknown key is shown as sent. */
      animals: {
        sheep: "sheep",
        goat: "goat",
        cattle: "cattle",
        camel: "camel",
      },
    },
    certificate: {
      eyebrow: "Check a certificate",
      title: "Is this certificate genuine?",
      intro: "Enter the number printed on a Zakat certificate.",
    },
    receiving: {
      eyebrow: "Receiving",
      title: "How are households chosen for support?",
      intro:
        "By a published process, not by who you know: registration at a branch, a household assessment, a need score, a branch decision, then payment by head office. These are the steps every household goes through.",
      /** Aligned with the icons in the page: branch, clipboard, gauge, decision, inbox, banknote. */
      steps: [
        {
          title: "Registration at a branch",
          body: "Households are registered at their nearest branch, or by a field officer working for that branch.",
          detail: [
            "Each field officer works in exactly one branch and only sees households registered there.",
            "Every new household is checked against existing records for possible duplicates before going further.",
            "A bank account in the household's name is recorded, because support is paid by bank transfer only.",
          ],
        },
        {
          title: "Household assessment",
          body: "A field officer visits and records the household's situation: members and dependants, income, assets, housing, health and vulnerability, plus which of the eight eligible categories (asnaf) apply.",
          detail: [] as string[],
        },
        {
          title: "A need score",
          body: "The answers are turned into one poverty score using the Commission's points table. More points means greater need.",
          detail: [
            "The points table is versioned. Each score records the version it was calculated with, and a later change never rewrites past scores.",
            "Before a new version goes live, its effect is tested on recent assessments.",
          ],
        },
        {
          title: "Branch decision",
          body: "The branch supervisor reviews the assessment with the score and the system's recommendation, then approves, returns it for correction, rejects or defers it, always with a written comment.",
          detail: [] as string[],
        },
        {
          title: "Head office pool",
          body: "Approved households join head office's queue. Head office adds them to the disbursement pool, or declines with a reason. Emergencies can be fast-tracked (see below).",
          detail: [] as string[],
        },
        {
          title: "Payout to the household's bank account",
          body: "Head office pays one pooled household at a time from the Commission's account.",
          detail: [
            "Cooperative Bank of Oromia accounts are paid by internal transfer; other banks through the national instant payment system (IPS).",
            "Before paying, the account is looked up with the bank and the bank's account-holder name is compared with the name on file. A mismatch must be checked and acknowledged by a person.",
            "A prepared payout must be confirmed within 15 minutes or it expires.",
            "Once paid, the household leaves the pool. To be supported again it is assessed again.",
          ],
        },
      ],
    },
    needLevels: {
      eyebrow: "Need levels",
      title: "What does the need score mean?",
      intro:
        "More points means greater need. Where the score lands sets the need level and the recommendation the branch sees; the branch still decides.",
      example: "Example",
      /** Labels inside the example bar, low to high. */
      bands: {
        low: "Low need",
        medium: "Medium",
        high: "High need",
      },
      /** Low, medium, high: aligned with the bar above. */
      levels: [
        { title: "Low need", range: "Below 110", body: "Recommendation: defer and review later" },
        { title: "Medium need", range: "110 to 179", body: "Recommendation: conditional approval" },
        { title: "High need", range: "180 and above", body: "Recommendation: approve" },
      ],
      note: "Example figures, to show how the bands work. The bands are part of the versioned points table and can change; each score keeps the version it was calculated with.",
    },
    urgent: {
      eyebrow: "Urgent cases",
      title: "What happens when a need can't wait?",
      intro:
        "The household can be fast-tracked or given priority. A field officer or branch requests a whitelist mark with evidence; head office decides. It changes the order of the queue, never the score.",
      items: [
        {
          title: "Fast track",
          body: "For emergencies such as disaster, displacement or sudden severe illness. The household joins head office's queue straight away, before a full assessment.",
        },
        {
          title: "Priority",
          body: "For lasting needs such as an orphan in care, severe disability or an elderly person without a carer. The household is still assessed, then listed first.",
        },
      ],
    },
    eligible: {
      eyebrow: "The eight eligible categories",
      title: "Who can receive Zakat?",
      intro:
        "Zakat goes to the eight categories of people named in the Qur'an (9:60). Every assessment records which of them apply to the household.",
      source: "Source:",
      sourceLink: "Qur'an, Surah At-Tawbah 9:60",
      sourceTitle: "Read Surah At-Tawbah 9:60 on Quran.com (opens in a new tab)",
    },
    safeguards: {
      eyebrow: "Safeguards",
      title: "How is every birr kept traceable?",
      intro:
        "Duties are split between roles, scores follow published rules, money moves only through checked bank accounts, and every change is recorded.",
      /** Aligned with the icons in the page. */
      items: [
        {
          title: "Separation of duties",
          body: "Field officers assess, branch supervisors decide, head office pools and pays. Fast-track and priority marks need evidence and a head-office decision.",
        },
        {
          title: "Rules before people",
          body: "Scores come from a versioned points table, not from individual judgement, and every decision carries a written reason.",
        },
        {
          title: "Bank-verified payments",
          body: "Incoming money is matched to bank transactions; outgoing money goes only to an account checked with the bank.",
        },
        {
          title: "Full audit trail",
          body: "Every change to prices, rules, scoring, decisions and payments is recorded with who made it and when.",
        },
        {
          title: "Privacy by design",
          body: "Household details, scores and decisions are visible only to the staff who need them. Public figures are totals, never individuals.",
        },
        {
          title: "Consent for stories",
          body: "An impact story is published only after the family has agreed to it, and never names them without that consent.",
        },
      ],
    },
    cta: {
      title: "See it working",
      body: "Follow collection and distribution month by month on the live dashboard.",
      primary: "Live dashboard",
      primaryTitle: "Open the live transparency dashboard",
      secondary: "Calculate your Zakat",
      secondaryTitle: "Open the Zakat calculator",
    },
  },

  fatwas: {
    meta: {
      title: "Fatwas & Islamic Rulings on Zakat",
      description:
        "Authoritative rulings from the EZAC Shari'ah Advisory Board on Zakat, Waqf, and contemporary financial questions.",
      keywords:
        "Zakat fatwa, Zakat rulings, Islamic rulings, nisab gold or silver, Ushr, Rikaz, Zakat on business assets, Zakat and debts, Shari'ah Advisory Board",
    },
    header: {
      eyebrow: "Knowledge",
      title: "Fatwas & Islamic",
      accent: "rulings",
      intro:
        "Guidance issued by the EZAC Shari'ah Advisory Board. These rulings underpin the calculator's logic and the Commission's disbursement policy.",
    },
    heading: {
      eyebrow: "Rulings",
      title: "Zakat rulings, explained",
      intro: "Each ruling reflects the considered opinion of qualified scholars.",
    },
    /**
     * Answers ending in "Live" are used when today's rules could be loaded and
     * carry their figures; the plain answers are the wording without figures.
     */
    rulings: {
      assets: {
        q: "On which assets is Zakat obligatory?",
        a: "Zakat is due on cash and savings, gold and silver, trade goods, agricultural produce, livestock, and certain modern assets such as tradable shares — once each meets its Nisab and, where required, a full lunar year (Hawl).",
      },
      nisab: {
        q: "Is the Nisab based on gold or silver?",
        a: "Nisab is the value of a set weight of gold or of silver. The Commission's published rules say which one applies, and the calculator converts it to birr at the day's price. The 'How it works' page shows the rules in force today.",
        /** {basis} is gold or silver (see basis below). */
        aLive:
          "Nisab is the value of {goldGrams} g of gold or {silverGrams} g of silver. The rules in force today use the {basis} standard: {basisGrams} g of {basis}, which the calculator converts to birr at the day's price.",
      },
      ushr: {
        q: "When is agricultural Zakat (Ushr) paid?",
        a: "Ushr is due on the day of harvest, with no Hawl required. The rate is higher for rain-fed produce than for irrigated crops, and it applies once the harvest reaches the crop Nisab. The 'How it works' page shows the rates in force today.",
        aLive:
          "Ushr is due on the day of harvest, with no Hawl required: {rainFed} for rain-fed produce, {mixed} for mixed irrigation, and {irrigated} for artificially irrigated crops, once the harvest reaches {nisabKg} kg.",
      },
      business: {
        q: "How is Zakat on business assets calculated?",
        a: "Trade goods bought with the intention of resale — inventory, business cash, and receivables, less short-term payables — are assessed at {rate}. Fixed assets such as machinery, vehicles, and premises are exempt.",
      },
      rikaz: {
        q: "What is the ruling on Rikaz and mined minerals?",
        a: "Rikaz (buried treasure) owes {rikazRate} immediately on discovery, with no Nisab or Hawl. Extracted minerals owe {rate} once they reach the Nisab value.",
      },
      debts: {
        q: "Can long-term debts be deducted before Zakat?",
        a: "Only short-term debts due within the lunar year, and the next twelve months of long-term loan payments, may be deducted. Deducting full long-term debt would unduly keep payers below Nisab.",
      },
    },
    basis: {
      gold: "gold",
      silver: "silver",
    },
    figuresLive: "Figures on this page come from the rules the calculator applies today.",
    figuresLiveVersion: "Figures on this page come from the rules the calculator applies today (version {version}).",
    /** Shown when today's rules couldn't be loaded; the link goes to How it works. */
    figuresMissing: {
      before: "Today's figures could not be loaded. See ",
      link: "How it works",
      after: " for the rules in force.",
      linkTitle: "See the Zakat rules in force today",
    },
    cta: {
      title: "Put the rulings into practice",
      body: "The calculator applies each of these rulings automatically across your assets.",
      primary: "Open the calculator",
      primaryTitle: "Open the Zakat calculator",
      secondary: "Meet the Shari'ah board",
      secondaryTitle: "Meet the scholars on the Shari'ah Advisory Board",
    },
  },

  faq: {
    meta: {
      title: "FAQ",
      description:
        "Answers to common questions about Zakat, Waqf, payments, verification, and how EZAC keeps every birr traceable.",
      keywords:
        "Zakat FAQ, Zakat questions, what is nisab, Zakat on gold jewellery, Zakat and Waqf difference, pay Zakat from abroad, Zakat certificate",
    },
    header: {
      eyebrow: "Support",
      title: "Frequently asked",
      accent: "questions",
      intro:
        "The essentials on Zakat, Waqf, payments, and verification. Can't find your answer? Our support team is one message away.",
    },
    heading: {
      eyebrow: "Answers",
      title: "Common questions",
    },
    items: [
      {
        q: "How is it decided who receives Zakat?",
        a: "By a published process: registration at a branch, a household assessment, a need score from the Commission's points table, a decision by the branch supervisor, and payment by head office. Emergencies can be fast-tracked with evidence. The 'How it works' page explains every step.",
      },
      {
        q: "What is Nisab and how is it set?",
        a: "Nisab is the minimum wealth you must hold before Zakat is due: the value of 85 g of gold or 595 g of silver. The Commission's published rules say which one applies, and the calculator converts it to birr with gold and silver prices updated every morning. The 'How it works' page shows the rules in force today.",
      },
      {
        q: "Do I pay Zakat on gold jewellery I wear?",
        a: "According to the majority of scholars, yes — Zakat is due on gold and silver whether worn or stored, calculated on the fine-metal weight once the Nisab and a full lunar year (Hawl) are met.",
      },
      {
        q: "How is my payment kept secure and traceable?",
        a: "You pay by scanning a QR code with any Ethiopian bank app. The money goes straight into the Commission's account at Cooperative Bank of Oromia, the payment is matched to the bank's own record, and you get a numbered certificate anyone can verify on the 'How it works' page.",
      },
      {
        q: "How do you verify that funds reach the right people?",
        a: "Each household is registered at a branch, checked for duplicates, visited by a field officer and scored against the Commission's points table. The branch supervisor approves it, head office adds it to the pool, and support is paid only to a bank account checked with the bank. Every step is recorded.",
      },
      {
        q: "What is the difference between Zakat and Waqf?",
        a: "Zakat is an annual obligation distributed to eligible recipients. Waqf is a perpetual endowment — the principal is preserved and invested, and only its returns are spent, so it keeps giving indefinitely.",
      },
      {
        q: "Can I give from outside Ethiopia?",
        a: "Payments currently go through Ethiopian bank apps by QR code. If you live abroad but hold an Ethiopian bank account with a mobile app, you can pay the same way.",
      },
    ],
    cta: {
      title: "Still have a question?",
      body: "Reach our support team and we'll get back to you quickly.",
      primary: "Contact support",
      primaryTitle: "Send your question to the support team",
      secondary: "Read the fatwas",
      secondaryTitle: "Read the Shari'ah Advisory Board's rulings on Zakat",
    },
  },
};

export default transparency;
