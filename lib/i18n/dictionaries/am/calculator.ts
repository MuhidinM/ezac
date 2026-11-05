import type { Messages } from "@/lib/i18n/messages";
import type en from "../en/calculator";

/**
 * Amharic strings for the "calculator" namespace: the Zakat calculator and the
 * /zakat/calculator page around it. Every {placeholder} from the English source
 * is kept. "ብር" is both the currency and the metal silver in Amharic, so money
 * amounts keep the "ETB" code and prose says "የኢትዮጵያ ብር" for the currency.
 */
const calculator: Messages<typeof en> = {
  meta: {
    title: "የዘካ ማስያ",
    description:
      "በጥሬ ገንዘብ፣ በወርቅ፣ በንግድ፣ በግብርና፣ በቁም እንስሳት እና በሌሎችም ሀብቶችዎ ላይ ያለብዎትን ዘካ ያስሉ፤ ከመክፈልዎ በፊት ግልጽ ዝርዝሩን ይመልከቱ።",
    keywords:
      "የዘካ ማስያ, ዘካ ማስላት, የዘካት ማስያ, ኒሷብ, የወርቅ ዋጋ በኢትዮጵያ, የብር ዋጋ በኢትዮጵያ, የወርቅ ዘካ, የንግድ ዘካ, ዑሽር, የእንስሳት ዘካ, ሐውል",
  },

  page: {
    eyebrow: "ዘካ",
    title: "የዘካ",
    accent: "ማስያ",
    intro:
      "ያለዎትን ሀብት ብቻ ያስገቡ፤ በሁሉም ዘርፍ — በጥሬ ገንዘብ፣ በወርቅ፣ በንግድ፣ በግብርና፣ በቁም እንስሳት እና በሌሎችም — ያለብዎትን ግዴታ ደምረን ከመክፈልዎ በፊት ግልጽ ዝርዝሩን እናሳይዎታለን።",
    breadcrumbHome: "ዋና ገጽ",
    breadcrumbCurrent: "የዘካ ማስያ",
    guide: {
      eyebrow: "ደንቦቹ በአጭሩ",
      title: "ዘካ እንዴት ይሰላል?",
      answer:
        "ለአንድ ሙሉ የጨረቃ ዓመት (ሐውል) በእጅዎ የቆየውን ሀብት ይደምሩ፦ ጥሬ ገንዘብ፣ ወርቅና ብር፣ የንግድ ሸቀጦች እና ቁጠባ። በዓመቱ ውስጥ የሚከፈሉ ዕዳዎችን ይቀንሱ። ቀሪው ኒሷብ ላይ ከደረሰ ዘካው የዚያው 2.5% ነው።",
      items: [
        {
          question: "ኒሷብ ምንድን ነው?",
          answer:
            "ኒሷብ ዘካ ግዴታ የሚሆንበት ዝቅተኛው የሀብት መጠን ነው። የሚወሰነው በክብደት ነው፦ 85 ግራም ንጹሕ ወርቅ ወይም 595 ግራም ንጹሕ ብር። ማስያው ኮሚሽኑ ይፋ ባደረገው ዋጋ መሠረት የዛሬውን ዋጋ በኢትዮጵያ ብር ያሳያል።",
        },
        {
          question: "ሰብልና የቁም እንስሳት በተመሳሳይ መንገድ ይሰላሉ?",
          answer:
            "አይደለም። የሰብል ዘካ ሐውል ሳይጠበቅ በመከር ቀን ይከፈላል፤ ምጣኔው መሬቱ ውሃ በሚያገኝበት መንገድ ይወሰናል። የቁም እንስሳት ዘካ ደግሞ ለበግና ፍየል፣ ለከብትና ለግመል ከነቢዩ በተላለፉት ሰንጠረዦች መሠረት በእንስሳት ይከፈላል።",
        },
        {
          question: "የትኞቹን ዕዳዎች መቀነስ እችላለሁ?",
          answer:
            "በጨረቃ ዓመቱ ውስጥ የሚከፈሉ የአጭር ጊዜ ዕዳዎችን እና በረጅም ጊዜ ብድሮች ላይ ለሚቀጥሉት 12 ወራት የሚከፈለውን ክፍያ። የረጅም ጊዜ ብድር ሙሉ ቀሪ ሂሳብ አይቀነስም።",
        },
      ],
      rulesLink: "ኮሚሽኑ ደንቦቹን እንዴት እንደሚተገብር ያንብቡ",
      rulesLinkTitle: "EZAC ዘካን እንዴት እንደሚያሰላ፣ እንደሚሰበስብ እና እንደሚያከፋፍል",
      fatwasLink: "የሸሪዓ ቦርዱን ብይኖች ይመልከቱ",
      fatwasLinkTitle: "ከEZAC የሸሪዓ አማካሪ ቦርድ በዘካ ላይ የተሰጡ ፈትዋዎችና ብይኖች",
    },
  },

  intro: {
    eyebrow: "ፈጣን ማስያ",
    title: "ያለብዎትን {accent} በሰከንዶች ይወቁ።",
    titleAccent: "ዘካ",
    body: "በእርግጥ ያለዎትን ሀብት ብቻ ያስገቡ። በሁሉም ላይ ያለብዎትን ዘካ ደምረን ከመክፈልዎ በፊት ግልጽ ዝርዝሩን እናሳይዎታለን።",
  },

  rates: {
    snapshot: "የዛሬ የገበያ ዋጋ",
    gold24k: "ወርቅ 24 ካራት {price} ETB/ግራም",
    silver: "ብር {price} ETB/ግራም",
    nisab: "ኒሷብ ({basis}) ETB {amount}",
    loading: "ይፋዊ ዋጋዎቹ እየተጫኑ ነው…",
    unavailable:
      "ይፋዊ ዋጋዎቹን መጫን አልተቻለም። ከታች ያሉት ድምሮች በግምታዊ ዋጋ የተሰሉ ስለሆኑ እንደ ግምታዊ መመሪያ ብቻ ይውሰዷቸው።",
    estimateNote: "እነዚህ የተለመዱ አኃዞች ናቸው፤ ይፋዊ ዋጋዎቹን መጫን አልተቻለም።",
    basis: { gold: "ወርቅ", silver: "ብር" },
    errorStatus: "ዋጋዎቹ አይገኙም ({status})።",
    errorIncomplete: "ይፋዊ ዋጋዎቹ በአሁኑ ጊዜ ያልተሟሉ ናቸው።",
    errorGeneric: "ይፋዊ ዋጋዎቹን መጫን አልተቻለም።",
  },

  categories: {
    cash: {
      label: "ጥሬ ገንዘብ",
      ruling:
        "በጥሬ ገንዘብ፣ በባንክና በሞባይል ገንዘብ ሂሳብ ቀሪዎች እንዲሁም ሰዎች ሊከፍሉዎት በሚገባ አስተማማኝ ዕዳ ላይ {rate} ዘካ ይከፈላል — ጠቅላላ ሀብትዎ ኒሷብ ላይ ሲደርስና ሙሉ የጨረቃ ዓመት (ሐውል) ሲቆይ።",
    },
    gold: {
      label: "ወርቅ / ብር",
      ruling:
        "በወርቅና በብር ላይ በንጹሕ ማዕድን ክብደታቸው (ጠቅላላ ግራም × ካራት ÷ 24) {rate} ዘካ ይከፈላል። ኒሷቡ {goldGrams} ግራም ንጹሕ ወርቅ ወይም {silverGrams} ግራም ንጹሕ ብር ነው። አብዛኞቹ ምሁራን የሚለበስም ሆነ የተቀመጠ ጌጣጌጥን ያካትታሉ።",
    },
    business: {
      label: "ንግድ",
      ruling:
        "መልሶ ለመሸጥ የተገዙ የንግድ ሸቀጦች — የሸቀጥ ክምችት፣ የንግድ ጥሬ ገንዘብ እና ተሰብሳቢ ሂሳቦች (የአጭር ጊዜ ተከፋይ ሂሳቦች ተቀንሰው) — {rate} ዘካ አለባቸው። እንደ ማሽነሪ፣ ተሽከርካሪና ሕንፃ ያሉ ቋሚ ንብረቶች ከዘካ ነፃ ናቸው።",
    },
    propertyStocks: {
      label: "ንብረትና አክሲዮን",
      ruling:
        "የመኖሪያ ቤትዎና የሚያከራዩት ንብረት ዋጋ ከዘካ ነፃ ነው — ዘካ የሚታሰበው በተቀመጠው የኪራይ ገቢ ላይ ብቻ ነው። ለንግድ የተያዙ አክሲዮኖች ከገበያ ዋጋቸው {rate}፣ ለረጅም ጊዜ የተያዙ አክሲዮኖች ደግሞ ከኩባንያው ዘካ የሚታሰብበት ሀብት {rate} ዘካ አለባቸው።",
    },
    agriculture: {
      label: "ግብርና",
      ruling:
        "ዑሽር ሐውል ሳይጠበቅ በመከር ቀን ይከፈላል፦ በዝናብ ከለማ {rainFedRate}፣ በዝናብና በመስኖ ከለማ {mixedRate}፣ በሰው ሠራሽ መስኖ ከለማ {irrigatedRate}። ኒሷቡ {nisabKg} ኪ.ግ. ምርት ነው።",
    },
    livestock: {
      label: "የቁም እንስሳት",
      ruling:
        "ዘካ የሚገባው በነፃ ግጦሽ በሚመገቡ (ሳኢማ)፣ ለሥራ በማይውሉ እና ለወተት ወይም ለመራቢያ በሚያዙ እንስሳት ላይ ብቻ ነው፤ ይህም ለበግ/ፍየል፣ ለከብትና ለግመል ከነቢዩ በተላለፉት የኒሷብ ሰንጠረዦች መሠረት ነው።",
    },
    rikazMinerals: {
      label: "ሪካዝ / ማዕድናት",
      ruling:
        "ሪካዝ (የተቀበረ ውድ ሀብት) ኒሷብና ሐውል ሳይጠበቅ ወዲያውኑ {rikazRate} ዘካ አለበት። ተቆፍረው የሚወጡ ማዕድናት ዋጋቸው ኒሷብ ላይ ሲደርስ {rate} ዘካ አለባቸው።",
    },
    debts: {
      label: "ዕዳዎችና ግዴታዎች",
      ruling:
        "{rate} ዘካው ከመታሰቡ በፊት በጨረቃ ዓመቱ ውስጥ የሚከፈሉ የአጭር ጊዜ ዕዳዎችን እና የረጅም ጊዜ ብድርዎን የሚቀጥሉት 12 ወራት ክፍያ ዘካ ከሚታሰብበት ሀብትዎ ላይ ይቀንሱ።",
    },
  },

  actions: {
    addHeading: "ያለዎትን ሀብት ያክሉ",
    add: "{label} ያክሉ",
    remove: "{label} ያስወግዱ",
    whyDue: "{label}፦ ዘካ ለምን ይገባል?",
    empty: "ዘካዎን ማስላት ለመጀመር ከታች የሀብት ዓይነት ያክሉ።",
  },

  inputErrors: {
    decimalPoints: "ከአንድ በላይ የአስርዮሽ ነጥብ አይጠቀሙ። ሺዎችን በኮማ ይለዩ፤ ለምሳሌ 1,500,000።",
    decimalCommas: "ኮማ መጠቀም የሚቻለው ከአስርዮሽ ነጥቡ በፊት ሺዎችን ለመለየት ብቻ ነው።",
    commaGrouping: "ለአስርዮሽ ነጥብ ይጠቀሙ፤ ለምሳሌ 12.5። ኮማ ሺዎችን ለመለየት ብቻ ነው፤ ለምሳሌ 1,500,000።",
    wholeNumber: "ሙሉ ቁጥር ያስገቡ።",
    tooLarge: "ይህ ቁጥር በጣም ትልቅ ነው። አረጋግጠው እንደገና ይሞክሩ።",
    notNumber: "ቁጥር ያስገቡ፤ ለምሳሌ 1500000።",
  },

  cash: {
    cashOnHand: "በእጅ ያለ ጥሬ ገንዘብ (ETB)",
    bankAndMobile: "ባንክ + የሞባይል ገንዘብ (ETB)",
    goodDebtReceivables: "ሊከፈልዎ የሚገባ አስተማማኝ ዕዳ (ETB)",
    goodDebtReceivablesHelp: "ይመለሳሉ ተብለው የሚጠበቁ ዕዳዎችን ብቻ ያካትቱ።",
    doubtfulDebtCollected: "ቀደም ሲል አጠራጣሪ የነበረና ዘንድሮ የተሰበሰበ ዕዳ (ETB)",
  },

  gold: {
    officialPrices: "የEZAC ይፋዊ የአንድ ግራም ዋጋ በካራት።",
    estimatedPrices: "የአንድ ግራም ግምታዊ ዋጋ በካራት።",
    nisabRule: "ኒሷብ የሚለካው በ{fineMetal} ነው (ጠቅላላ ግራም × ካራት ÷ 24)፦ ወርቅ {goldGrams} ግራም፣ ብር {silverGrams} ግራም።",
    fineMetal: "ንጹሕ ማዕድን ክብደት",
    basisOfficial: "ኮሚሽኑ በአሁኑ ጊዜ የሚጠቀመው የ{basis} ኒሷብን ነው።",
    basisEstimate: "ይፋዊ ዋጋዎቹ እስኪጫኑ ድረስ ይህ ግምት የ{basis} ኒሷብን ይጠቀማል።",
    loading: "ይፋዊ ዋጋዎቹ እየተጫኑ ነው…",
    errorFallback: "{error} በምትኩ ግምታዊ ዋጋዎችን እየተጠቀምን ነው።",
    pricesAsOf: "ዋጋዎቹ የተወሰዱበት ቀን፦ {date}",
    usdEtb: "USD/ETB {rate}",
    metalLabel: "ማዕድን ቁ. {number}",
    metals: { gold: "ወርቅ", silver: "ብር" },
    grams: "ግራም",
    karat: "ካራት",
    karatOption: "{karat} ካራት",
    remove: "ያስወግዱ",
    removeLabel: "{number}ኛውን የማዕድን ንጥል ያስወግዱ",
    addItem: "ማዕድን ያክሉ",
    summary:
      "ወርቅ {goldGross} ግራም (ንጹሕ {goldFine} ግራም) · ብር {silverGross} ግራም (ንጹሕ {silverFine} ግራም) · ዋጋ ETB {value}",
  },

  business: {
    businessCash: "የንግድ ጥሬ ገንዘብ (ETB)",
    inventoryValue: "የሸቀጥ ክምችት የገበያ ዋጋ (ETB)",
    receivables: "የንግድ ተሰብሳቢ ሂሳቦች (ETB)",
    payables: "የአጭር ጊዜ የንግድ ተከፋይ ሂሳቦች (ETB)",
    propertyForResale: "መልሶ ለመሸጥ የተገዛ ንብረት (ETB)",
    propertyForResaleHelp: "ዓላማው መልሶ መሸጥ ሲሆን እንደ ንግድ ሀብት ይታሰባል።",
  },

  propertyStocks: {
    rentalSavings: "የተቀመጠ የኪራይ ገቢ (ETB)",
    rentalSavingsHelp: "በሚከራየው ንብረት ዋጋ ላይ ዘካ አይታሰብም፤ በተቀመጠው የኪራይ ገንዘብ ላይ ግን ይታሰባል።",
    stocksTrading: "ለንግድ የተያዙ አክሲዮኖች የአሁኑ ዋጋ (ETB)",
    dividendCash: "በእጅ ያለ የትርፍ ድርሻ ገንዘብ (ETB)",
    longTermAssets: "የረጅም ጊዜ አክሲዮን፦ ዘካ የሚታሰብበት የኩባንያ ሀብት (ETB)",
    longTermAssetsHelp: "ኩባንያው ዘካ የሚታሰብበትን የሀብት መጠን ይፋ ካደረገ ይህን ይጠቀሙ።",
  },

  agriculture: {
    harvest: "የምርት መጠን (ኪ.ግ.)",
    harvestHelp: "ኒሷቡ ከ{nisabKg} ኪ.ግ. ይጀምራል። በመከር ጊዜ ይከፈላል — ሐውል አያስፈልገውም።",
    irrigation: "የውሃ አጠጣጥ ዘዴ",
    natural: "በዝናብ ({rate})",
    mixed: "በዝናብና በመስኖ ({rate})",
    artificial: "በመስኖ ({rate})",
  },

  livestock: {
    typeGroup: "የእንስሳው ዓይነት",
    types: {
      sheepGoat: "በግ / ፍየል",
      cattle: "ከብት / ጎሽ",
      camels: "ግመል",
    },
    freelyGrazing: "ዓመቱን በአብዛኛው በነፃ ግጦሽ የሚመገቡ",
    usedForWork: "ለሥራ የሚውሉ እንስሳት",
    sheepGoatCount: "የበግ/ፍየል ብዛት",
    cattleCount: "የከብት/ጎሽ ብዛት",
    camelsCount: "የግመል ብዛት",
    kinds: {
      sheep: "በግ",
      bint_makhad: "ቢንት መኻድ (የ1 ዓመት እንስት)",
      bint_labun: "ቢንት ለቡን (የ2 ዓመት እንስት)",
      hiqqah: "ሒቃ (የ3 ዓመት እንስት)",
      jadhaah: "ጀዝዓ (የ4 ዓመት እንስት)",
      tabi: "ተቢዕ (የ1 ዓመት ጥጃ)",
      musinnah: "ሙሲና (የ2 ዓመት ላም)",
    },
    dueItem: "{count} {kind}",
    dueSeparator: " + ",
  },

  rikazMinerals: {
    rikaz: "የተገኘው ሪካዝ ዋጋ (ETB)",
    rikazHelp: "ሪካዝ ወዲያውኑ {rate} ዘካ ይከፈልበታል።",
    minerals: "ተቆፍረው የወጡ ማዕድናት ዋጋ (ETB)",
    mineralsHelp: "ማዕድናት ኒሷብ ላይ ሲደርሱ {rate} ዘካ ይከፈልባቸዋል።",
  },

  debts: {
    shortTerm: "የአጭር ጊዜ የግል ዕዳዎች (ETB)",
    loanPayments: "የሚቀጥሉት 12 ወራት የብድር ክፍያዎች (ETB)",
    loanPaymentsHelp: "የሚመጣውን ዓመት ክፍያ ብቻ ይቀንሱ እንጂ ሙሉውን የረጅም ጊዜ ብድር አይደለም።",
  },

  result: {
    total: "ጠቅላላ ዘካዎ",
    hawl: "ሀብቱ ሙሉ የጨረቃ ዓመት (ሐውል) ቆይቷል",
    checkAmounts: "ድምሩን ለማየት ከላይ ምልክት የተደረገባቸውን መጠኖች ያረጋግጡ።",
    amount: "ETB {amount}",
    deduction: "− ETB {amount}",
    crops: "+ {amount} ኪ.ግ. ሰብል (ዑሽር)",
    animals: "+ {animals} ({type})",
    breakdown: {
      cash: "ጥሬ ገንዘብ ({rate})",
      gold: "ወርቅና ብር ({rate})",
      business: "ንግድ ({rate})",
      propertyStocks: "ንብረትና አክሲዮን ({rate})",
      rikaz: "ሪካዝ ({rate})",
      minerals: "ማዕድናት ({rate})",
      liabilities: "ተቀናሽ ዕዳዎች",
    },
    netBase: "ዘካ የሚታሰብበት የተጣራ ሀብት",
    nisabThreshold: "የኒሷብ መጠን",
    nisabMet: "ደርሷል",
    nisabBelow: "አልደረሰም",
    nisabStatus: "ETB {amount} · {status}",
    noHawl: "ሀብቱ ሙሉ የጨረቃ ዓመት አልሞላም — እስካሁን የሀብት ዘካ አይገባም።",
    belowNisab: "የተጣራ ሀብትዎ ከኒሷብ በታች ነው — እስካሁን የሀብት ዘካ አይገባም።",
    pay: "ዘካ ለመክፈል ይቀጥሉ",
    payTitle: "ይህን ዘካ በEZAC መተግበሪያ እንዴት እንደሚከፍሉ ይመልከቱ",
    payNote: "ክፍያው የሚፈጸመው በEZAC መተግበሪያ ነው፦ መተግበሪያው በማንኛውም የኢትዮጵያ ባንክ መተግበሪያ የሚቃኙትን QR ኮድ ያሳያል።",
    bank: "የኦሮሚያ ኅብረት ሥራ ባንክ",
  },
};

export default calculator;
