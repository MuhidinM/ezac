import type { Messages } from "@/lib/i18n/messages";
import type en from "../en/calculator";

const calculator: Messages<typeof en> = {
  meta: {
    title: "Shallagduu Zakaa",
    description:
      "Zakaa keessan maallaqa callaa, warqee, daldala, qonna, horii fi kanneen biroo irratti shallagaa; osoo hin kaffalin dura ibsa ifaa argadhaa.",
    keywords:
      "shallagduu Zakaa, Zakaa shallaguu, Nisaaba, gatii warqee Itoophiyaa, gatii meetii Itoophiyaa, Zakaa warqee, Zakaa daldalaa, Ushrii, Zakaa horii, Hawla, Zakat calculator",
  },

  page: {
    eyebrow: "Zakaa",
    title: "Shallagduu",
    accent: "Zakaa",
    intro:
      "Qabeenya qabdan qofa galchaa; dirqama keessan gosoota hunda irratti — maallaqa callaa, warqee, daldala, qonna, horii fi kanneen biroo — walitti qabnee, osoo hin kaffalin dura ibsa ifaa wajjin isinii agarsiisna.",
    breadcrumbHome: "Fuula Jalqabaa",
    breadcrumbCurrent: "Shallagduu Zakaa",
    guide: {
      eyebrow: "Seerota gabaabinaan",
      title: "Zakaan akkamitti shallagama?",
      answer:
        "Qabeenya waggaa hijraa guutuu (Hawla) qabaattan ida'aa: maallaqa callaa, warqee fi meetii, meeshaalee daldalaa fi qusannaa. Liqaa waggaa sana keessatti kaffalamuu qabu hir'isaa. Wanti hafe Nisaaba yoo ga'e, Zakaan 2.5% isaa ti.",
      items: [
        {
          question: "Nisaabni maali?",
          answer:
            "Nisaabni hamma qabeenyaa xiqqaa Zakaan irratti dirqama ta'u dha. Ulfaatinaan murtaa'a: warqee qulqulluu giraama 85 ykn meetii qulqulluu giraama 595. Shallagduun gatii har'aa birriidhaan, gatii Komishiniin maxxanse irraa, isinii agarsiisa.",
        },
        {
          question: "Midhaanii fi horiin akkuma kanaan shallagamuu?",
          answer:
            "Lakki. Zakaan midhaanii guyyaa sassaabbii, Hawla malee, kaffalama; hammi isaa akkaataa lafti itti bishaan argattuun murtaa'a. Zakaan horii horiidhaan kaffalama; gabateewwan Nabiyyii irraa dabarfaman kan hoolaa fi re'ee, loonii fi gaalaa hordofa.",
        },
        {
          question: "Liqaa kam hir'isuu nan danda'a?",
          answer:
            "Liqaa yeroo gabaabaa waggaa hijraa keessatti kaffalamu, akkasumas kaffaltii liqaa yeroo dheeraa ji'oota 12 itti aananii. Liqaan yeroo dheeraa guutummaatti hin hir'ifamu.",
        },
      ],
      rulesLink: "Akkaataa Komishiniin seerota kana itti hojiirra oolchu dubbisaa",
      rulesLinkTitle: "Akkaataa EZAC Zakaa itti shallagu, sassaabuu fi raabsu",
      fatwasLink: "Murtiiwwan Boordii Shari'aa ilaalaa",
      fatwasLinkTitle: "Fatwaawwanii fi murtiiwwan Zakaa Boordii Gorsa Shari'aa EZAC irraa",
    },
  },

  intro: {
    eyebrow: "Shallagduu Saffisaa",
    title: "{accent} keessan sekondii muraasatti beekaa.",
    titleAccent: "Zakaa",
    body: "Qabeenya dhugumaan qabdan qofa galchaa. Zakaa keessan qabeenya sana hunda irratti walitti qabnee, osoo hin kaffalin dura ibsa ifaa fi iftoomina qabu isinii agarsiisna.",
  },

  rates: {
    snapshot: "Gatii gabaa ammaa",
    gold24k: "Warqee 24k {price} ETB/g",
    silver: "Meetii {price} ETB/g",
    nisab: "Nisaaba ({basis}) ETB {amount}",
    loading: "Gatii ifaa fe'aa jira…",
    unavailable: "Gatiin ifaa fe'amuu waan hin dandeenyeef, Nisaabni qarshiidhaan ammaaf mirkanaa'uu hin danda'u.",
    retry: "Irra deebi'aa yaalaa",
    stale: "Gatiin ifaa kun kan {date} ti, guyyaa lama caalaa dura; kanaaf waliigalli yeroo isaa kan hin eegne ta'uu danda'a.",
    estimateNote: "Kunneen lakkoofsota idilee ti: gatiin ifaa fe'amuu hin dandeenye.",
    basis: { gold: "warqee", silver: "meetii" },
    errorStatus: "Gatiin hin argamne ({status}).",
    errorIncomplete: "Gatiin ifaa amma guutuu miti.",
    errorGeneric: "Gatii ifaa fe'uun hin danda'amne.",
  },

  categories: {
    cash: {
      label: "Maallaqa Callaa",
      ruling:
        "Maallaqa callaa, kan baankii fi maallaqa moobaayilaa keessa jiru, akkasumas liqaa amansiisaa namoota irra qabdan irraa Zakaan {rate} kaffalama — yeroo qabeenyi keessan waliigalaa Nisaaba guutee waggaa hijraa guutuu (Hawla) isin harka ture.",
    },
    gold: {
      label: "Warqee / Meetii",
      ruling:
        "Warqee fi meetii irraa {rate} ulfaatina sibiila qulqulluutiin (giraama waliigalaa × kaaraatii ÷ 24) kaffalama. Nisaabni warqee qulqulluu {goldGrams}g ykn meetii qulqulluu {silverGrams}g dha. Beektonni baay'een faaya, kan uffatamus ta'e kan kuufame, ni dabalatu.",
    },
    business: {
      label: "Daldala",
      ruling:
        "Meeshaalee daldalaa irra deebiin gurguruuf bitaman — meeshaa kuusaa, maallaqa callaa daldalaa fi liqaa isiniif kaffalamuu qabu (liqaa yeroo gabaabaa isin irra jiru erga hir'iftanii) — irraa {rate} kaffalama. Qabeenyi dhaabbataa kan akka maashinii, konkolaataa fi gamoowwanii Zakaa irraa bilisa.",
    },
    propertyStocks: {
      label: "Qabeenya fi Aksiyoona",
      ruling:
        "Manni jireenyaa keessanii fi gatiin qabeenya kiraa Zakaa irraa bilisa — galii kiraa kuufame qofa irraa Zakaan ba'a. Aksiyoona daldalaaf qabaman irraa gatii gabaa isaanii {rate} kaffalama; aksiyoona yeroo dheeraa irraa qabeenya kubbaaniyyichaa Zakaan irraa ba'u {rate} kaffalama.",
    },
    agriculture: {
      label: "Qonna",
      ruling:
        "Ushriin guyyaa oomishni sassaabamu kaffalama, Hawla eeguun hin barbaachisu: yoo roobaan bishaan argate {rainFedRate}, yoo makaa ta'e {mixedRate}, yoo jallisii namtolcheen obaafame {irrigatedRate}. Nisaabni oomisha {nisabKg} kg dha.",
    },
    livestock: {
      label: "Horii",
      ruling:
        "Horii bilisaan dheedan (Saa'imaa), hojiif hin oolle, aannaniif ykn hormaataaf qabaman qofa irraa kaffalama; gabateewwan Nisaabaa Nabiyyii irraa dabarfaman kan hoolaa/re'ee, loonii fi gaalaa hordofa.",
    },
    rikazMinerals: {
      label: "Rikaaza / Albuuda",
      ruling:
        "Rikaaza (qabeenya lafa jala awwaalame) irraa {rikazRate} battaluma kaffalama, Nisaabaa fi Hawla malee. Albuuda lafa jalaa baafame irraa, yeroo gatiin isaa Nisaaba ga'u, {rate} kaffalama.",
    },
    debts: {
      label: "Liqaa fi Idaa",
      ruling:
        "{rate} hojiirra oolchuun dura, qabeenya keessan Zakaan irraa ba'u irraa liqaa yeroo gabaabaa waggaa hijraa keessatti kaffalamu, akkasumas kaffaltii liqaa yeroo dheeraa ji'oota 12 itti aananii hir'isaa.",
    },
  },

  actions: {
    addHeading: "Qabeenya qabdan dabalaa",
    add: "{label} dabalaa",
    remove: "{label} haqaa",
    whyDue: "{label}: Zakaan maaliif ba'a?",
    empty: "Zakaa keessan shallaguu jalqabuuf gosa qabeenyaa armaan gadii tokko dabalaa.",
  },

  inputErrors: {
    decimalPoints: "Tuqaa desimaalaa tokko qofa fayyadamaa. Kumoota koomaadhaan addaan baasaa, fkn. 1,500,000.",
    decimalCommas: "Koomaan kumoota qofa addaan baasa, tuqaa desimaalaa dura.",
    commaGrouping: "Desimaalaaf tuqaa fayyadamaa, fkn. 12.5. Koomaan kumoota qofa addaan baasa, fkn. 1,500,000.",
    wholeNumber: "Lakkoofsa guutuu galchaa.",
    tooLarge: "Lakkoofsi kun baay'ee guddaa dha. Sakatta'aatii irra deebi'aa yaalaa.",
    notNumber: "Lakkoofsa galchaa, fkn. 1500000.",
  },

  cash: {
    cashOnHand: "Maallaqa harkaa jiru (ETB)",
    bankAndMobile: "Baankii + maallaqa moobaayilaa (ETB)",
    goodDebtReceivables: "Liqaa amansiisaa namoota irra qabdan (ETB)",
    goodDebtReceivablesHelp: "Liqaa deebi'uuf carraa qabu qofa galchaa.",
    doubtfulDebtCollected: "Liqaa shakkisiisaa ture kan bara kana sassaabame (ETB)",
  },

  gold: {
    officialPrices: "Gatii ifaa EZAC giraama tokkoof, kaaraatiin.",
    nisabRule:
      "Nisaabni {fineMetal} irratti safarama (giraama waliigalaa × kaaraatii ÷ 24): warqee {goldGrams}g, meetii {silverGrams}g.",
    fineMetal: "sibiila qulqulluu",
    basisOfficial: "Komishiniin yeroo ammaa Nisaaba {basis} hojiirra oolcha.",
    basisEstimate: "Bu'uurri Nisaabaa Komishiniin fayyadamu yeroo gatiin ifaa fe'amu ni mul'ata.",
    loading: "Gatii ifaa fe'aa jira...",
    errorExcluded: "{error} Hanga gatiin ifaa fe'amutti, warqee fi meetiin waliigala keessatti hin herregaman.",
    pricesAsOf: "Gatii yeroo {date}",
    usdEtb: "USD/ETB {rate}",
    metalLabel: "Sibiila #{number}",
    metals: { gold: "Warqee", silver: "Meetii" },
    grams: "Giraama",
    karat: "Kaaraatii",
    karatOption: "{karat}k",
    remove: "Haqaa",
    removeLabel: "Sibiila {number}ffaa haqaa",
    addItem: "Sibiila Dabalaa",
    summary:
      "Warqee {goldGross}g (qulqulluu {goldFine}g) · Meetii {silverGross}g (qulqulluu {silverFine}g) · gatii ETB {value}",
  },

  business: {
    businessCash: "Maallaqa callaa daldalaa (ETB)",
    inventoryValue: "Gatii gabaa meeshaa kuusaa (ETB)",
    receivables: "Liqaa daldalaa isiniif kaffalamuu qabu (ETB)",
    payables: "Liqaa daldalaa yeroo gabaabaa isin irra jiru (ETB)",
    propertyForResale: "Qabeenya irra deebiin gurguruuf bitame (ETB)",
    propertyForResaleHelp: "Yoo kaayyoon gurgurtaa ta'e, akka qabeenya daldalaatti herregama.",
  },

  propertyStocks: {
    rentalSavings: "Galii kiraa kuufame (ETB)",
    rentalSavingsHelp: "Gatii qabeenya kiraa irraa Zakaan hin ba'u; maallaqa kiraa kuufame irraa garuu ni ba'a.",
    stocksTrading: "Gatii ammaa aksiyoona daldalaa (ETB)",
    dividendCash: "Qooda bu'aa callaa harka jiru (ETB)",
    longTermAssets: "Qabeenya kubbaaniyyaa Zakaan irraa ba'u, aksiyoona yeroo dheeraa (ETB)",
    longTermAssetsHelp: "Yeroo ibsi kubbaaniyyichaa hamma qabeenya Zakaan irraa ba'u kennu fayyadamaa.",
  },

  agriculture: {
    harvest: "Hamma oomishaa (kg)",
    harvestHelp: "Nisaabni {nisabKg} kg irraa jalqaba. Yeroo sassaabbii kaffalama — Hawla eeguun hin barbaachisu.",
    irrigation: "Mala jallisii",
    natural: "Uumamaa ({rate})",
    mixed: "Makaa ({rate})",
    artificial: "Namtolchee ({rate})",
  },

  livestock: {
    typeGroup: "Gosa horii",
    types: {
      sheepGoat: "Hoolaa / Re'ee",
      cattle: "Loon / Gafarsa",
      camels: "Gaala",
    },
    freelyGrazing: "Waggaa keessaa yeroo baay'ee bilisaan dheedu",
    usedForWork: "Hojiif kan oolan",
    sheepGoatCount: "Lakkoofsa hoolaa/re'ee",
    cattleCount: "Lakkoofsa loonii/gafarsaa",
    camelsCount: "Lakkoofsa gaalaa",
    kinds: {
      sheep: "Hoolaa",
      bint_makhad: "Bint Makhaad (dhaltuu waggaa 1)",
      bint_labun: "Bint Labuun (dhaltuu waggaa 2)",
      hiqqah: "Hiqqaa (dhaltuu waggaa 3)",
      jadhaah: "Jaz'aa (dhaltuu waggaa 4)",
      tabi: "Tabii' (jabbii waggaa 1)",
      musinnah: "Musinnaa (sa'a waggaa 2)",
    },
    dueItem: "{count} {kind}",
    dueSeparator: " + ",
  },

  rikazMinerals: {
    rikaz: "Gatii Rikaaza argame (ETB)",
    rikazHelp: "Rikaaza irraa {rate} battaluma kaffalama.",
    minerals: "Gatii albuuda baafame (ETB)",
    mineralsHelp: "Yoo Nisaabni guute, albuuda irraa {rate} kaffalama.",
  },

  debts: {
    shortTerm: "Liqaa dhuunfaa yeroo gabaabaa (ETB)",
    loanPayments: "Kaffaltii liqaa ji'oota 12 itti aananii (ETB)",
    loanPaymentsHelp: "Kaffaltii waggaa itti aanu qofa hir'isaa, liqaa yeroo dheeraa guutuu miti.",
  },

  result: {
    total: "Zakaa keessan waliigalaa",
    hawl: "Waggaa hijraa guutuu qabameera (Hawla)",
    checkAmounts: "Waliigala keessan arguuf, lakkoofsota armaan olitti mallatteeffaman sakatta'aa.",
    amount: "ETB {amount}",
    deduction: "− ETB {amount}",
    crops: "+ midhaan {amount} kg (Ushrii)",
    animals: "+ {animals} ({type})",
    breakdown: {
      cash: "Maallaqa callaa ({rate})",
      gold: "Warqee fi meetii ({rate})",
      business: "Daldala ({rate})",
      propertyStocks: "Qabeenya fi aksiyoona ({rate})",
      rikaz: "Rikaaza ({rate})",
      minerals: "Albuuda ({rate})",
      liabilities: "Liqaa hir'ifame",
    },
    netBase: "Qabeenya Zakaa qulqulluu",
    nisabThreshold: "Daangaa Nisaabaa",
    nisabMet: "guuteera",
    nisabBelow: "hin geenye",
    nisabStatus: "ETB {amount} · {status}",
    nisabUnknown: "Gatii ifaa eegaa jira",
    needsRates: "Waliigala keessan shallaguuf Nisaabni ifaa barbaachisa, garuu fe'amuu hin dandeenye.",
    guidance:
      "Shallagduun kun qajeelfama qofa. Murtii haala keessan dhuunfaa irratti argachuuf hayyuu amantii beekumsa qabu gaafadhaa ykn Komishinicha qunnamaa.",
    noHawl: "Qabeenyi waggaa hijraa guutuu hin xumurre — ammaaf Zakaan qabeenyaa dirqama hin ta'u.",
    belowNisab: "Qabeenyi keessan qulqulluun Nisaabaa gadi — ammaaf Zakaan qabeenyaa dirqama hin ta'u.",
    noHawlLivestock: "Horiin keessan waggaa hijraa guutuu isin harka hin turre — ammaaf Zakaan horii dirqama hin ta'u.",
    pay: "Zakaa Kaffaluuf Itti Fufaa",
    payNeedsRates: "Erga gatiin ifaa fe'amee booda gara kaffaltiitti itti fufuu dandeessu.",
    payTitle: "Akkaataa Zakaa kana appii EZAC keessatti itti kaffaltan ilaalaa",
    payNote:
      "Kaffaltiin appii EZAC keessatti raawwatama: appichi koodii QR agarsiisa, isinis appii baankii Itoophiyaa kamiinuu iskaan gootu.",
    bank: "Baankii Hojii Gamtaa Oromiyaa",
  },
};

export default calculator;
