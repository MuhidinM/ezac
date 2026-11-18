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
        "Ushriin guyyaa oomishni sassaabamu kaffalama, Hawla eeguun hin barbaachisu: yoo roobaan bishaan argate {rainFedRate}, yoo makaa ta'e {mixedRate}, yoo jallisiidhaan obaafame {irrigatedRate}. Midhaan gosa tokko yeroo {nisabKg} kg ga'u Zakaan irraa ba'a.",
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
    intro: "Midhaan sassaabdan tokko tokkoon galchaa. Midhaan gosa tokko yeroo {nisabKg} kg ga'u, Zakaan guyyaa sassaabbii ba'a (Hawla hin eegu).",
    lineLabel: "Midhaan {number}",
    crop: "Midhaan",
    chooseCrop: "Midhaan filadhaa",
    groups: {
      common: "Kan baay'ee facaafamu",
      cereals: "Midhaan (xaafii, qamadii, boqqolloo...)",
      pulses: "Midhaan ijaa (baaqelaa, atara...)",
      oilseeds: "Midhaan zayitaa",
      cash: "Buna, jimaa fi midhaan gurgurtaaf",
      roots: "Kan lafa jalaa (dinnicha, kotchoo...)",
      vegetables: "Kuduraa",
      fruits: "Muduraa",
      spices: "Mi'eessituu",
      other: "Kan biroo",
    },
    amount: "Hammam sassaabdan?",
    unitGroup: "Safartuu",
    units: { kg: "kg", quintal: "kuntaala" },
    quintalHelp: "Kuntaala 1 = kg 100",
    irrigation: "Bishaan akkamiin argate?",
    methods: {
      rain: "Rooba",
      mixed: "Makaa",
      irrigated: "Jallisii",
    },
    methodHelp: {
      rain: "Rooba qofaan · {rate}",
      mixed: "Roobaa fi jallisiidhaan · {rate}",
      irrigated: "Namaan ykn maashiniin obaafame · {rate}",
    },
    price: "Gatii {unit} 1 naannoo keessanitti (ETB)",
    priceHelp: "Gatii: Komishiniin ammaaf gatii midhaanii hin qabu. Zakaan keessan maallaqaan hammam akka ta'u arguuf gatii gabaa naannoo keessanii galchaa. Duwwaa dhiisuus ni dandeessu.",
    due: "Zakaa ba'u: {crop} {amount} ({rate})",
    dueValue: "Gatiin isaa gara ETB {value}",
    amountKg: "{kg} kg",
    amountQuintal: "kuntaala {quintal} ({kg} kg)",
    dueNoPrice: "Maallaqaan hammam akka ta'u arguuf gatii galchaa.",
    combined: "{crop} kee isa biraa waliin walitti qabameera: walumaagalatti kg {total}, Nisaaba ga'a.",
    belowNisab: "Nisaabaa gadi: {crop} {nisabKg} kg irraa eegalee Zakaan irraa ba'a. Walumaagalatti kg {amount} qabdu.",
    thisCrop: "midhaan kana",
    remove: "Haqaa",
    removeLabel: "Midhaan {number}ffaa haqaa",
    addItem: "Midhaan biraa dabalaa",
  },

  livestock: {
    choose: "Horii kam qabdu? Kan qabdan hunda filadhaa.",
    typeGroup: "Horii qabdan",
    types: {
      sheepGoat: "Hoolaa / Re'ee",
      cattle: "Loon / Gafarsa",
      camels: "Gaala",
    },
    removeLabel: "{type} haqaa",
    freelyGrazing: "Waggaa keessaa yeroo baay'ee bilisaan dheedu",
    working: "Isaan keessaa meeqatu hojjeta (lafa qotuu, ba'aa baachuu)?",
    workingHelp: "Horii hojjetu irraa Zakaan hin ba'u, kanaaf hin lakkaa'aman. Yoo hin jirre duwwaa dhiisaa.",
    hawl: "Horii kana waggaa hijraa guutuu qabeera (Hawla)",
    giveLabel: "Yeroo hoolaan tokko kennamuu qabu, maal kennitu?",
    give: { sheep: "Hoolaa tokko", goat: "Re'ee tokko" },
    sheepGoatCount: "Lakkoofsa hoolaa fi re'ee",
    cattleCount: "Lakkoofsa loonii fi gafarsaa",
    camelsCount: "Lakkoofsa gaalaa",
    belowNisab: "Ammaaf Zakaan hin jiru: {min} irraa jalqaba.",
    notEligible: "Horii waggaa keessaa yeroo baay'ee isin nyaachiftan (bilisaan hin dheedne) irraa Zakaan hin ba'u.",
    dueSummary: "Zakaa {type} irraa ba'u: {animals}",
    dueHeading: "Zakaa ba'u",
    price: "Gatii {kind} tokkoo (ETB)",
    priceOfficial: "Gatii giddugaleessaa {animal} tokkoo kan Komishiniin amma kaa'e. Gatiin naannoodhaan garaa garaa dha: gatii naannoo keessaniitti jijjiiraa.",
    priceAnyAge: "Gatii giddugaleessaa {animal} umurii kamiyyuu kan Komishiniin amma kaa'e. Gatiin naannoodhaan garaa garaa dha: gatii naannoo keessaniitti jijjiiraa.",
    priceOwn: "Gatii keessan.",
    priceNone: "Komishiniin horii kanaaf gatii hin qabu. Maallaqaan hammam akka ta'u arguuf gatii naannoo keessanii galchaa.",
    resetPrice: "Gatii Komishinii deebisaa",
    resetPriceLabel: "Gatii Komishinii deebisaa, {kind}: ETB {price}",
    lineValue: "{count} × ETB {price} = ETB {value}",
    animals: { sheep: "hoolaa", goat: "re'ee", cattle: "sa'aa ykn qotiyyoo", camel: "gaalaa" },
    kinds: {
      sheep: "Hoolaa (yoo xiqqaate waggaa 1)",
      goat: "Re'ee (yoo xiqqaate waggaa 2)",
      bint_makhad: "Bint Makhaad (gaala dhalaa waggaa 1)",
      bint_labun: "Bint Labuun (gaala dhalaa waggaa 2)",
      hiqqah: "Hiqqaa (gaala dhalaa waggaa 3)",
      jadhaah: "Jaz'aa (gaala dhalaa waggaa 4)",
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
    allInCash: "Yoo hunda maallaqaan kaffaltan, midhaanii fi horii keessan gatii armaan olii wajjin.",
    inKindChoice: "Maallaqa isaanii bakka kennuu, midhaanii fi horii mataa isaanii kennuus ni dandeessu.",
    inKindUnpriced: "Midhaanii ykn horii tokko tokko gatii hin qaban, kanaaf waliigala kana keessa hin jiran. Akka dabalamaniif armaan olitti gatii galchaa.",
    breakdownCrops: "Midhaan ({rate})",
    breakdownLivestock: "Horii",
    cropItem: "{crop} {amount} kg",
    herdItem: "{type}: {animals}",
    herdNone: "{type}: {count}, Zakaan hin jiru ({min} irraa jalqaba)",
    unpricedItems: "Waliigala kana keessa hin jiran (gatii hin qaban): {items}",
    noPrice: "gatii hin qabu",
    breakdown: {
      cash: "Maallaqa callaa ({rate})",
      gold: "Warqee fi meetii ({rate})",
      business: "Daldala ({rate})",
      propertyStocks: "Qabeenya fi aksiyoona ({rate})",
      rikaz: "Rikaaza ({rate})",
      minerals: "Albuuda ({rate})",
      liabilities: "Liqaa hir'ifame",
    },
    netBase: "Maallaqa, warqee fi daldala, liqaa erga hir'iftanii",
    nisabThreshold: "Daangaa Nisaabaa",
    nisabMet: "guuteera",
    nisabBelow: "hin geenye",
    nisabStatus: "ETB {amount} · {status}",
    nisabUnknown: "Gatii ifaa eegaa jira",
    needsRates: "Waliigala keessan shallaguuf Nisaabni ifaa barbaachisa, garuu fe'amuu hin dandeenye.",
    guidance:
      "Shallagduun kun qajeelfama qofa. Murtii haala keessan dhuunfaa irratti argachuuf hayyuu amantii beekumsa qabu gaafadhaa ykn Komishinicha qunnamaa.",
    noHawl: "Maallaqni, warqeen fi daldalli keessan waggaa hijraa guutuu isin harka hin turre, kanaaf ammaaf Zakaan isaan irraa hin ba'u.",
    belowNisab: "Maallaqni, warqeen fi daldalli keessan Nisaabaa gadi, kanaaf Zakaan isaan irraa hin ba'u. Midhaanii fi horiin Nisaaba mataa isaanii qabu, armaan olitti agarsiifameera.",
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
