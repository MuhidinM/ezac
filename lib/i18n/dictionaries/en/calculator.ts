/**
 * English strings for the "calculator" namespace: the Zakat calculator
 * (components/landing/zakat-calculator.tsx, shown on the home page and on
 * /zakat/calculator) and the /zakat/calculator page around it.
 *
 * {name} placeholders are filled by format() or, in the calculator, by a
 * helper that keeps numbers left-to-right inside Arabic text. Keep every
 * placeholder in a translation; the order may change. am, om and ar mirror
 * this shape.
 */
const calculator = {
  meta: {
    title: "Zakat Calculator",
    description:
      "Calculate your Zakat across cash, gold, business, agriculture, livestock and more, with a transparent breakdown before you pay.",
    keywords:
      "Zakat calculator, calculate Zakat, nisab, gold price Ethiopia, silver price Ethiopia, Zakat on gold, Zakat on business, Ushr, livestock Zakat, Hawl",
  },

  /** The /zakat/calculator page around the calculator. */
  page: {
    eyebrow: "Zakat",
    title: "Zakat",
    accent: "Calculator",
    intro:
      "Add only the assets you own and we total your obligation across every category — cash, gold, business, agriculture, livestock and more — with a clear breakdown before you pay.",
    breadcrumbHome: "Home",
    breadcrumbCurrent: "Zakat calculator",
    guide: {
      eyebrow: "The rules in brief",
      title: "How is Zakat calculated?",
      answer:
        "Add up the wealth you have held for a full lunar year (Hawl): cash, gold and silver, trade goods and savings. Take away debts due within the year. If what is left reaches the Nisab, Zakat is 2.5% of it.",
      items: [
        {
          question: "What is Nisab?",
          answer:
            "Nisab is the least wealth on which Zakat is due. It is set by weight: 85 g of fine gold or 595 g of fine silver. The calculator shows today's value in birr from the Commission's published prices.",
        },
        {
          question: "Are crops and livestock calculated the same way?",
          answer:
            "No. Crops are due on harvest day, with no Hawl, at a rate that depends on how the land is watered. Livestock is paid in animals, following the prophetic tables for sheep and goats, cattle and camels.",
        },
        {
          question: "Which debts can I deduct?",
          answer:
            "Short-term debts due within the lunar year, plus the next 12 months of payments on long-term loans. The full balance of a long-term loan is not deducted.",
        },
      ],
      rulesLink: "Read how the Commission applies the rules",
      rulesLinkTitle: "How EZAC calculates, collects and distributes Zakat",
      fatwasLink: "See the Shari'ah Board rulings",
      fatwasLinkTitle: "Fatwas and rulings on Zakat from the EZAC Shari'ah Advisory Board",
    },
  },

  /** The calculator section heading. */
  intro: {
    eyebrow: "Quick Calculator",
    /** {accent} is the highlighted word. */
    title: "Know your {accent} in seconds.",
    titleAccent: "Zakat",
    body: "Add only the assets you actually own. We total your Zakat across all of them and show a clear, transparent breakdown before you pay.",
  },

  /** Official prices line under the heading, and the rates notes. */
  rates: {
    snapshot: "Market snapshot",
    gold24k: "Gold 24k {price} ETB/g",
    silver: "Silver {price} ETB/g",
    nisab: "Nisab ({basis}) ETB {amount}",
    loading: "Loading the official rates…",
    /** Without the official rates there is no Nisab in birr, so wealth Zakat can't be judged. */
    unavailable: "The official rates could not be loaded, so the Nisab in birr can't be checked yet.",
    /** Button that loads the official rates again. */
    retry: "Try again",
    /** Shown when the official prices are more than two days old. {date} is when they were set (Addis Ababa time). */
    stale: "These official prices date from {date}, more than two days ago, so the totals may be out of date.",
    /** Added to every "Why is X due?" explanation while the calculator uses estimates. */
    estimateNote: "These are typical figures: the official rates could not be loaded.",
    basis: { gold: "gold", silver: "silver" },
    errorStatus: "Rates unavailable ({status}).",
    errorIncomplete: "The official rates are incomplete right now.",
    errorGeneric: "Unable to load the official rates.",
  },

  /** Asset categories: chip and panel label, and the "Why is X due?" explanation. */
  categories: {
    cash: {
      label: "Cash & Money",
      ruling:
        "Zakat of {rate} is due on cash, bank and mobile-money balances, plus reliable debts owed to you — once your total wealth meets Nisab and has been held for a full lunar year (Hawl).",
    },
    gold: {
      label: "Gold / Silver",
      ruling:
        "Gold and silver owe {rate} by fine-metal weight (gross grams × karat ÷ 24). Nisab is {goldGrams}g fine gold or {silverGrams}g fine silver. Most scholars include jewellery, whether worn or stored.",
    },
    business: {
      label: "Business",
      ruling:
        "Trade goods bought to resell — inventory, business cash and receivables (less short-term payables) — owe {rate}. Fixed assets such as machinery, vehicles and buildings are exempt.",
    },
    propertyStocks: {
      label: "Property & Stocks",
      ruling:
        "Your home and rental-property value are exempt — only saved rental income is charged. Trading shares owe {rate} of market value; long-term shares owe {rate} of the company's zakatable assets.",
    },
    agriculture: {
      label: "Agriculture",
      ruling:
        "Ushr is due on harvest day, with no Hawl: {rainFedRate} if rain-fed, {mixedRate} if mixed, {irrigatedRate} if irrigated artificially. Nisab is {nisabKg} kg of produce.",
    },
    livestock: {
      label: "Livestock",
      ruling:
        "Due only on freely-grazing (Sa'imah), non-working animals kept for milk or breeding, following the prophetic Nisab tables for sheep/goats, cattle and camels.",
    },
    rikazMinerals: {
      label: "Rikaz / Minerals",
      ruling:
        "Rikaz (buried treasure) owes {rikazRate} immediately, with no Nisab or Hawl. Mined minerals owe {rate} once they reach the Nisab value.",
    },
    debts: {
      label: "Debts & Liabilities",
      ruling:
        "Deduct short-term debts due within the lunar year, plus the next 12 months of long-term loan payments, from your zakatable wealth before the {rate} is applied.",
    },
  },

  /** Adding and removing categories, and the explanation button. */
  actions: {
    addHeading: "Add what you own",
    add: "Add {label}",
    remove: "Remove {label}",
    whyDue: "Why is {label} due?",
    empty: "Add an asset type below to start calculating your Zakat.",
  },

  /** Messages under an amount the calculator cannot read. */
  inputErrors: {
    decimalPoints: "Use one decimal point at most. Separate thousands with commas, e.g. 1,500,000.",
    decimalCommas: "Commas can only separate thousands, before the decimal point.",
    commaGrouping: "Use a point for decimals, e.g. 12.5. Commas can only separate thousands, e.g. 1,500,000.",
    wholeNumber: "Enter a whole number.",
    tooLarge: "This number is too large. Check it and try again.",
    notNumber: "Enter a number, e.g. 1500000.",
  },

  cash: {
    cashOnHand: "Cash on hand (ETB)",
    bankAndMobile: "Bank + mobile money (ETB)",
    goodDebtReceivables: "Reliable debts owed to you (ETB)",
    goodDebtReceivablesHelp: "Include only debts likely to be repaid.",
    doubtfulDebtCollected: "Previously doubtful debt collected this year (ETB)",
  },

  gold: {
    officialPrices: "Official EZAC prices per gram by karat.",
    /** {fineMetal} is shown in bold. */
    nisabRule: "Nisab is measured in {fineMetal} (gross grams × karat ÷ 24): gold {goldGrams}g, silver {silverGrams}g.",
    fineMetal: "fine metal",
    /** {basis} is shown in bold: "gold" or "silver" from rates.basis. */
    basisOfficial: "The commission currently applies the {basis} nisab.",
    basisEstimate: "The Commission's Nisab basis is shown once the official rates load.",
    loading: "Loading official rates...",
    /** Shown when the official rates failed: the metals can't be valued, so the total leaves them out. */
    errorExcluded: "{error} Gold and silver are left out of the total until the official prices load.",
    pricesAsOf: "Prices as of {date}",
    usdEtb: "USD/ETB {rate}",
    metalLabel: "Metal #{number}",
    metals: { gold: "Gold", silver: "Silver" },
    grams: "Grams",
    karat: "Karat",
    karatOption: "{karat}k",
    remove: "Remove",
    removeLabel: "Remove metal item {number}",
    addItem: "Add Metal Item",
    summary:
      "Gold {goldGross}g (fine {goldFine}g) · Silver {silverGross}g (fine {silverFine}g) · value ETB {value}",
  },

  business: {
    businessCash: "Business cash (ETB)",
    inventoryValue: "Inventory market value (ETB)",
    receivables: "Business receivables (ETB)",
    payables: "Short-term business payables (ETB)",
    propertyForResale: "Property bought for resale (ETB)",
    propertyForResaleHelp: "Included as trading asset when intention is resale.",
  },

  propertyStocks: {
    rentalSavings: "Saved rental income (ETB)",
    rentalSavingsHelp: "Rental property value is not charged; saved rental cash is.",
    stocksTrading: "Trading stocks current value (ETB)",
    dividendCash: "Dividend cash held (ETB)",
    longTermAssets: "Long-term company zakatable assets (ETB)",
    longTermAssetsHelp: "Use when company disclosures provide zakatable asset amount.",
  },

  agriculture: {
    harvest: "Harvest amount (kg)",
    harvestHelp: "Nisab starts at {nisabKg} kg. Due on harvest — no Hawl needed.",
    irrigation: "Irrigation method",
    natural: "Natural ({rate})",
    mixed: "Mixed ({rate})",
    artificial: "Artificial ({rate})",
  },

  livestock: {
    typeGroup: "Type of animal",
    types: {
      sheepGoat: "Sheep / Goats",
      cattle: "Cattle / Buffaloes",
      camels: "Camels",
    },
    freelyGrazing: "Freely grazing most of year",
    usedForWork: "Used as working animals",
    sheepGoatCount: "Number of sheep/goats",
    cattleCount: "Number of cattle/buffaloes",
    camelsCount: "Number of camels",
    /** Animals due as Zakat, by the kind codes the zakat service sends. */
    kinds: {
      sheep: "Sheep",
      bint_makhad: "Bint Makhad (1yr female)",
      bint_labun: "Bint Labun (2yr female)",
      hiqqah: "Hiqqah (3yr female)",
      jadhaah: "Jadh'ah (4yr female)",
      tabi: "Tabi' (1yr calf)",
      musinnah: "Musinnah (2yr cow)",
    },
    /** One kind of animal due: "2 Sheep". */
    dueItem: "{count} {kind}",
    dueSeparator: " + ",
  },

  rikazMinerals: {
    rikaz: "Rikaz discovered value (ETB)",
    rikazHelp: "Rikaz is due immediately at {rate}.",
    minerals: "Minerals extracted value (ETB)",
    mineralsHelp: "Minerals charged at {rate} when Nisab is met.",
  },

  debts: {
    shortTerm: "Short-term personal liabilities (ETB)",
    loanPayments: "Next 12 months loan payments (ETB)",
    loanPaymentsHelp: "Deduct upcoming year only, not full long-term loan.",
  },

  result: {
    total: "Your total Zakat",
    hawl: "Held a full lunar year (Hawl)",
    checkAmounts: "Check the amounts marked above to see your total.",
    amount: "ETB {amount}",
    deduction: "− ETB {amount}",
    crops: "+ {amount} kg crops (Ushr)",
    animals: "+ {animals} ({type})",
    breakdown: {
      cash: "Cash & money ({rate})",
      gold: "Gold & silver ({rate})",
      business: "Business ({rate})",
      propertyStocks: "Property & stocks ({rate})",
      rikaz: "Rikaz ({rate})",
      minerals: "Minerals ({rate})",
      liabilities: "Less liabilities",
    },
    netBase: "Net zakatable base",
    nisabThreshold: "Nisab threshold",
    nisabMet: "met",
    nisabBelow: "below",
    nisabStatus: "ETB {amount} · {status}",
    /** The Nisab row while the official rates are missing. */
    nisabUnknown: "Waiting for the official rates",
    /** In place of the total when part of it weighs against a Nisab the calculator doesn't have. */
    needsRates: "Your total needs the official Nisab, which could not be loaded.",
    /** Under every result: the calculator's standing. */
    guidance:
      "This calculator is a guide only. For a ruling on your own situation, ask a qualified scholar or contact the Commission.",
    noHawl: "Wealth has not completed a full lunar year — no wealth Zakat is due yet.",
    belowNisab: "Your net wealth is below Nisab — no wealth Zakat is due yet.",
    noHawlLivestock: "Your animals have not been held for a full lunar year — no livestock Zakat is due yet.",
    pay: "Proceed to Pay Zakat",
    /** Under the disabled pay button while the official rates are unavailable. */
    payNeedsRates: "You can proceed to pay once the official rates load.",
    payTitle: "See how to pay this Zakat in the EZAC app",
    payNote: "You pay in the EZAC app: it shows a QR code that you scan with any Ethiopian bank app.",
    bank: "Cooperative Bank of Oromia",
  },
};

export default calculator;
