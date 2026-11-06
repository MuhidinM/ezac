/**
 * English strings for the "giving" namespace: Pay Zakat, Corporate Zakat,
 * Donate, the three Waqf pages, the causes list and cause page, the cause card
 * (also on the home page) and the certificate check (on How it works).
 * am, om and ar mirror this shape (lib/i18n/messages.ts).
 *
 * - Lists (`items`) are paired with their icons by position: keep the order
 *   and don't add or drop items.
 * - {placeholders} are filled in by the page with format(); keep them as they
 *   are in a translation, in whatever position the sentence needs.
 * - Link `...Title` strings become the link's title attribute (shown on hover):
 *   say where the link goes or what it does.
 * - Cause titles and descriptions come from the zakat service as the admin
 *   typed them; they are not in this file.
 */
const giving = {
  breadcrumbs: {
    home: "Home",
  },

  pay: {
    meta: {
      title: "Pay Zakat Now",
      description:
        "Pay your Zakat by QR code from any Ethiopian bank app, straight into the Commission's account, and get a certificate anyone can verify.",
      keywords:
        "pay Zakat, pay Zakat online, Zakat payment Ethiopia, QR payment, bank app, Zakat certificate, Cooperative Bank of Oromia",
    },
    breadcrumb: "Pay Zakat",
    hero: {
      eyebrow: "Zakat",
      title: "Pay Zakat",
      accent: "now",
      intro:
        "Pay in a few taps from your bank app, straight into the Commission's account, where each payment is matched to the bank's own record.",
    },
    channels: {
      eyebrow: "Ways to give",
      title: "Simple, bank-to-bank",
      intro: "Payments run through the national QR payment network and are reconciled with the bank.",
      items: [
        {
          title: "QR from any bank app",
          description:
            "Scan the QR code in the EZAC app with the mobile app of any Ethiopian bank. No card or wallet needed.",
        },
        {
          title: "Straight to the Commission",
          description:
            "The money goes directly into the Commission's account at Cooperative Bank of Oromia, with no intermediary holding it.",
        },
        {
          title: "Confirmed against the bank",
          description:
            "Each payment is matched to the bank's own transaction record before it counts, and one transaction can confirm only one payment.",
        },
        {
          title: "Traceable receipt",
          description:
            "Every confirmed payment issues a numbered certificate that anyone can verify on the How it works page.",
        },
      ],
    },
    steps: {
      eyebrow: "How it works",
      title: "How do I pay Zakat?",
      intro:
        "In three steps: work out what you owe, pay by QR code from your bank app, and get a certificate anyone can verify.",
      items: [
        {
          title: "Calculate your obligation",
          body: "Use the Zakat calculator to find the exact amount due across all your assets.",
        },
        {
          title: "Scan the QR",
          body: "In the EZAC app, choose the general fund or a cause, then scan the QR code with your bank app. It's valid for 30 minutes.",
        },
        {
          title: "Get your certificate",
          body: "The payment is confirmed against the bank's record and you receive a numbered certificate you can verify any time.",
        },
      ],
    },
    app: {
      title: "Get the EZAC app",
      body: "You pay in the EZAC app. It is available for Android phones only, as a direct download (APK file) rather than from an app store.",
      download: "Download the Android app",
      downloadNote: "(APK file, opens in a new tab)",
      downloadTitle: "Download the EZAC app for Android as an APK file (opens in a new tab)",
    },
    cta: {
      title: "Know your number first",
      body: "Work out exactly what you owe, then pay with confidence.",
      primary: "Open the calculator",
      primaryTitle: "Open the Zakat calculator",
      secondary: "See where it goes",
      secondaryTitle: "See where Zakat goes on the live transparency dashboard",
    },
  },

  corporate: {
    meta: {
      title: "Corporate Zakat",
      description:
        "Asset-level Zakat calculation, disbursement to assessed households, and board-ready impact reporting for companies and institutions.",
      keywords:
        "corporate Zakat, company Zakat, business Zakat, institutional Zakat, Zakat assessment, CSR reporting, Ethiopia",
    },
    breadcrumb: "Corporate Zakat",
    hero: {
      eyebrow: "Zakat",
      title: "Corporate",
      accent: "Zakat",
      intro:
        "A managed service for companies and institutions — accurate assessment, compliant disbursement, and transparent reporting at scale.",
    },
    features: {
      eyebrow: "What you get",
      title: "Built for organisations",
      intro: "From a single ledger to a nationwide CSR programme, corporate Zakat is handled end to end.",
      items: [
        {
          title: "Clear calculation",
          description:
            "Company assets assessed asset by asset, with the working shown so your finance team can check it.",
        },
        {
          title: "Bulk disbursement",
          description:
            "Your contribution joins the pool of assessed, branch-approved households and is paid out by bank transfer, fully reconciled.",
        },
        {
          title: "Impact reporting",
          description: "Board-ready and CSR reports that tie every birr to measurable, verifiable outcomes.",
        },
        {
          title: "Shari'ah guidance",
          description: "Assessments follow the rulings of the EZAC Shari'ah Advisory Board, and open questions are referred to it.",
        },
      ],
    },
    process: {
      eyebrow: "The process",
      title: "How does corporate Zakat work?",
      intro: "Four steps take you from the first conversation to a checked figure and a report for your board.",
      items: [
        {
          title: "Engage our corporate desk",
          body: "Tell us about your organisation, sector, and reporting requirements.",
        },
        {
          title: "Submit financials",
          body: "Share the disclosures needed to assess zakatable assets securely.",
        },
        {
          title: "Review & confirm",
          body: "We compute the figure, go through it with you, and refer any Shari'ah question to the board.",
        },
        {
          title: "Disburse & report",
          body: "Funds are distributed to verified causes and reported back to your board.",
        },
      ],
    },
    cta: {
      title: "Discuss your corporate Zakat",
      body: "Our corporate desk will scope assessment, disbursement, and reporting around your needs.",
      primary: "Contact the corporate desk",
      primaryTitle: "Contact the EZAC corporate desk",
      secondary: "Estimate with the calculator",
      secondaryTitle: "Estimate your Zakat with the calculator",
    },
  },

  donate: {
    meta: {
      title: "Donate",
      description:
        "Give Zakat, Sadaqah, Zakat al-Fitr, or endow a Waqf — securely, transparently, and traceably through EZAC.",
      keywords: "donate, give Zakat, Sadaqah, Zakat al-Fitr, Waqf, Islamic charity, Ethiopia",
    },
    breadcrumb: "Donate",
    hero: {
      eyebrow: "Give",
      title: "Donate",
      accent: "now",
      intro:
        "Choose how you'd like to give. Every contribution — obligatory or voluntary — is traced from your hand to the families and futures it builds.",
    },
    ways: {
      eyebrow: "Ways to give",
      title: "What can I give through EZAC?",
      intro:
        "Zakat, Sadaqah, Zakat al-Fitr or a Waqf endowment. Payments go through Ethiopian banks and are matched to the bank's own record.",
      items: [
        {
          title: "Zakat",
          description: "Fulfil your obligation precisely. Calculate what's due, then pay through a trusted channel.",
        },
        {
          title: "Sadaqah",
          description: "Give voluntary charity, any amount, any time — directed to the causes that move you.",
        },
        {
          title: "Zakat al-Fitr",
          description: "Pay the per-person Fitr charity before Eid, distributed to families in time for the day.",
        },
        {
          title: "Waqf endowment",
          description: "Make a perpetual gift whose returns support the community for generations.",
        },
      ],
    },
    cta: {
      title: "Ready to give?",
      body: "Start with your Zakat obligation, or choose one of the causes open right now.",
      primary: "Calculate & pay Zakat",
      primaryTitle: "Work out your Zakat with the calculator, then pay",
      secondary: "See open causes",
      secondaryTitle: "See the causes open for giving right now",
    },
  },

  waqf: {
    crowdfunding: {
      meta: {
        title: "Waqf Crowdfunding",
        description:
          "How Waqf crowdfunding will let many people fund one lasting project together. Projects will be listed here once the Commission publishes them.",
        keywords: "Waqf crowdfunding, Waqf project, endowment, Islamic crowdfunding, community project, Ethiopia",
      },
      breadcrumb: "Waqf crowdfunding",
      hero: {
        eyebrow: "Waqf",
        title: "Waqf",
        accent: "crowdfunding",
        intro:
          "Waqf crowdfunding will let many people fund one lasting endowment together, such as a water point or a school, that keeps giving long after it is funded.",
      },
      projects: {
        eyebrow: "Projects",
        title: "No projects are listed yet",
        intro:
          "Waqf projects will be listed here once the Commission publishes them. Until then, nothing can be funded on this page.",
        causes: {
          title: "Give to an open Zakat cause",
          body: "See the causes accepting Zakat right now, with their goals and what has been raised.",
          linkTitle: "See the causes accepting Zakat right now",
        },
        contact: {
          title: "Talk to our team",
          body: "Ask about endowing a Waqf or about upcoming projects.",
          linkTitle: "Contact the EZAC team about a Waqf",
        },
      },
      howItWorks: {
        eyebrow: "How it will work",
        title: "How will Waqf crowdfunding work?",
        intro:
          "Many people give toward one project. The asset they fund is kept, and only what it earns or provides goes to the cause.",
        items: [
          {
            title: "Many givers, one project",
            description:
              "Each person gives what they can toward a single Waqf project, so together they can fund something no one could fund alone.",
          },
          {
            title: "The principal is kept",
            description:
              "A Waqf is not spent. The endowed asset is kept, and only what it earns or provides goes to the cause.",
          },
          {
            title: "Lasting benefit",
            description: "Once a project is funded, it keeps serving the community for years after the last gift.",
          },
        ],
      },
      cta: {
        title: "Have an asset to endow?",
        body: "Property, cash or shares can become a lasting Waqf. Our team will guide you through each step.",
        primary: "Register a Waqf asset",
        primaryTitle: "How to register an asset as a Waqf",
        secondary: "Explore Waqf investments",
        secondaryTitle: "How endowed Waqf capital is invested",
      },
    },
    investments: {
      meta: {
        title: "Waqf Investments",
        description:
          "How endowed Waqf capital is invested in ethical, Shari'ah-compliant assets so the principal is preserved and the returns fund causes forever.",
        keywords:
          "Waqf investment, cash Waqf, Shari'ah-compliant investment, endowment, perpetual charity, Ethiopia",
      },
      breadcrumb: "Waqf investments",
      hero: {
        eyebrow: "Waqf",
        title: "Waqf",
        accent: "investments",
        intro:
          "A Waqf endowment is invested, not spent. The principal is protected forever while its returns are channelled into the causes you care about — year after year.",
      },
      principles: {
        eyebrow: "How it works",
        title: "How does a Waqf keep giving?",
        intro:
          "Waqf turns a one-time gift into a permanent income stream for the community: the endowed capital is kept and invested, and only its returns are spent.",
        items: [
          {
            title: "Perpetual principal",
            description:
              "The endowed capital is preserved in perpetuity — only the returns it generates are spent on causes.",
          },
          {
            title: "Shari'ah-compliant assets",
            description:
              "Capital is placed only in screened, halal asset classes approved by the Shari'ah Advisory Board.",
          },
          {
            title: "Returns fund causes",
            description: "Investment income flows continuously to water, education, healthcare, and poverty relief.",
          },
          {
            title: "Compounding impact",
            description:
              "As the endowment grows, so does the annual giving it can sustain — a gift that keeps giving.",
          },
        ],
      },
      cta: {
        title: "Build a lasting endowment",
        body: "Register an asset as Waqf and let it generate ongoing support for generations to come.",
        primary: "Register a Waqf asset",
        primaryTitle: "How to register an asset as a Waqf",
        secondary: "Talk to our team",
        secondaryTitle: "Contact the EZAC team about a Waqf",
      },
    },
    registerAsset: {
      meta: {
        title: "Register a Waqf Asset",
        description:
          "Endow property, cash, shares, or agricultural land as a perpetual Waqf — registered, documented, and managed under EZAC governance.",
        keywords: "register a Waqf, Waqf asset, endow property, cash Waqf, Waqf deed, agricultural land Waqf, Ethiopia",
      },
      breadcrumb: "Register a Waqf asset",
      hero: {
        eyebrow: "Waqf",
        title: "Register a Waqf",
        accent: "asset",
        intro:
          "Dedicate property, cash, shares, or land as a perpetual endowment. We handle documentation, Shari'ah review, and ongoing management so your gift gives forever.",
      },
      assets: {
        eyebrow: "What you can endow",
        title: "What can I endow as a Waqf?",
        intro: "Property, cash, shares and securities, and agricultural land can all be registered as a Waqf.",
        items: [
          {
            title: "Property & real estate",
            description: "Buildings and land whose rental income perpetually supports designated causes.",
          },
          {
            title: "Cash Waqf",
            description: "Monetary endowments pooled and invested, with only the returns disbursed.",
          },
          {
            title: "Shares & securities",
            description: "Shari'ah-compliant equities and sukuk dedicated as a lasting endowment.",
          },
          {
            title: "Agricultural land",
            description: "Farmland whose harvest or lease income funds community programmes.",
          },
        ],
      },
      process: {
        eyebrow: "The process",
        title: "From intent to endowment",
        items: [
          {
            title: "Declare your intent",
            body: "Tell us the asset you wish to endow and the causes you want it to serve.",
          },
          {
            title: "Document & verify",
            body: "We verify ownership and prepare the Waqf deed with Shari'ah oversight.",
          },
          {
            title: "Endow & manage",
            body: "The asset is registered as Waqf and professionally managed on your behalf.",
          },
        ],
      },
      cta: {
        title: "Start your Waqf registration",
        body: "Registration starts with a conversation: contact our endowment team and we'll guide you through each step.",
        primary: "Begin registration",
        primaryTitle: "Contact the endowment team to begin registration",
        secondary: "How Waqf investments work",
        secondaryTitle: "Read how endowed Waqf capital is invested",
      },
    },
  },

  /** The causes list (/causes) and the labels shared with the cause card and cause page. */
  causes: {
    meta: {
      title: "Causes",
      description: "Verified causes across Ethiopia that your Zakat supports, with transparent progress toward every goal.",
      keywords: "Zakat causes, verified causes, give to a cause, charity projects Ethiopia, Sadaqah",
      closedTitle: "Completed causes",
      closedDescription: "Causes across Ethiopia that have closed, with what each one raised toward its goal.",
    },
    breadcrumb: "Causes",
    hero: {
      eyebrow: "Zakat",
      title: "Causes",
      accent: "you can support",
      intro:
        "Every cause is reviewed before it's listed. Urgent needs come first; each shows how much has been raised so far.",
    },
    filter: {
      label: "Cause status",
      active: "Open now",
      activeTitle: "Show the causes open now",
      closed: "Completed",
      closedTitle: "Show the causes that have closed",
      seeClosed: { label: "See {count} completed causes", title: "Causes that have closed and what they raised" },
    },
    /** Visually hidden heading above the list, so headings run in order. */
    listHeading: {
      active: "Causes open now",
      closed: "Completed causes",
    },
    empty: {
      active: "No causes are open right now. Your Zakat still reaches families through the general fund.",
      closed: "No completed causes yet.",
    },
    /** Category values set by the admin (lib/zakat/content.ts CONTENT_CATEGORIES). */
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
    badges: {
      urgent: "Urgent",
      essential: "Essential",
    },
    cta: {
      title: "Not sure where to give?",
      body: "The general Zakat fund reaches verified families wherever the need is greatest.",
      primary: "Pay Zakat now",
      primaryTitle: "How to pay Zakat in the EZAC app",
      secondary: "See our impact",
      secondaryTitle: "See our impact on the live transparency dashboard",
    },
  },

  /** The cause card on the home page and /causes. */
  causeCard: {
    imageAlt: "Photo: {title}",
    raisedOfGoal: "ETB {raised} of {goal}",
    raisedOnly: "ETB {raised}",
    goalOnly: "Goal: ETB {goal}",
    raised: "Raised",
    percent: "{pct}%",
    goalReached: "Goal reached",
    give: "Give your Zakat",
    support: "Support this cause",
    giveTitle: "How to give in the EZAC app",
    seeResult: "See the result",
    seeResultTitle: "See the result of {title}",
  },

  /** One cause (/causes/[id]). Its title, description and story come from the zakat service. */
  cause: {
    meta: {
      fallbackTitle: "Cause",
      keywords: "Zakat cause, give Zakat, charity project, Ethiopia",
    },
    coverAlt: "Photo: {title}",
    galleryAlt: "Photo {n} of {count}: {title}",
    amount: "ETB {amount}",
    noAmount: "—",
    raised: "Raised",
    raisedOfGoal: "Raised of ETB {goal}",
    progressLabel: "Raised toward the goal",
    percentOfGoal: "{pct}% of the goal",
    goalReached: "Goal reached",
    region: "Region",
    closed: "Closed",
    ended: "Ended",
    ends: "Ends",
    zakatEligible: "Zakat eligible",
    yes: "Yes",
    no: "No",
    closedNote: "This cause has closed. Thank you to everyone who gave.",
    give: "Give your Zakat",
    support: "Support this cause",
    giveTitle: "How to give in the EZAC app",
    paymentNote: "Payments are made in the EZAC app through Cooperative Bank of Oromia.",
    cta: {
      title: "See where Zakat goes",
      body: "Follow collection and distribution across Ethiopia on the live dashboard.",
      primary: "Live dashboard",
      primaryTitle: "Open the live transparency dashboard",
      secondary: "All causes",
      secondaryTitle: "See all causes",
    },
  },

  /** The certificate check on How it works (components/site/certificate-verify.tsx). */
  certificate: {
    label: "Certificate number",
    placeholder: "Certificate number, e.g. ZC-2026-000451",
    verify: "Verify",
    checking: "Checking…",
    /** {id} is the certificate number, shown in a monospace font. */
    genuine: "{id} is a genuine certificate",
    notFound: "No certificate with the number {id}. Check it and try again.",
    badNumber: "That doesn't look like a certificate number.",
    couldNotCheck: "Couldn't check the certificate. Try again in a moment.",
    amount: "Amount",
    amountValue: "ETB {amount}",
    type: "Zakat",
    paidOn: "Paid on",
    none: "—",
  },
};

export default giving;
