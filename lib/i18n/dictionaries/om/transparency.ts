import type { Messages } from "@/lib/i18n/messages";
import type en from "../en/transparency";

const transparency: Messages<typeof en> = {
  breadcrumbs: {
    home: "Fuula Jalqabaa",
    dashboard: "Daashboordii kallattii",
    reports: "Gabaasota bu'aa",
    stories: "Seenaalee bu'aa",
    howItWorks: "Akkaataa hojii",
    fatwas: "Fatwaawwanii fi murtiiwwan",
    faq: "Gaaffii fi Deebii",
  },

  notPublished: "—",

  categories: {
    education: "Barnoota",
    water: "Bishaan",
    health: "Fayyaa",
    food: "Nyaata",
    shelter: "Mana jireenyaa",
    livelihood: "Madda jireenyaa",
    emergency: "Balaa tasaa",
    general: "Waliigalaa",
  },

  asnaf: {
    poor: "Hiyyeessa (Faqiir)",
    needy: "Rakkataa (Miskiin)",
    zakat_administrator: "Hojjetaa Zakaa (Aamil)",
    muallaf: "Warra onneen isaanii Islaamatti dhiyeeffamu (Mu'allaf)",
    freeing_captives: "Garbummaa irraa bilisoomsuu (Riqaab)",
    debtor: "Liqaan kan ulfaate (Gaarim)",
    fi_sabilillah: "Karaa Allaah irratti (Fii sabiilillaah)",
    stranded_traveler: "Imaltuu karaatti hafe (Ibn sabiil)",
    other: "Kan biraa",
  },

  dashboard: {
    meta: {
      title: "Daashboordii Kallattii",
      description:
        "Lakkoofsota maxxanfaman: Zakaa sassaabame, maatiiwwan deeggaraman fi maallaqa Itoophiyaa guutuu keessatti raabsame.",
      keywords:
        "daashboordii Zakaa, Zakaa sassaabame, Zakaa raabsame, iftoomina Zakaa, fayyadamtoota, asnaaf, Zakaa naannoodhaan, Itoophiyaa, Zakat dashboard",
    },
    header: {
      eyebrow: "Iftoominaa fi Bu'aa",
      title: "Daashboordii",
      accent: "kallattii",
      intro:
        "Ummataaf banaa fi hordofamaa. Sassaabbii fi raabsa Zakaa Itoophiyaa guutuu keessatti hordofaa; lakkoofsonni akkuma galmaa'aniin ni maxxanfamu.",
    },
    glance: {
      eyebrow: "Ilaalcha gabaabaa",
      title: "Lakkoofsota",
      asOf: "Lakkoofsota hanga guyyaa {date} maxxanfaman.",
      noDate: "Lakkoofsota maxxanfaman. Mallattoon “—” lakkoofsichi hanga ammaatti akka hin maxxanfamne agarsiisa.",
    },
    stats: {
      totalCollected: "Zakaa sassaabame (hanga ammaatti)",
      collectedThisMonth: "Ji'a kana kan sassaabame",
      familiesSupported: "Maatiiwwan deeggaraman",
      fundsDistributed: "Maallaqa raabsame",
      livesTouched: "Namoota fayyadaman",
      activeProjects: "Kaayyoolee banaa",
    },
    trend: "{percent} ji'a darbe irraa",
    trendUp: "Ol ka'e",
    trendDown: "Gad bu'e",
    monthly: {
      titleBoth: "Zakaa ji'aan sassaabamee fi raabsame",
      titleCollected: "Zakaa ji'aan sassaabame",
      collected: "Sassaabame",
      distributed: "Raabsame",
    },
    asnafTitle: "Maatiiwwan deeggaraman, akkaataa gosoota mirga qabaniin (asnaaf)",
    regions: {
      caption: "Lakkoofsota maxxanfaman naannoodhaan",
      region: "Naannoo",
      beneficiaries: "Fayyadamtoota",
      fundsDistributed: "Maallaqa raabsame",
      activeProjects: "Kaayyoolee banaa",
    },
    cta: {
      title: "Ibsa lakkoofsota kana duuba jiru barbaadduu?",
      body: "Gabaasota bu'aa maxxanfaman buufadhaa ykn waajjira iftoominaa keenya quunnamaa.",
      primary: "Gabaasota bu'aa ilaalaa",
      primaryTitle: "Gabaasota bu'aa maxxanfaman banaa",
      secondary: "Nu quunnamaa",
      secondaryTitle: "Waa'ee lakkoofsota kanaa Komishinicha quunnamaa",
    },
  },

  reports: {
    meta: {
      title: "Gabaasota Bu'aa",
      description:
        "Gabaasota akkaataa maallaqni Zakaa fi Waqfii itti sassaabamee fi raabsame ibsan; yeroo Komishiniin maxxansu asitti buufachuuf ni dhiyaatu.",
      keywords:
        "gabaasa bu'aa Zakaa, gabaasa Waqfii, gabaasa waggaa, gabaasa kurmaanaa, iftoomina Zakaa, gabaasota EZAC",
    },
    header: {
      eyebrow: "Iftoominaa fi Bu'aa",
      title: "Gabaasota",
      accent: "bu'aa",
      intro:
        "Gabaasota buufatamuu danda'an kanneen akkaataa maallaqni itti sassaabamee fi raabsame ibsan; yeroo Komishiniin maxxansu asitti ni kaa'amu.",
    },
    library: {
      eyebrow: "Kuusaa gabaasotaa",
      title: "Gabaasota maxxanfaman",
      intro: "Gabaasni hundi osoo hin maxxanfamin dura ni gamaagamama.",
    },
    empty: "Hanga ammaatti gabaasni maxxanfame hin jiru.",
    published: "Guyyaa {date} maxxanfame",
    file: "PDF",
    fileWithSize: "PDF · {size}",
    linkTitle: "{title} buufadhaa (PDF, tabii haaraa keessatti banama)",
    newTab: "(tabii haaraa keessatti banama)",
    cta: {
      title: "Haala ammaa kallattiin ilaalaa",
      body: "Gabaasni tokko haala yeroo tokkoo qofa ibsa. Lakkoofsota itti fufiinsaan haaromfamaniif daashboordii kallattii hordofaa.",
      primary: "Daashboordii kallattii banaa",
      primaryTitle: "Lakkoofsota sassaabbii fi raabsa Zakaa akkuma maxxanfamaniin ilaalaa",
    },
  },

  stories: {
    meta: {
      title: "Seenaalee Bu'aa",
      description:
        "Seenaalee maatiiwwanii fi hawaasota Zakaan keessan ga'e, hayyama isaaniitiin kan qoodaman.",
      keywords:
        "seenaalee bu'aa Zakaa, fayyadamtoota Zakaa, Zakaa Itoophiyaa keessatti, seenaa arjoomaa, bu'aa Zakaa",
    },
    header: {
      eyebrow: "Iftoominaa fi Bu'aa",
      title: "Seenaalee",
      accent: "bu'aa",
      intro:
        "Wanta Zakaan jijjiiru, jecha hawaasota inni ga'uutiin. Seenaan hundi hayyama maatichaatiin qoodama.",
    },
    empty: "Hanga ammaatti seenaan maxxanfame hin jiru.",
    imageAlt: "Suuraa seenaa kana irraa: {title}",
    readTitle: "Seenaa guutuu dubbisaa: {title}",
    cta: {
      title: "Seenaa itti aanu keessatti qooda fudhadhaa",
      body: "Zakaan keessan maatiiwwan mirkanaa'an Itoophiyaa guutuu keessa jiraniif ga'a.",
      primary: "Amma Zakaa kaffalaa",
      primaryTitle: "Appii baankii Itoophiyaa kamiinuu koodii QR fayyadamuun Zakaa keessan kaffalaa",
      secondary: "Lakkoofsota ilaalaa",
      secondaryTitle: "Daashboordii iftoominaa kallattii banaa",
    },
  },

  story: {
    meta: {
      fallbackTitle: "Seenaa bu'aa",
      keywords: "seenaa bu'aa Zakaa, fayyadamtoota Zakaa, Zakaa Itoophiyaa keessatti",
    },
    published: "Guyyaa {date} maxxanfame",
    cta: {
      title: "Seenaalee bu'aa dabalataa",
      body: "Wanta Zakaan Itoophiyaa guutuu keessatti jijjiiraa jiru ilaalaa.",
      primary: "Seenaalee hunda",
      primaryTitle: "Seenaalee bu'aa maxxanfaman hunda dubbisaa",
      secondary: "Amma Zakaa kaffalaa",
      secondaryTitle: "Appii baankii Itoophiyaa kamiinuu koodii QR fayyadamuun Zakaa keessan kaffalaa",
    },
  },

  howItWorks: {
    meta: {
      title: "Akkaataa Hojii",
      description:
        "Adeemsa EZAC guutuu: akkaataa Zakaan itti shallagamuu fi kaffalamu, akkaataa maatiiwwan itti galmaa'an, madaalamanii fi qabxiin itti kennamu, akkaataa murtiin itti kennamuu fi deeggarsi itti kaffalamu.",
      keywords:
        "akkaataa Zakaan itti hojjetu, Zakaa karaa QR kaffaluu, ragaa Zakaa, Nisaaba har'aa, ulaagaa Zakaa argachuu, asnaaf, qabxii fedhii, raabsa Zakaa Itoophiyaa",
    },
    header: {
      eyebrow: "Iftoomina",
      title: "EZAC akkamitti",
      accent: "hojjeta",
      intro:
        "Yeroo Zakaa keessan shallagdan irraa kaasee hanga guyyaa deeggarsi herrega baankii maatii tokkoo ga'utti: tarkaanfii hunda, seera hunda fi eegumsa hunda, ifatti.",
    },
    paths: {
      giving: {
        title: "Zakaa kennuu",
        body: "Shallaguu, karaa QR kaffaluu, ragaa mirkanaa'uu danda'u argachuu.",
        linkTitle: "Gara tarkaanfiilee Zakaa kennuu deemaa",
      },
      receiving: {
        title: "Deeggarsa argachuu",
        body: "Galmaa'uu, madaalamuu fi qabxii argachuu, murtii argachuu fi kaffalamuu.",
        linkTitle: "Gara tarkaanfiilee deeggarsa argachuu deemaa",
      },
    },
    live: {
      collected: "Sassaabame",
      familiesSupported: "Maatiiwwan deeggaraman",
      distributed: "Raabsame",
      activeCauses: "Kaayyoolee banaa",
    },
    step: "Tarkaanfii {n}",
    giving: {
      eyebrow: "Kennuu",
      title: "Karaa EZAC Zakaa akkamittan kaffala?",
      intro:
        "Wanta isin irra jiru ni shallagdu, appii baankii Itoophiyaa kamiinuu karaa QR ni kaffaltu, kaffaltiin erga mirkanaa'ee booda immoo ragaa lakkoofsa qabu ni argattu.",
      steps: [
        {
          title: "Wanta irra jiru shallagaa",
          body: "Shallagduun seerota Zakaa maxxanfaman maallaqa callaa, warqee, meetii, meeshaa daldalaa, midhaanii fi horii keessan irratti hojiirra oolcha.",
          detail: [
            "Gatiin warqee fi meetii ganama ganama sa'aatii 06:00 (yeroo Finfinnee) gabaa idil-addunyaa irraa fudhatamee gara birriitti jijjiirama.",
            "Yoo maddi gatii hojii dhaabe, hanga gatiin ofumaan itti aanu fudhatamutti bulchaan tokko gatii guyyaa sanaa harkaan galcha.",
            "Seeronni (Nisaaba, dhibbeentaa, gabatee horii) vershinii qabu: jijjiiramni tokko vershinii haaraa uuma, shallagduun immoo yeroo hunda isa hojiirra jiru fayyadama.",
          ],
        },
        {
          title: "Appii baankii kamiinuu karaa QR kaffalaa",
          body: "Appiin EZAC hanga maallaqaa sanaaf koodii QR agarsiisa. Appii baankii Itoophiyaa kamiinuu iskaan godhaa; maallaqni kallattiin herrega Komishinichaa Baankii Hojii Gamtaa Oromiyaa keessa jirutti seena.",
          detail: [
            "Koodiin QR daqiiqaa 30f qofa hojjeta.",
            "Kuusaa Zakaa waliigalaatiif ykn kaayyoo murtaa'aa Zakaa fudhatuuf kaffaluu ni dandeessu.",
          ],
        },
        {
          title: "Ofumaan mirkanaa'a",
          body: "Kaffaltiin galmee daddabarsa baankichaa mataa isaa wajjin walsimsiifama, achiis akka kaffalameetti mallattaa'a.",
          detail: [
            "Sirnichi kaffaltiiwwan eeggachaa jiran, QR-n erga yeroon isaa darbee booda hanga guyyaa tokkootti, sirna QR wajjin mirkaneessuu itti fufa.",
            "Daddabarsi baankii tokko kaffaltii tokko qofa mirkaneessuu danda'a; kanaafuu wanti tokko al lama hin lakkaa'amu.",
            "Wanti ifa hin taane kamiyyuu nama waajjira muummee jiru tokkotti dabarfama; innis dhimmicha osoo hin xumurin dura baankii wajjin ni mirkaneessa.",
          ],
        },
        {
          title: "Ragaa argadhaa",
          body: "Kaffaltiin mirkanaa'e hundi ragaa Zakaa lakkoofsa qabu baasa; ragaa kana namni kamiyyuu armaan gaditti mirkaneessuu danda'a.",
          detail: [],
        },
      ],
    },
    rules: {
      eyebrow: "Seerota hojiirra jiran",
      title: "Shallagduun har'a maal hojiirra oolcha?",
      intro:
        "Vershinii seerotaa hojiirra jiru, kan armaan gaditti agarsiifame, hojiirra oolcha. Lakkoofsonni kun kallattiin isa irraa dubbifamu; kanaafuu wanti asitti argitan sirriitti waanuma shallagduun fayyadamu dha.",
      nisabTitle: "Nisaabaa fi dhibbeentaa",
      nisabBasis: "Bu'uura Nisaabaa",
      nisabBasisValue: "{metal} ({grams} g)",
      gold: "Warqee",
      silver: "Meetii",
      nisabToday: "Nisaaba har'aa",
      goldNisab: "Nisaaba warqee ({grams} g)",
      silverNisab: "Nisaaba meetii ({grams} g)",
      wealth: "Qabeenya, maallaqa callaa fi meeshaa daldalaa",
      wealthAfterDays: "{rate}, guyyoota hijraa {days} booda",
      wealthAfterHawl: "{rate}, waggaa hijraa guutuu (Hawla) booda",
      cropsNisab: "Midhaan: Nisaaba",
      cropsNisabValue: "{kg} kg",
      cropsRates: "Midhaan: roobaan / jallisiin",
      cropsRatesValue: "{rainFed} / {irrigated}",
      pricesAsOf: "Guyyaa gatii",
      version: "Vershinii seerotaa {version}",
      versionWithSource: "Vershinii seerotaa {version} · gatii {source} irraa",
      livestockTitle: "Horii",
      sheepGoats: "Hoolaa fi re'ee",
      camels: "Gaala",
      rangeBetween: "{min}–{max}",
      rangeFrom: "{min} fi isaa ol",
      duePer: "{per} hundaaf {item}",
      dueAnd: "{first} fi {second}",
      cattle:
        "Loon: mataa {minimum} irraa kaasee; loon {tabiPer} hundaaf jabbii waggaa tokkoo tokko, loon {musinnahPer} hundaaf immoo saa waggaa lamaa tokko.",
      averagePrices: "Gatii giddugaleessaa horii madaaluuf fayyadu: {prices}.",
      animalPrice: "{animal} {price}",
      animals: {
        sheep: "hoolaa",
        goat: "re'ee",
        cattle: "loon",
        camel: "gaala",
      },
    },
    certificate: {
      eyebrow: "Ragaa mirkaneessuu",
      title: "Ragaan kun dhugaa dha?",
      intro: "Lakkoofsa ragaa Zakaa irratti maxxanfame galchaa.",
    },
    receiving: {
      eyebrow: "Argachuu",
      title: "Maatiiwwan deeggarsaaf akkamitti filatamu?",
      intro:
        "Adeemsa maxxanfameen malee, nama beektaniin miti: dameetti galmaa'uu, madaallii maatii, qabxii fedhii, murtii damee, achiis kaffaltii waajjira muummeetiin. Tarkaanfiileen kun kanneen maatiin hundi keessa darbu dha.",
      steps: [
        {
          title: "Dameetti galmaa'uu",
          body: "Maatiiwwan damee isaanitti dhiyoo jirutti, ykn ogeessa dirree damee sanaaf hojjetuun galmaa'u.",
          detail: [
            "Ogeessi dirree hundi damee tokko qofa keessatti hojjeta, maatiiwwan achitti galmaa'an qofa ni arga.",
            "Maatiin haaraan hundi osoo itti hin fufin dura, galmee lama ta'uu danda'u akka hin taane galmee jiran wajjin ni sakatta'ama.",
            "Deeggarsi daddabarsa baankii qofaan waan kaffalamuuf, herregni baankii maqaa maatichaatiin jiru ni galmaa'a.",
          ],
        },
        {
          title: "Madaallii maatii",
          body: "Ogeessi dirree maatii daawwatee haala isaa galmeessa: miseensotaa fi warra isa irratti hirkatan, galii, qabeenya, mana jireenyaa, fayyaa fi saaxilamummaa, akkasumas gosoota mirga qaban saddeettan (asnaaf) keessaa kanneen isaaf ilaallatan.",
          detail: [],
        },
        {
          title: "Qabxii fedhii",
          body: "Deebiiwwan gabatee qabxii Komishinichaatiin gara qabxii hiyyummaa tokkootti jijjiiramu. Qabxiin baay'achuun fedhii guddaa agarsiisa.",
          detail: [
            "Gabateen qabxii vershinii qaba. Qabxiin hundi vershinii ittiin shallagame ni galmeessa; jijjiiramni booda dhufu qabxii darbe gonkumaa irra deebi'ee hin barreessu.",
            "Vershiniin haaraan osoo hojiirra hin oolin dura, dhiibbaan isaa madaallii dhiyoo raawwataman irratti ni qoratama.",
          ],
        },
        {
          title: "Murtii damee",
          body: "To'ataan damee madaallicha qabxii fi gorsa sirnichaa wajjin gamaagama; achiis ni raggaasisa, sirreeffamaaf ni deebisa, ni dida ykn ni turfata — yeroo hunda yaada barreeffamaa wajjin.",
          detail: [],
        },
        {
          title: "Kuusaa waajjira muummee",
          body: "Maatiiwwan raggaasifaman tarree waajjira muummee keessa galu. Waajjirri muummee kuusaa kaffaltii keessa isaan galcha, ykn sababa ibsee ni dida. Haalli hatattamaa karaa saffisaatiin dursa argachuu danda'a (armaan gaditti ilaalaa).",
          detail: [],
        },
        {
          title: "Herrega baankii maatiitti kaffaluu",
          body: "Waajjirri muummee herrega Komishinichaa irraa maatii kuusaa keessa jiru tokko tokkoon kaffala.",
          detail: [
            "Herregoonni Baankii Hojii Gamtaa Oromiyaa daddabarsa keessootiin kaffalamu; baankonni biroo immoo karaa sirna kaffaltii hatattamaa biyyaalessaa (IPS).",
            "Osoo hin kaffalamin dura, herregichi baankii biratti ni barbaadama, maqaan abbaa herregaa baankii biratti jiru maqaa galmee keenya irra jiru wajjin ni madaalama. Yoo walsimuu baate, namni tokko qoratee mirkaneessuu qaba.",
            "Kaffaltiin qophaa'e daqiiqaa 15 keessatti mirkanaa'uu qaba; yoo kana hin taane yeroon isaa ni darba.",
            "Erga kaffalamee booda, maatichi kuusaa keessaa ni ba'a. Irra deebi'ee deeggaramuuf, irra deebi'ee madaalamuu qaba.",
          ],
        },
      ],
    },
    needLevels: {
      eyebrow: "Sadarkaalee fedhii",
      title: "Qabxiin fedhii maal jechuu dha?",
      intro:
        "Qabxiin baay'achuun fedhii guddaa agarsiisa. Bakki qabxiin itti argamu sadarkaa fedhii fi gorsa dameen argu murteessa; garuu murtiin kan damee ti.",
      example: "Fakkeenya",
      bands: {
        low: "Fedhii gadaanaa",
        medium: "Giddugaleessa",
        high: "Fedhii olaanaa",
      },
      levels: [
        { title: "Fedhii gadaanaa", range: "110 gadi", body: "Gorsa: turfachuu fi booda irra deebi'anii ilaaluu" },
        { title: "Fedhii giddugaleessaa", range: "110 hanga 179", body: "Gorsa: haala wajjin raggaasisuu" },
        { title: "Fedhii olaanaa", range: "180 fi isaa ol", body: "Gorsa: raggaasisuu" },
      ],
      note: "Lakkoofsota fakkeenyaa, akkaataa daangaaleen kun itti hojjetan agarsiisuuf. Daangaaleen kun gabatee qabxii vershinii qabu keessaa tokko waan ta'aniif jijjiiramuu danda'u; qabxiin hundi vershinii ittiin shallagame ni qabata.",
    },
    urgent: {
      eyebrow: "Dhimmoota hatattamaa",
      title: "Fedhiin eegee hin dandeenye yoo jiraate maaltu ta'a?",
      intro:
        "Maatichi karaa saffisaa ykn dursa argachuu danda'a. Ogeessi dirree ykn dameen ragaa wajjin mallattoo addaa (whitelist) gaafata; murtii kan kennu waajjira muummee dha. Kun tartiiba tarree jijjiira malee qabxii gonkumaa hin jijjiiru.",
      items: [
        {
          title: "Karaa saffisaa",
          body: "Haala hatattamaa kan akka balaa, buqqa'iinsa ykn dhukkuba cimaa tasa dhufeef. Maatichi osoo madaalliin guutuun hin raawwatin, battalumatti tarree waajjira muummee keessa gala.",
        },
        {
          title: "Dursa",
          body: "Fedhii yeroo dheeraaf turu kan akka daa'ima yatiimaa kunuunsa jala jiru, qaama miidhamummaa cimaa ykn manguddoo kunuunsaa hin qabneef. Maatichi ammas ni madaalama, achiis jalqaba irratti tarreeffama.",
        },
      ],
    },
    eligible: {
      eyebrow: "Gosoota mirga qaban saddeettan",
      title: "Zakaa eenyutu argachuu danda'a?",
      intro:
        "Zakaan gosoota namootaa saddeettan Qur'aana (9:60) keessatti eeramaniif kennama. Madaalliin hundi isaan keessaa kanneen maatichaaf ilaallatan ni galmeessa.",
      source: "Madda:",
      sourceLink: "Qur'aana, Suuratu At-Tawbah 9:60",
      sourceTitle: "Suuratu At-Tawbah 9:60 Quran.com irratti dubbisaa (tabii haaraa keessatti banama)",
    },
    safeguards: {
      eyebrow: "Eegumsa",
      title: "Qarshiin hundi akkamitti hordofamaa ta'a?",
      intro:
        "Hojiin gahee adda addaa gidduutti qoodama, qabxiin seerota maxxanfaman hordofa, maallaqni herrega baankii mirkanaa'e qofaan socho'a, jijjiiramni hundis ni galmaa'a.",
      items: [
        {
          title: "Qoqqoodama hojii",
          body: "Ogeeyyiin dirree ni madaalu, to'attoonni damee ni murteessu, waajjirri muummee kuusaa keessa galchee ni kaffala. Mallattoon karaa saffisaa fi dursaa ragaa fi murtii waajjira muummee barbaada.",
        },
        {
          title: "Seerri nama dursa",
          body: "Qabxiin gabatee qabxii vershinii qabu irraa dhufa malee yaada nama dhuunfaa irraa miti; murtiin hundis sababa barreeffamaa qaba.",
        },
        {
          title: "Kaffaltii baankiin mirkanaa'e",
          body: "Maallaqni seenu daddabarsa baankii wajjin walsimsiifama; maallaqni bahu herrega baankii biratti mirkanaa'e qofatti deema.",
        },
        {
          title: "Galmee odiitii guutuu",
          body: "Jijjiiramni gatii, seerota, qabxii kennuu, murtii fi kaffaltii irratti godhamu hundi, eenyuun fi yoom akka godhame wajjin ni galmaa'a.",
        },
        {
          title: "Iccitii dhuunfaa bu'uuraan",
          body: "Odeeffannoon maatii, qabxii fi murtii hojjettoota isa barbaadan qofaaf mul'ata. Lakkoofsonni ummataaf ba'an ida'ama waliigalaa ti malee nama dhuunfaa miti.",
        },
        {
          title: "Seenaaf hayyama",
          body: "Seenaan bu'aa kan maxxanfamu erga maatichi itti waliigalee booda qofa; hayyama sana malee maqaan isaanii gonkumaa hin ka'u.",
        },
      ],
    },
    cta: {
      title: "Hojii isaa ilaalaa",
      body: "Sassaabbii fi raabsa ji'a ji'aan daashboordii kallattii irratti hordofaa.",
      primary: "Daashboordii kallattii",
      primaryTitle: "Daashboordii iftoominaa kallattii banaa",
      secondary: "Zakaa keessan shallagaa",
      secondaryTitle: "Shallagduu Zakaa banaa",
    },
  },

  fatwas: {
    meta: {
      title: "Fatwaawwanii fi Murtiiwwan Islaamaa Zakaa irratti",
      description:
        "Murtiiwwan aangoo qaban Boordii Gorsa Shari'aa EZAC irraa, Zakaa, Waqfii fi gaaffiiwwan faayinaansii yeroo ammaa irratti.",
      keywords:
        "fatwaa Zakaa, murtiiwwan Zakaa, murtiiwwan Islaamaa, Nisaaba warqee moo meetii, Ushrii, Rikaaza, Zakaa qabeenya daldalaa, Zakaa fi liqaa, Boordii Gorsa Shari'aa, Zakat fatwa",
    },
    header: {
      eyebrow: "Beekumsa",
      title: "Fatwaawwanii fi",
      accent: "murtiiwwan Islaamaa",
      intro:
        "Qajeelfama Boordii Gorsa Shari'aa EZAC irraa kenname. Murtiiwwan kun bu'uura hojii shallagduu fi imaammata raabsa Komishinichaa ti.",
    },
    heading: {
      eyebrow: "Murtiiwwan",
      title: "Murtiiwwan Zakaa, ibsa wajjin",
      intro: "Murtiin hundi yaada beektota ga'umsa qabanii kan of eeggannoon irratti yaadame agarsiisa.",
    },
    rulings: {
      assets: {
        q: "Zakaan qabeenya akkamii irratti dirqama?",
        a: "Zakaan maallaqa callaa fi qusannaa, warqee fi meetii, meeshaa daldalaa, oomisha qonnaa, horii, akkasumas qabeenya ammayyaa tokko tokko kan akka aksiyoona gurguramuu danda'u irratti dirqama — tokkoon tokkoon isaanii Nisaaba isaa erga ga'ee fi, bakka barbaachisaa ta'etti, waggaan hijraa guutuun (Hawla) erga irra darbee booda.",
      },
      nisab: {
        q: "Nisaabni warqee moo meetii irratti hundaa'a?",
        a: "Nisaabni gatii ulfaatina murtaa'aa warqee ykn meetii ti. Seeronni Komishinichaa maxxanfaman isa kam akka hojiirra oolu ibsu, shallagduun immoo gatii guyyaa sanaatiin gara birriitti jijjiira. Fuulli 'Akkaataa Hojii' seerota har'a hojiirra jiran agarsiisa.",
        aLive:
          "Nisaabni gatii warqee {goldGrams} g ykn meetii {silverGrams} g ti. Seeronni har'a hojiirra jiran ulaagaa {basis} fayyadamu: {basis} {basisGrams} g, kan shallagduun gatii guyyaa sanaatiin gara birriitti jijjiiru.",
      },
      ushr: {
        q: "Zakaan oomisha qonnaa (Ushrii) yoom kaffalama?",
        a: "Ushriin guyyaa midhaan itti sassaabamu kaffalama; Hawla hin barbaachisu. Dhibbeentaan isaa oomisha roobaan biqileef oomisha jallisiin biqile caalaa ol aanaa dha; midhaan sassaabame Nisaaba midhaanii yoo ga'e hojiirra oola. Fuulli 'Akkaataa Hojii' dhibbeentaa har'a hojiirra jiru agarsiisa.",
        aLive:
          "Ushriin guyyaa midhaan itti sassaabamu kaffalama; Hawla hin barbaachisu: oomisha roobaan biqileef {rainFed}, jallisii makaa ta'eef {mixed}, midhaan jallisii namtolcheetiin biqileef immoo {irrigated}; kunis midhaan sassaabame {nisabKg} kg yoo ga'e.",
      },
      business: {
        q: "Zakaan qabeenya daldalaa akkamitti shallagama?",
        a: "Meeshaalee daldalaa irra deebi'anii gurguruuf yaadamee bitaman irraa — meeshaa kuusaa, maallaqa callaa daldalaa fi liqaa isiniif kaffalamuu qabu, liqaa yeroo gabaabaa isin irra jiru erga hir'isanii booda — Zakaan {rate} kaffalama. Qabeenyi dhaabbataa kan akka maashinii, konkolaataa fi bakka hojii Zakaa irraa bilisa.",
      },
      rikaz: {
        q: "Murtiin Rikaazaa fi albuuda lafa jalaa baafamee maali?",
        a: "Rikaaza (qabeenya lafa jala awwaalame) irraa, akkuma argameen battalumatti {rikazRate} kaffalama; Nisaabni ykn Hawlli hin barbaachisu. Albuuda baafame irraa immoo, gatii Nisaabaa yoo ga'e, {rate} kaffalama.",
      },
      debts: {
        q: "Liqaan yeroo dheeraa Zakaa dura hir'ifamuu ni danda'aa?",
        a: "Liqaa yeroo gabaabaa waggaa hijraa keessatti kaffalamuu qabu, akkasumas kaffaltii liqaa yeroo dheeraa ji'oota kudha lamaan itti aananii qofatu hir'ifamuu danda'a. Liqaa yeroo dheeraa guutuu hir'isuun kaffaltoota Zakaa haala hin malleen Nisaabaa gaditti hambisa.",
      },
    },
    basis: {
      gold: "warqee",
      silver: "meetii",
    },
    figuresLive: "Lakkoofsonni fuula kana irra jiran seerota shallagduun har'a hojiirra oolchu irraa fudhataman.",
    figuresLiveVersion:
      "Lakkoofsonni fuula kana irra jiran seerota shallagduun har'a hojiirra oolchu irraa fudhataman (vershinii {version}).",
    figuresMissing: {
      before: "Lakkoofsota har'aa fe'uu hin dandeenye. Seerota hojiirra jiraniif ",
      link: "Akkaataa Hojii",
      after: " ilaalaa.",
      linkTitle: "Seerota Zakaa har'a hojiirra jiran ilaalaa",
    },
    cta: {
      title: "Murtiiwwan kana hojiirra oolchaa",
      body: "Shallagduun murtiiwwan kana qabeenya keessan hunda irratti ofumaan hojiirra oolcha.",
      primary: "Shallagduu banaa",
      primaryTitle: "Shallagduu Zakaa banaa",
      secondary: "Boordii Shari'aa beekaa",
      secondaryTitle: "Beektota Boordii Gorsa Shari'aa irra jiran beekaa",
    },
  },

  faq: {
    meta: {
      title: "Gaaffii fi Deebii",
      description:
        "Deebii gaaffilee baay'inaan gaafataman waa'ee Zakaa, Waqfii, kaffaltii, mirkaneessaa fi akkaataa EZAC qarshii hunda hordofamaa itti taasisu.",
      keywords:
        "gaaffii fi deebii Zakaa, gaaffilee Zakaa, Nisaabni maali, Zakaa faaya warqee, garaagarummaa Zakaa fi Waqfii, biyya alaa irraa Zakaa kaffaluu, ragaa Zakaa, Zakat FAQ",
    },
    header: {
      eyebrow: "Deeggarsa",
      title: "Gaaffilee baay'inaan",
      accent: "gaafataman",
      intro:
        "Waan bu'uuraa Zakaa, Waqfii, kaffaltii fi mirkaneessa irratti. Deebii keessan argachuu dadhabdanii? Gareen deeggarsaa keenya ergaa tokkoon isin bira jira.",
    },
    heading: {
      eyebrow: "Deebiiwwan",
      title: "Gaaffilee idilee",
    },
    items: [
      {
        q: "Zakaa eenyu akka argatu akkamitti murteeffama?",
        a: "Adeemsa maxxanfameen: dameetti galmaa'uu, madaallii maatii, qabxii fedhii gabatee qabxii Komishinichaa irraa, murtii to'ataa damee, akkasumas kaffaltii waajjira muummeetiin. Haalli hatattamaa ragaa wajjin karaa saffisaatiin dursa argachuu danda'a. Fuulli 'Akkaataa Hojii' tarkaanfii hunda ibsa.",
      },
      {
        q: "Nisaabni maali, akkamittis murtaa'a?",
        a: "Nisaabni hanga qabeenyaa xiqqaa Zakaan isin irratti dirqama ta'uuf qabaachuu qabdanii dha: gatii warqee 85 g ykn meetii 595 g. Seeronni Komishinichaa maxxanfaman isa kam akka hojiirra oolu ibsu, shallagduun immoo gatii warqee fi meetii ganama ganama haaromfamuun gara birriitti jijjiira. Fuulli 'Akkaataa Hojii' seerota har'a hojiirra jiran agarsiisa.",
      },
      {
        q: "Faaya warqee godhadhu irratti Zakaa kaffaluu qabaa?",
        a: "Akka yaada beektota baay'inaan, eeyyee — Zakaan warqee fi meetii irratti, godhatamanis ta'e kuufaman, dirqama; ulfaatina sibiilaa qulqulluu irratti shallagama, erga Nisaabni guutee fi waggaan hijraa guutuun (Hawla) darbee booda.",
      },
      {
        q: "Kaffaltiin koo akkamitti nageenyaan eegamee hordofamaa ta'a?",
        a: "Appii baankii Itoophiyaa kamiinuu koodii QR iskaan gochuun kaffaltu. Maallaqni kallattiin herrega Komishinichaa Baankii Hojii Gamtaa Oromiyaa keessa jirutti seena, kaffaltiin galmee baankichaa mataa isaa wajjin walsimsiifama, isinis ragaa lakkoofsa qabu kan namni kamiyyuu fuula 'Akkaataa Hojii' irratti mirkaneessuu danda'u ni argattu.",
      },
      {
        q: "Maallaqni namoota sirrii akka ga'u akkamitti mirkaneessitu?",
        a: "Maatiin hundi dameetti galmaa'a, galmee lama ta'uu irraa ni sakatta'ama, ogeessa dirreetiin ni daawwatama, gabatee qabxii Komishinichaatiin qabxiin itti kennama. To'ataan damee ni raggaasisa, waajjirri muummee kuusaa kaffaltii keessa galcha, deeggarsi immoo herrega baankii baankii biratti mirkanaa'e qofatti kaffalama. Tarkaanfiin hundi ni galmaa'a.",
      },
      {
        q: "Garaagarummaan Zakaa fi Waqfii maali?",
        a: "Zakaan dirqama waggaa waggaan warra mirga qabaniif raabsamu dha. Waqfiin kennaa bara baraa ti — qabeenyi bu'uuraa ni eegama, invastii ni godhama, bu'aan isaa qofti itti fayyadamama; kanaafuu daangaa malee kennuu itti fufa.",
      },
      {
        q: "Biyya alaa irraa kennuu nan danda'aa?",
        a: "Ammatti kaffaltiin appii baankii Itoophiyaatiin karaa koodii QR raawwatama. Yoo biyya alaa jiraattanii garuu herrega baankii Itoophiyaa appii bilbilaa qabu qabaattan, haaluma kanaan kaffaluu ni dandeessu.",
      },
    ],
    cta: {
      title: "Ammas gaaffii qabduu?",
      body: "Garee deeggarsaa keenya quunnamaa, dafnee isinitti deebina.",
      primary: "Deeggarsa quunnamaa",
      primaryTitle: "Gaaffii keessan garee deeggarsaatti ergaa",
      secondary: "Fatwaawwan dubbisaa",
      secondaryTitle: "Murtiiwwan Boordii Gorsa Shari'aa Zakaa irratti dubbisaa",
    },
  },
};

export default transparency;
