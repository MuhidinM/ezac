/**
 * English strings for the "about" namespace: About, Governance, Shari'ah
 * board, Contact, Privacy and the legal document gallery. am, om and ar
 * mirror this shape. Arrays are aligned by position with icons and document
 * links in the page code: translate items in place, never add, drop or
 * reorder them.
 */
const about = {
  /** Names for the BreadcrumbList structured data. */
  breadcrumbs: {
    home: "Home",
    about: "About",
    governance: "Governance",
    shariahBoard: "Shari'ah Advisory Board",
    contact: "Contact",
    privacy: "Privacy policy",
  },

  about: {
    meta: {
      title: "About the Commission",
      description:
        "How the Ethiopian Zakat Commission was established: its legal basis under Proclamation 1207/2020, its founding regulation, mandate, governance, and the official certificates.",
      keywords:
        "Ethiopian Zakat Commission, Proclamation 1207/2020, Ethiopian Islamic Affairs Supreme Council, Majlis, Zakat regulation, Zakat governance, legal documents",
    },
    header: {
      eyebrow: "About Us",
      title: "A commission",
      accent: "established in law",
      intro:
        "The Ethiopian Zakat Commission was set up by the Ethiopian Islamic Affairs Supreme Council, under a federal proclamation, to collect and distribute Zakat with transparency, accountability and trust.",
    },
    why: {
      eyebrow: "Why the Commission exists",
      title: "Zakat, organised the way it deserves",
      paragraphs: [
        "Zakat is one of the five pillars of Islam. The founding regulation sets out to give Ethiopia's Muslim community a system that lets them fulfil it properly, and to make sure Zakat reaches its purpose: helping the community, reducing poverty and contributing to the country's development.",
        "It calls for collection and distribution that are transparent, accountable and trustworthy, follow Shari'ah and the country's laws, and use modern economic systems and technology, run by an institution with legal personality that Zakat payers and recipients can trust.",
      ],
    },
    stats: [
      { value: "1207/2020", label: "Federal proclamation it rests on" },
      { value: "25", label: "Members of the Board of Directors" },
      { value: "9", label: "Scholars on the first Shari'ah Advisory Board" },
      { value: "5 yrs", label: "Board term, at most two in a row" },
    ],
    /** "Source: <document>" lines link to the scans in the documents section. */
    source: {
      label: "Source:",
      linkTitle: "See this document in the official documents below",
    },
    history: {
      eyebrow: "Legal foundation",
      title: "How was the Commission established?",
      intro:
        "Proclamation No. 1207/2020 lets the Ethiopian Islamic Affairs Supreme Council establish religious institutions with their own legal personality. The Council used that power to establish the Commission by regulation; the Commission was then certified as a legal person and registered as a taxpayer.",
      /** Aligned with the document links in app/[lang]/about/page.tsx. */
      items: [
        {
          date: "4 July 2020",
          title: "Proclamation No. 1207/2020",
          body: "The House of Peoples' Representatives grants legal personality to the Ethiopian Islamic Affairs Supreme Council, and to the religious institutions established under it, without further registration. The proclamation requires the Council to run a clear and transparent financial administration.",
          source: "Proclamation No. 1207/2020, Federal Negarit Gazette",
        },
        {
          date: "2018 E.C. (2025)",
          title: "The Zakat Commission regulation",
          body: "Using its power under Article 6(2) of the proclamation, the Supreme Council issues the regulation establishing its Zakat Commission: a religious administration body with its own legal personality, accountable to the Council and independent in its professional and administrative work.",
          source: "Zakat Commission establishment regulation",
        },
        {
          date: "18/10/2018 E.C. (2026)",
          title: "Certificate of Establishment",
          body: "The Supreme Council certifies the Ethiopian Zakat Commission as a legal person under Article 80(1) of the Majlis regulation and Article 2(1) of Proclamation 1207/2020.",
          source: "Certificate of Establishment",
        },
        {
          date: "24 Sene 2018 E.C. (1 July 2026)",
          title: "Registered with the Ministry of Revenues",
          body: "The Commission is registered as a taxpayer in Addis Ababa under medical and social welfare support services.",
          source: "Taxpayer Registration Certificate",
        },
      ],
    },
    mandate: {
      eyebrow: "Mandate",
      title: "What is the Commission charged with?",
      intro: { before: "From Article 4 of the ", link: "establishment regulation", after: "." },
      /** Aligned with the icons in app/[lang]/about/page.tsx. */
      items: [
        {
          title: "Collect Zakat",
          body: "Collect Zakat money and property from individuals and institutions obliged to pay it, in Ethiopia and abroad, according to the principles of Shari'ah and current fatwas.",
        },
        {
          title: "Distribute it to those entitled",
          body: "Distribute what is collected to the people, institutions and works entitled to Zakat, following the same principles.",
        },
        {
          title: "Transparency and trust",
          body: "Build a system where collecting and distributing Zakat is transparent, accountable and trustworthy, run with modern, efficient administration.",
        },
        {
          title: "Reduce poverty",
          body: "Set strategic plans so that Zakat contributes to sustainable poverty reduction, aligned with national poverty reduction programmes.",
        },
        {
          title: "Islamic finance",
          body: "Ensure that interest-free financial institutions pay Zakat on their wealth, working with the National Bank and other public and private institutions.",
        },
        {
          title: "Research and awareness",
          body: "Study Zakat, publish research, hold workshops and training, learn from other countries' experience, and advise on law and policy.",
        },
        {
          title: "Development without touching Zakat",
          body: "Set up development and administrative institutions with other Shari'ah-permitted funds, never from the Zakat collected.",
        },
        {
          title: "Work with others",
          body: "Cooperate with the Supreme Council, Shari'ah courts, the Waqf Commission, government, banks, NGOs, civil society, international bodies and embassies.",
        },
      ],
    },
    governance: {
      eyebrow: "Governance",
      title: "Who runs the Commission?",
      intro:
        "The Commission is accountable to the Supreme Council and independent in its professional and administrative work.",
      items: [
        {
          title: "Board of Directors",
          body: "25 members. The first board was nominated by the President of the Supreme Council and approved by its General Assembly. Members serve five years and at most two consecutive terms. The board leads and supervises the Commission, appoints the Commissioner, issues directives and approves the annual plan and budget.",
        },
        {
          title: "Shari'ah Advisory Board",
          body: "Formed together with the Supreme Council's Ulama Assembly to check that the Commission's work follows Shari'ah and the applicable fatwas. Its first members are 9 scholars.",
        },
        {
          title: "Commissioner",
          body: "The chief executive, accountable to the board. Recommends deputy commissioners for collection and for distribution, manages staff, prepares the plan and budget, and represents the Commission.",
        },
        {
          title: "Control committee",
          body: "An oversight committee within the Commission's structure, alongside the other committees and administrative bodies the work requires.",
        },
      ],
      scope: {
        title: "Where it applies.",
        body: "The regulation binds the Supreme Council at every level, the regional Islamic affairs councils down to the woreda Majlis, mosques and their institutions, and Ethiopian Muslims at home and in the diaspora. Existing Zakat committees are registered, recognised and trained by the Commission. The Commission has its head office and may open branch offices in the regions and abroad.",
      },
      source: "Zakat Commission establishment regulation",
    },
    documents: {
      eyebrow: "Transparency",
      title: "Official documents",
      intro: "The documents that establish and register the Commission, published in full.",
      download: "Download the complete legal documents (PDF, 12 pages, 2.2 MB)",
      downloadTitle: "Download the Commission's legal documents as one PDF file",
    },
    cta: {
      title: "See the mandate at work",
      body: "Follow how Zakat is collected, decided on and paid out, step by step.",
      primary: "How it works",
      primaryTitle: "See how Zakat is collected, decided on and paid out",
      secondary: "Live dashboard",
      secondaryTitle: "Open the live transparency dashboard",
    },
  },

  governance: {
    meta: {
      title: "Governance & Majlis",
      description:
        "How the Ethiopian Zakat & Awqaf Commission is governed — the Majlis, oversight structure, and accountability framework.",
      keywords:
        "Zakat governance, Majlis, Ethiopian Islamic Affairs Supreme Council, Board of Directors, control committee, Zakat accountability",
    },
    header: {
      eyebrow: "About Us",
      title: "Governance &",
      accent: "Majlis",
      intro:
        "EZAC operates under clear religious and institutional governance — the authority of the Majlis, a Board of Directors and a control committee.",
    },
    structure: {
      eyebrow: "Structure",
      title: "How is EZAC governed?",
      intro:
        "The Supreme Council (the Majlis) established the Commission and holds it to account. A 25-member Board of Directors supervises it, and a control committee oversees its work.",
      /** Aligned with the icons in app/[lang]/about/governance/page.tsx. */
      items: [
        {
          title: "The Majlis",
          description:
            "The Ethiopian Islamic Affairs Supreme Council established the Commission under Proclamation 1207/2020. The Commission is accountable to it and independent in its professional and administrative work.",
        },
        {
          title: "Board of Directors",
          description:
            "25 members serving five-year terms, at most two in a row. The board supervises the Commission, appoints the Commissioner, issues directives and approves the plan and budget.",
        },
        {
          title: "Control committee",
          description:
            "An oversight committee is part of the Commission's structure, and every change in the Zakat system is recorded with who made it and when.",
        },
        {
          title: "Public accountability",
          description: "Live figures and impact reports are published openly so the public can hold us to account.",
        },
      ],
    },
    mandate: {
      title: "Mandate & accountability",
      body: "Under its establishment regulation, the Commission collects Zakat in Ethiopia and abroad and distributes it to those entitled, according to Shari'ah and current fatwas, through a system that is transparent, accountable and trustworthy. Funds are reconciled with the bank and reported publicly, so trust is earned through evidence, not assertion.",
      source: { before: "Source: the Commission's ", link: "establishment regulation", after: ", published with its other legal documents." },
      sourceTitle: "See the establishment regulation on the About page",
    },
    cta: {
      title: "Religious assurance you can rely on",
      body: "Our Shari'ah Advisory Board guides the Commission's rulings on Zakat and Waqf.",
      primary: "Meet the Shari'ah board",
      primaryTitle: "Read about the Shari'ah Advisory Board and its mandate",
      secondary: "Read the legal documents",
      secondaryTitle: "See the Commission's founding documents on the About page",
    },
  },

  shariahBoard: {
    meta: {
      title: "Shari'ah Advisory Board",
      description:
        "The Shari'ah Advisory Board and its mandate: guidance on Zakat and Waqf rulings, review of the calculator's rules and oversight of how funds are distributed.",
      keywords: "Shari'ah Advisory Board, Zakat fatwas, Ulama Assembly, Shari'ah compliance, Islamic scholars Ethiopia",
    },
    header: {
      eyebrow: "About Us",
      title: "Shari'ah Advisory",
      accent: "Board",
      intro:
        "An independent body of scholars that safeguards the religious integrity of everything EZAC does — from the calculator's rulings to how funds are distributed.",
    },
    mandate: {
      eyebrow: "Mandate",
      title: "What does the board oversee?",
      /** Aligned with the icons in app/[lang]/about/shariah-board/page.tsx. */
      items: [
        {
          title: "Rulings & fatwas",
          description: "Issues authoritative guidance on Zakat, Waqf, and contemporary financial questions.",
        },
        {
          title: "Product review",
          description: "Reviews calculator rules, Waqf structures and investment products.",
        },
        {
          title: "Disbursement review",
          description: "Confirms that funds reach only eligible categories of beneficiaries under Shari'ah.",
        },
        {
          title: "Appointed with the Ulama Assembly",
          description:
            "Formed together with the Supreme Council's Ulama Assembly. Its first members are nine scholars named under the Commission's establishment regulation.",
        },
      ],
    },
    process: {
      eyebrow: "Assurance process",
      title: "How does the board review an item?",
      steps: [
        { title: "Review", body: "Each product, rule, or disbursement policy is submitted to the board for study." },
        { title: "Deliberate", body: "Scholars assess it against Qur'an, Sunnah, and established fiqh." },
        { title: "Advise", body: "The board gives its opinion before an item goes live." },
      ],
    },
    cta: {
      title: "Read the rulings",
      body: "Explore the fatwas and Islamic rulings on Zakat that guide the Commission.",
      primary: "View fatwas & rulings",
      primaryTitle: "Read the fatwas and Islamic rulings on Zakat",
      secondary: "About our governance",
      secondaryTitle: "Read how the Commission is governed",
    },
  },

  contact: {
    meta: {
      title: "Contact Support",
      description:
        "Get in touch with the Ethiopian Zakat & Awqaf Commission by email or phone, or write to us from this page.",
      keywords: "contact EZAC, Zakat support, Waqf support, Zakat payment help, Addis Ababa",
    },
    header: {
      eyebrow: "Support",
      title: "Contact",
      accent: "support",
      intro: "Questions about Zakat, Waqf or a payment? Reach us through any channel below and our team will help.",
    },
    channels: {
      eyebrow: "Reach us",
      title: "Get in touch",
      email: "Email",
      emailTitle: "Write to {email} from your email app",
      phone: "Phone",
      phoneTitle: "Call {phone}",
      office: "Office",
      officeValue: "Addis Ababa, Ethiopia",
    },
    form: {
      title: "Send us a message",
      /** The form opens the visitor's email app; nothing is sent from the website itself. */
      note: "This opens your email app with a message to {email}. If nothing opens, write to that address from your own email account.",
      name: "Your name",
      email: "Email address",
      message: "Message",
      submit: "Continue in your email app",
    },
  },

  /** A template awaiting legal review: the wording stays as it is until the Commission's legal office signs it off. */
  privacy: {
    meta: {
      title: "Privacy Policy",
      description:
        "How the Ethiopian Zakat & Awqaf Commission collects, uses, and protects your personal and financial information.",
      keywords: "EZAC privacy policy, personal data, Zakat payment data, data protection, household data",
    },
    header: {
      eyebrow: "Legal",
      title: "Privacy",
      accent: "policy",
      intro: "How we collect, use, and protect your personal and financial information across EZAC services.",
    },
    sections: [
      {
        heading: "Overview",
        paragraphs: [
          "The Ethiopian Zakat & Awqaf Commission (“EZAC”, “we”) is committed to protecting your privacy. This policy explains what information we collect, how we use it, and the choices you have. It applies to our website, calculator, and donation services.",
        ],
      },
      {
        heading: "Information we collect",
        paragraphs: [
          "We collect information you provide directly — such as your name, contact details, and the figures you enter to calculate or pay Zakat. Where you make a payment, our regulated payment partners process your transaction details on our behalf.",
          "We also collect limited technical information, such as device and usage data, to operate and secure the service.",
        ],
      },
      {
        heading: "How we use your information",
        paragraphs: [
          "We use your information to calculate your obligation, process and reconcile payments, assess households, issue certificates, and report on impact. We do not sell your personal information.",
        ],
      },
      {
        heading: "Households we support",
        paragraphs: [
          "When a household applies for support, our staff record what is needed to assess it: its members, income, assets, housing and health, and a bank account for payment. This information, the household's score and every decision about it are visible only to the staff who handle the case, and are never published.",
          "Public figures on this website are totals. An impact story about a family is published only with their consent.",
        ],
      },
      {
        heading: "Data security & retention",
        paragraphs: [
          "We apply technical and organisational safeguards to protect your data, and retain it only as long as necessary for the purposes above or as required by law and audit obligations.",
        ],
      },
      {
        heading: "Your rights & contact",
        paragraphs: [
          "You may request access to, correction of, or deletion of your personal information, subject to legal and audit requirements. To exercise these rights or ask questions about this policy, please contact our support team.",
        ],
      },
    ],
  },

  /** The scanned legal documents on /about#documents (components/site/document-gallery.tsx). */
  documents: {
    gallery: {
      view: "View",
      /** Screen reader name of the "View" button. Keep {view} in it so it matches the visible word. */
      viewLabel: "{view} {title} full size",
      open: "Open",
      openTitle: "Open the {title} scan in a new tab",
      download: "Download",
      downloadTitle: "Download the {title} scan (JPG image)",
      close: "Close the document viewer",
    },
    items: {
      certificate: {
        title: "Certificate of Establishment",
        issuer: "Ethiopian Islamic Affairs Supreme Council",
        date: "18/10/2018 E.C.",
        summary:
          "Grants the Ethiopian Zakat Commission legal personality under Proclamation 1207/2020. Signed by the President of the Supreme Council and the Ulama Assembly.",
        alt: "Certificate of Establishment of the Ethiopian Zakat Commission from the Ethiopian Islamic Affairs Supreme Council, in Amharic, English and Arabic, dated 18/10/2018, signed and sealed",
      },
      taxpayer: {
        title: "Taxpayer Registration Certificate",
        issuer: "Ministry of Revenues",
        date: "1 July 2026",
        summary:
          "Registration with the federal Ministry of Revenues, Addis Ababa, under medical and social welfare support services.",
        alt: "Taxpayer Registration Certificate from the Ministry of Revenues, issued 24 Sene 2018 (1 July 2026), with the registered address in Addis Ababa and the seal of the issuing authority",
      },
      proclamation: {
        title: "Proclamation No. 1207/2020",
        issuer: "Federal Negarit Gazette",
        date: "4 July 2020",
        summary:
          "The federal law that gives the Supreme Council, and the institutions it establishes, legal personality.",
        alt: "First page of the Federal Negarit Gazette of 4 July 2020 with Proclamation No. 1207/2020 in Amharic and English",
      },
      regulation: {
        title: "Zakat Commission establishment regulation",
        issuer: "Ethiopian Islamic Affairs Supreme Council",
        date: "2018 E.C. / 1447 AH",
        summary:
          "The regulation that establishes the Commission and sets out its mandate, board, Shari'ah advisory board and Commissioner.",
        alt: "Cover of the Supreme Council's regulation establishing the Zakat Commission, Regulation No. 3/2018, in Amharic, with the Council's seal",
      },
    },
  },
};

export default about;
