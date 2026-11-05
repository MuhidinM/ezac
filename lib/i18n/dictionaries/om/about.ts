import type { Messages } from "@/lib/i18n/messages";
import type en from "../en/about";

const about: Messages<typeof en> = {
  breadcrumbs: {
    home: "Fuula Jalqabaa",
    about: "Waa'ee Keenya",
    governance: "Bulchiinsa",
    shariahBoard: "Boordii Gorsa Shari'aa",
    contact: "Nu Quunnamaa",
    privacy: "Imaammata iccitii dhuunfaa",
  },

  about: {
    meta: {
      title: "Waa'ee Komishinichaa",
      description:
        "Akkaataa Komishiniin Zakaa Itoophiyaa itti hundeeffame: bu'uura seeraa Labsii 1207/2020 jalatti qabu, dambii hundeeffamaa isaa, aangoo, bulchiinsaa fi ragaalee seeraa isaa.",
      keywords:
        "Komishinii Zakaa Itoophiyaa, Labsii 1207/2020, Majlisa Olaanaa Dhimmoota Islaamaa Itoophiyaa, Majlisa, dambii Zakaa, bulchiinsa Zakaa, sanadoota seeraa, Zakaa Itoophiyaa",
    },
    header: {
      eyebrow: "Waa'ee Keenya",
      title: "Komishinii",
      accent: "seeraan hundeeffame",
      intro:
        "Komishiniin Zakaa Itoophiyaa Zakaa iftoomina, itti gaafatamummaa fi amanamummaadhaan sassaabee raabsuuf, Majlisa Olaanaa Dhimmoota Islaamaa Itoophiyaatiin labsii federaalaa jalatti hundeeffame.",
    },
    why: {
      eyebrow: "Komishiniin maaliif hundeeffame",
      title: "Zakaa, haala isaaf malu qindaa'e",
      paragraphs: [
        "Zakaan utubaalee Islaamaa shanan keessaa tokko. Dambiin hundeeffamaa hawaasa Muslimaa Itoophiyaatiif sirna Zakaa akka sirriitti raawwatan isaan dandeessisu diriirsuu, akkasumas Zakaan kaayyoo isaa, jechuunis hawaasa gargaaruu, hiyyummaa hir'isuu fi misooma biyyaatiif gumaachuu, akka galmaan ga'u mirkaneessuu kaayyeffata.",
        "Sassaabbii fi raabsi Zakaa iftoomina, itti gaafatamummaa fi amanamummaa akka qabaatan, Shari'aa fi seerota biyyaa akka hordofan, sirnoota diinagdee ammayyaa fi teknooloojiitti akka fayyadaman, akkasumas dhaabbata seerummaa qabuu fi kaffaltoonnii fi fudhattoonni Zakaa itti amanan tokkoon akka geggeeffaman gaafata.",
      ],
    },
    stats: [
      { value: "1207/2020", label: "Labsii federaalaa irratti hundaa'u" },
      { value: "25", label: "Miseensota Boordii Daarektarootaa" },
      { value: "9", label: "Beektota Boordii Gorsa Shari'aa jalqabaa irra jiran" },
      { value: "Waggaa 5", label: "Turtii boordii, walitti aansee yoo baay'ate al lama" },
    ],
    source: {
      label: "Madda:",
      linkTitle: "Sanada kana sanadoota seeraa armaan gadii keessatti ilaalaa",
    },
    history: {
      eyebrow: "Bu'uura seeraa",
      title: "Komishiniin akkamitti hundeeffame?",
      intro:
        "Labsiin Lakk. 1207/2020 Majlisni Olaanaan Dhimmoota Islaamaa Itoophiyaa dhaabbilee amantii seerummaa mataa isaanii qaban akka hundeessu aangoo kenna. Majlisni aangoo kanatti fayyadamuun Komishinicha dambiidhaan hundeesse; achiis Komishiniin qaama seerummaa qabu ta'uun isaa mirkanaa'ee, kaffalaa gibiraa ta'ee galmaa'e.",
      items: [
        {
          date: "4 Adoolessa 2020",
          title: "Labsii Lakk. 1207/2020",
          body: "Manni Maree Bakka Bu'oota Ummataa Majlisa Olaanaa Dhimmoota Islaamaa Itoophiyaatiif, akkasumas dhaabbilee amantii isa jalatti hundeeffamaniif, galmee dabalataa malee seerummaa kenna. Labsichi Majlisni bulchiinsa faayinaansii ifaa fi iftoomina qabu akka geggeessu dirqama itti kaa'a.",
          source: "Labsii Lakk. 1207/2020, Gaazexaa Negaarit Federaalaa",
        },
        {
          date: "2018 A.L.I. (2025)",
          title: "Dambii Komishinii Zakaa",
          body: "Majlisni Olaanaan aangoo Keewwata 6(2) labsichaa jalatti qabutti fayyadamuun, dambii Komishinii Zakaa isaa hundeessu baasa: qaama bulchiinsa amantii seerummaa mataa isaa qabu, Majlisichaaf itti gaafatamaa ta'ee fi hojii ogummaa fi bulchiinsa isaa keessatti walaba ta'e.",
          source: "Dambii hundeeffama Komishinii Zakaa",
        },
        {
          date: "18/10/2018 A.L.I. (2026)",
          title: "Ragaa Hundeeffamaa",
          body: "Majlisni Olaanaan, Keewwata 80(1) dambii Majlisaa fi Keewwata 2(1) Labsii 1207/2020 jalatti, Komishiniin Zakaa Itoophiyaa qaama seerummaa qabu ta'uu isaa mirkaneessa.",
          source: "Ragaa Hundeeffamaa",
        },
        {
          date: "24 Waxabajjii 2018 A.L.I. (1 Adoolessa 2026)",
          title: "Ministeera Galiiwwaniitti galmaa'e",
          body: "Komishiniin Finfinnee keessatti, tajaajila deeggarsa yaalaa fi gargaarsa hawaasummaa jalatti, kaffalaa gibiraa ta'ee galmaa'eera.",
          source: "Ragaa Galmee Kaffalaa Gibiraa",
        },
      ],
    },
    mandate: {
      eyebrow: "Aangoo",
      title: "Hojiin Komishinichaaf kenname maali?",
      intro: { before: "Keewwata 4 ", link: "dambii hundeeffamaa", after: " irraa." },
      items: [
        {
          title: "Zakaa sassaabuu",
          body: "Maallaqaa fi qabeenya Zakaa namoota dhuunfaa fi dhaabbilee kaffaluuf dirqama qaban irraa, Itoophiyaa keessaa fi biyya alaatti, akkaataa qajeelfama Shari'aa fi fatwaawwan hojiirra jiraniin sassaabuu.",
        },
        {
          title: "Warra mirga qabaniif raabsuu",
          body: "Wanta sassaabame namoota, dhaabbilee fi hojiiwwan Zakaa argachuuf mirga qabaniif, qajeelfamuma kana hordofuun raabsuu.",
        },
        {
          title: "Iftoominaa fi amanamummaa",
          body: "Sirna sassaabbii fi raabsi Zakaa iftoomina, itti gaafatamummaa fi amanamummaa qabu, bulchiinsa ammayyaa fi bu'a qabeessa ta'een geggeeffamu ijaaruu.",
        },
        {
          title: "Hiyyummaa hir'isuu",
          body: "Zakaan hiyyummaa itti fufiinsaan hir'isuuf akka gumaachu, sagantaalee hir'isuu hiyyummaa biyyaalessaa wajjin walsimsiisuun karoora tarsiimoo baasuu.",
        },
        {
          title: "Faayinaansii Islaamaa",
          body: "Baankii Biyyaalessaa fi dhaabbilee mootummaa fi dhuunfaa biroo wajjin hojjechuun, dhaabbileen faayinaansii dhala (ribaa) malee hojjetan qabeenya isaanii irraa Zakaa akka kaffalan mirkaneessuu.",
        },
        {
          title: "Qorannoo fi hubannoo",
          body: "Zakaa qorachuu, qorannoo maxxansuu, marii hojii fi leenjii qopheessuu, muuxannoo biyyoota biroo irraa barachuu, akkasumas seeraa fi imaammata irratti gorsa kennuu.",
        },
        {
          title: "Misooma Zakaa tuquu malee",
          body: "Maallaqa biroo Shari'aan hayyamuun dhaabbilee misoomaa fi bulchiinsaa hundeessuu; Zakaa sassaabame irraa gonkumaa miti.",
        },
        {
          title: "Warra biroo wajjin hojjechuu",
          body: "Majlisa Olaanaa, manneen murtii Shari'aa, Komishinii Waqfii, mootummaa, baankota, dhaabbilee miti-mootummaa, hawaasa siviilii, qaamota idil-addunyaa fi embaasiiwwan wajjin hojjechuu.",
        },
      ],
    },
    governance: {
      eyebrow: "Bulchiinsa",
      title: "Komishinicha eenyutu bulcha?",
      intro:
        "Komishiniin Majlisa Olaanaaf itti gaafatamaa yoo ta'u, hojii ogummaa fi bulchiinsa isaa keessatti walaba.",
      items: [
        {
          title: "Boordii Daarektarootaa",
          body: "Miseensota 25. Boordiin jalqabaa Pirezidaantii Majlisa Olaanaatiin kaadhimamee Gumii Waliigalaa isaatiin raggaasifame. Miseensonni waggaa shaniif tajaajilu, walitti aansanii yoo baay'ate al lama. Boordiin Komishinicha ni geggeessa, ni to'ata, Komishinara ni muuda, qajeelfamoota ni baasa, karooraa fi baajata waggaa ni raggaasisa.",
        },
        {
          title: "Boordii Gorsa Shari'aa",
          body: "Hojiin Komishinichaa Shari'aa fi fatwaawwan hojiirra jiran akka hordofu mirkaneessuuf, Gumii Ulamaa Majlisa Olaanaa wajjin ta'uun hundeeffame. Miseensonni isaa jalqabaa beektota 9 dha.",
        },
        {
          title: "Komishinara",
          body: "Hojii gaggeessaa olaanaa, boordiif itti gaafatamaa. Itti aanaa komishinaraa sassaabbiitii fi raabsaaf kaadhima, hojjettoota bulcha, karooraa fi baajata qopheessa, akkasumas Komishinicha bakka bu'a.",
        },
        {
          title: "Koree to'annoo",
          body: "Koree to'annoo caasaa Komishinichaa keessatti argamu, koreewwanii fi qaamolee bulchiinsaa biroo hojiin barbaachisu wajjin.",
        },
      ],
      scope: {
        title: "Bakka itti hojiirra oolu.",
        body: "Dambiin kun Majlisa Olaanaa sadarkaa hundatti, majlisoota dhimmoota Islaamaa naannolee hanga Majlisa aanaatti, masjiidota fi dhaabbilee isaanii, akkasumas Muslimoota Itoophiyaa biyya keessaa fi biyya alaa jiran ni hidha. Koreewwan Zakaa amma jiran Komishinichaan galmaa'u, beekamtii argatu, leenjii fudhatu. Komishiniin waajjira muummee qaba; naannolee fi biyya alaatti waajjiraalee damee banuu ni danda'a.",
      },
      source: "Dambii hundeeffama Komishinii Zakaa",
    },
    documents: {
      eyebrow: "Iftoomina",
      title: "Sanadoota seeraa",
      intro: "Sanadoota Komishinicha hundeessanii fi galmeessan, guutummaatti maxxanfaman.",
      download: "Sanadoota seeraa guutuu buufadhaa (PDF, fuula 12, 2.2 MB)",
      downloadTitle: "Sanadoota seeraa Komishinichaa faayila PDF tokkoon buufadhaa",
    },
    cta: {
      title: "Aangoon kun hojiirra yoo oolu ilaalaa",
      body: "Akkaataa Zakaan itti sassaabamu, itti murteeffamuu fi itti kaffalamu tarkaanfii tarkaanfiin hordofaa.",
      primary: "Akkaataa hojii",
      primaryTitle: "Akkaataa Zakaan itti sassaabamu, itti murteeffamuu fi itti kaffalamu ilaalaa",
      secondary: "Daashboordii kallattii",
      secondaryTitle: "Daashboordii iftoominaa kallattii banaa",
    },
  },

  governance: {
    meta: {
      title: "Bulchiinsaa fi Majlisa",
      description:
        "Akkaataa Komishiniin Zakaa fi Awqaaf Itoophiyaa itti bulfamu: Majlisa, caasaa to'annoo fi sirna itti gaafatamummaa.",
      keywords:
        "bulchiinsa Zakaa, Majlisa, Majlisa Olaanaa Dhimmoota Islaamaa Itoophiyaa, Boordii Daarektarootaa, koree to'annoo, itti gaafatamummaa Zakaa",
    },
    header: {
      eyebrow: "Waa'ee Keenya",
      title: "Bulchiinsaa fi",
      accent: "Majlisa",
      intro:
        "EZAC bulchiinsa amantii fi dhaabbataa ifa ta'e jalatti hojjeta: aangoo Majlisaa to'annoo ammayyaa fi odiitii qabu wajjin walitti fida.",
    },
    structure: {
      eyebrow: "Caasaa",
      title: "EZAC akkamitti bulfama?",
      intro:
        "Majlisni Olaanaan (Majlisni) Komishinicha hundeessee itti gaafatamummaa isa gaafata. Boordiin Daarektarootaa miseensota 25 qabu isa to'ata, koreen to'annoo immoo hojii isaa hordofa.",
      items: [
        {
          title: "Majlisa",
          description:
            "Majlisni Olaanaan Dhimmoota Islaamaa Itoophiyaa Labsii 1207/2020 jalatti Komishinicha hundeesse. Komishiniin isaaf itti gaafatamaa yoo ta'u, hojii ogummaa fi bulchiinsa isaa keessatti walaba.",
        },
        {
          title: "Boordii Daarektarootaa",
          description:
            "Miseensota 25 waggaa shaniif tajaajilan, walitti aansanii yoo baay'ate al lama. Boordiin Komishinicha to'ata, Komishinara muuda, qajeelfamoota baasa, karooraa fi baajata raggaasisa.",
        },
        {
          title: "Koree to'annoo",
          description:
            "Koreen to'annoo caasaa Komishinichaa keessaa tokko; jijjiiramni sirna Zakaa keessatti godhamu hundi eenyuun fi yoom akka godhame wajjin galmaa'a.",
        },
        {
          title: "Itti gaafatamummaa ummataa",
          description:
            "Lakkoofsota odiitiin mirkanaa'anii fi gabaasota bu'aa ifatti ni maxxansina, akka ummanni itti gaafatamummaa nu gaafachuu danda'uuf.",
        },
      ],
    },
    mandate: {
      title: "Aangoo fi itti gaafatamummaa",
      body: "Akkaataa dambii hundeeffama isaatiin, Komishiniin Itoophiyaa keessaa fi biyya alaatti Zakaa sassaabee warra mirga qabaniif raabsa; kunis akkaataa Shari'aa fi fatwaawwan hojiirra jiraniin, sirna iftoomina, itti gaafatamummaa fi amanamummaa qabuun. Maallaqni baankii wajjin walsimsiifamee ummataaf gabaafama; kanaafuu amanamummaan kan argamu ragaadhaan malee dubbii qofaan miti.",
      source: {
        before: "Madda: ",
        link: "dambii hundeeffamaa",
        after: " Komishinichaa, sanadoota seeraa isaa biroo wajjin kan maxxanfame.",
      },
      sourceTitle: "Dambii hundeeffamaa fuula Waa'ee Keenya irratti ilaalaa",
    },
    cta: {
      title: "Wabii amantii itti amanamuu dandeessan",
      body: "Boordiin Gorsa Shari'aa keenya murtii, oomishaa fi raabsa hunda ni gamaagama.",
      primary: "Boordii Shari'aa beekaa",
      primaryTitle: "Waa'ee Boordii Gorsa Shari'aa fi aangoo isaa dubbisaa",
      secondary: "Sanadoota seeraa dubbisaa",
      secondaryTitle: "Sanadoota hundeeffama Komishinichaa fuula Waa'ee Keenya irratti ilaalaa",
    },
  },

  shariahBoard: {
    meta: {
      title: "Boordii Gorsa Shari'aa",
      description:
        "Beektotaa fi aangoo murtii, oomishaa fi raabsa EZAC hunda duuba jiran: Shari'aa guutummaatti hordofuun isaa ni mirkanaa'a.",
      keywords:
        "Boordii Gorsa Shari'aa, fatwaa Zakaa, Gumii Ulamaa, Shari'aa hordofuu, beektota Islaamaa Itoophiyaa, ulamaa'ota",
    },
    header: {
      eyebrow: "Waa'ee Keenya",
      title: "Boordii Gorsa",
      accent: "Shari'aa",
      intro:
        "Qaama beektotaa walaba ta'e kan qulqullina amantii hojii EZAC hundaa eegu: murtiiwwan shallagduu irraa kaasee hanga akkaataa maallaqni itti raabsamuutti.",
    },
    mandate: {
      eyebrow: "Aangoo",
      title: "Boordiin maal to'ata?",
      items: [
        {
          title: "Murtiiwwanii fi fatwaawwan",
          description: "Zakaa, Waqfii fi gaaffiiwwan faayinaansii yeroo ammaa irratti qajeelfama aangoo qabu kenna.",
        },
        {
          title: "Mirkaneessa oomishaa",
          description: "Seera shallagduu hunda, caasaa Waqfii hunda fi oomisha invastimantii hunda gamaagamee mirkaneessa.",
        },
        {
          title: "Gamaaggama raabsaa",
          description: "Maallaqni gosoota fayyadamtootaa Shari'aa jalatti mirga qaban qofa akka ga'u mirkaneessa.",
        },
        {
          title: "Gumii Ulamaa wajjin kan muudame",
          description:
            "Gumii Ulamaa Majlisa Olaanaa wajjin ta'uun hundeeffame. Miseensonni isaa jalqabaa beektota sagal dambii hundeeffama Komishinichaa jalatti moggaafamani dha.",
        },
      ],
    },
    process: {
      eyebrow: "Adeemsa mirkaneessaa",
      title: "Shari'aa hordofuun akkamitti mirkanaa'a?",
      steps: [
        { title: "Gamaaggama", body: "Oomishni, seerri ykn imaammanni raabsaa hundi qorannoof boordiitti dhiyaata." },
        { title: "Marii", body: "Beektonni Qur'aana, Sunnaa fi fiqhii beekamaa wajjin madaalu." },
        {
          title: "Mirkaneessa",
          body: "Wantoonni raggaasifaman osoo hojiirra hin oolin yaada Shari'aa barreeffamaan galmaa'e argatu.",
        },
      ],
    },
    cta: {
      title: "Murtiiwwan dubbisaa",
      body: "Fatwaawwanii fi murtiiwwan Islaamaa Zakaa irratti Komishinicha qajeelchan ilaalaa.",
      primary: "Fatwaawwanii fi murtiiwwan ilaalaa",
      primaryTitle: "Fatwaawwanii fi murtiiwwan Islaamaa Zakaa irratti dubbisaa",
      secondary: "Waa'ee bulchiinsa keenyaa",
      secondaryTitle: "Akkaataa Komishiniin itti bulfamu dubbisaa",
    },
  },

  contact: {
    meta: {
      title: "Deeggarsa Quunnamaa",
      description:
        "Komishinii Zakaa fi Awqaaf Itoophiyaa imeeliidhaan ykn bilbilaan quunnamaa, ykn fuula kana irraa nuuf barreessaa.",
      keywords:
        "EZAC quunnamuu, deeggarsa Zakaa, deeggarsa Waqfii, gargaarsa kaffaltii Zakaa, Finfinnee, Addis Ababa",
    },
    header: {
      eyebrow: "Deeggarsa",
      title: "Deeggarsa",
      accent: "quunnamaa",
      intro:
        "Waa'ee Zakaa, Waqfii ykn kaffaltii gaaffii qabduu? Karaa armaan gadii kamiinuu nu quunnamaa, gareen keenya isin gargaara.",
    },
    channels: {
      eyebrow: "Nu quunnamuuf",
      title: "Nu quunnamaa",
      email: "Imeelii",
      emailTitle: "Appii imeelii keessaniin gara {email} barreessaa",
      phone: "Bilbila",
      phoneTitle: "Gara {phone} bilbilaa",
      office: "Waajjira",
      officeValue: "Finfinnee, Itoophiyaa",
    },
    form: {
      title: "Ergaa nuuf ergaa",
      note: "Kun appii imeelii keessanii ergaa gara {email} deemu qabatee bana. Yoo homtuu hin banamne, herrega imeelii keessanii irraa gara teessoo sanaatti barreessaa.",
      name: "Maqaa keessan",
      email: "Teessoo imeelii",
      message: "Ergaa",
      submit: "Appii imeelii keessaniin itti fufaa",
    },
  },

  privacy: {
    meta: {
      title: "Imaammata Iccitii Dhuunfaa",
      description:
        "Akkaataa Komishiniin Zakaa fi Awqaaf Itoophiyaa odeeffannoo dhuunfaa fi faayinaansii keessanii itti sassaabu, itti fayyadamuu fi itti eegu.",
      keywords:
        "imaammata iccitii dhuunfaa EZAC, odeeffannoo dhuunfaa, odeeffannoo kaffaltii Zakaa, eegumsa odeeffannoo, odeeffannoo maatii",
    },
    header: {
      eyebrow: "Seera",
      title: "Imaammata",
      accent: "iccitii dhuunfaa",
      intro:
        "Akkaataa tajaajila EZAC hunda keessatti odeeffannoo dhuunfaa fi faayinaansii keessanii itti sassaabnu, itti fayyadamnuu fi itti eegnu.",
    },
    sections: [
      {
        heading: "Ibsa waliigalaa",
        paragraphs: [
          "Komishiniin Zakaa fi Awqaaf Itoophiyaa (“EZAC”, “nuti”) iccitii dhuunfaa keessanii eeguuf kutannoo qaba. Imaammanni kun odeeffannoo maal akka sassaabnu, akkamitti itti akka fayyadamnu fi filannoo isin qabdan ibsa. Imaammanni kun weebsaayitii, shallagduu fi tajaajila arjoomaa keenya irratti hojiirra oola.",
        ],
      },
      {
        heading: "Odeeffannoo nuti sassaabnu",
        paragraphs: [
          "Odeeffannoo isin kallattiin nuuf kennitan ni sassaabna; kan akka maqaa keessanii, odeeffannoo quunnamtii keessanii fi lakkoofsota Zakaa shallaguuf ykn kaffaluuf galchitan. Yeroo kaffaltii raawwattan, michoonni kaffaltii keenya seeraan to'ataman bakka keenya bu'anii odeeffannoo daddabarsa maallaqaa keessanii ni adeemsisu.",
          "Akkasumas tajaajila kana hojjechiisuu fi nageenya isaa eeguuf, odeeffannoo teeknikaa daangeffame, kan akka odeeffannoo meeshaa fi itti fayyadamaa, ni sassaabna.",
        ],
      },
      {
        heading: "Odeeffannoo keessan akkamitti itti fayyadamna",
        paragraphs: [
          "Odeeffannoo keessan dirqama keessan shallaguuf, kaffaltii adeemsisuu fi walsimsiisuuf, maatiiwwan madaaluuf, ragaalee kennuuf, akkasumas bu'aa gabaasuuf itti fayyadamna. Odeeffannoo dhuunfaa keessan hin gurgurru.",
        ],
      },
      {
        heading: "Maatiiwwan nuti deeggarru",
        paragraphs: [
          "Yeroo maatiin tokko deeggarsaaf iyyatu, hojjettoonni keenya waan madaallii isaatiif barbaachisu galmeessu: miseensota isaa, galii, qabeenya, mana jireenyaa fi fayyaa, akkasumas herrega baankii kaffaltiidhaaf. Odeeffannoon kun, qabxiin maatichaa fi murtiin isa ilaalchisee kenname hundi hojjettoota dhimma sana hordofan qofaaf mul'ata, gonkumaa hin maxxanfamu.",
          "Lakkoofsonni ummataaf weebsaayitii kana irratti mul'atan ida'ama waliigalaa ti. Seenaan bu'aa waa'ee maatii tokkoo kan maxxanfamu hayyama isaaniitiin qofa.",
        ],
      },
      {
        heading: "Nageenyaa fi kuusaa odeeffannoo",
        paragraphs: [
          "Odeeffannoo keessan eeguuf eegumsa teeknikaa fi dhaabbataa ni fayyadamna; akkasumas yeroo kaayyoolee armaan olii galmaan ga'uuf barbaachisu qofaaf, ykn akkaataa seeraa fi dirqama odiitiin barbaachisutti qofa ni kuufna.",
        ],
      },
      {
        heading: "Mirga keessanii fi quunnamtii",
        paragraphs: [
          "Odeeffannoo dhuunfaa keessanii argachuu, sirreessuu ykn haquu gaafachuu ni dandeessu; kunis ulaagaalee seeraa fi odiitii jalatti raawwatama. Mirgoota kanatti fayyadamuuf ykn imaammata kana ilaalchisee gaaffii qabaachuuf, maaloo garee deeggarsaa keenya quunnamaa.",
        ],
      },
    ],
  },

  documents: {
    gallery: {
      view: "Ilaalaa",
      viewLabel: "{title} bal'ina guutuun {view}",
      open: "Banaa",
      openTitle: "Iskaanii {title} tabii haaraa keessatti banaa",
      download: "Buufadhaa",
      downloadTitle: "Iskaanii {title} buufadhaa (suuraa JPG)",
      close: "Agarsiisaa sanadaa cufaa",
    },
    items: {
      certificate: {
        title: "Ragaa Hundeeffamaa",
        issuer: "Majlisa Olaanaa Dhimmoota Islaamaa Itoophiyaa",
        date: "18/10/2018 A.L.I.",
        summary:
          "Komishinii Zakaa Itoophiyaatiif Labsii 1207/2020 jalatti seerummaa kenna. Pirezidaantii Majlisa Olaanaatiin fi Gumii Ulamaatiin mallattaa'e.",
        alt: "Ragaa Hundeeffama Komishinii Zakaa Itoophiyaa kan Majlisa Olaanaa Dhimmoota Islaamaa Itoophiyaa irraa kenname, Afaan Amaaraa, Ingiliffaa fi Arabiffaan, guyyaa 18/10/2018, mallattoo fi chaappaa qabu",
      },
      taxpayer: {
        title: "Ragaa Galmee Kaffalaa Gibiraa",
        issuer: "Ministeera Galiiwwanii",
        date: "1 Adoolessa 2026",
        summary:
          "Ministeera Galiiwwanii federaalaa, Finfinnee, biratti tajaajila deeggarsa yaalaa fi gargaarsa hawaasummaa jalatti galmaa'uu.",
        alt: "Ragaa Galmee Kaffalaa Gibiraa Ministeera Galiiwwanii irraa 24 Waxabajjii 2018 (1 Adoolessa 2026) kenname, teessoo galmaa'e Finfinnee keessaa fi chaappaa qaama kenneen",
      },
      proclamation: {
        title: "Labsii Lakk. 1207/2020",
        issuer: "Gaazexaa Negaarit Federaalaa",
        date: "4 Adoolessa 2020",
        summary: "Seera federaalaa Majlisa Olaanaa fi dhaabbilee inni hundeessuuf seerummaa kennu.",
        alt: "Fuula jalqabaa Gaazexaa Negaarit Federaalaa 4 Adoolessa 2020, Labsii Lakk. 1207/2020 Afaan Amaaraa fi Ingiliffaan qabu",
      },
      regulation: {
        title: "Dambii hundeeffama Komishinii Zakaa",
        issuer: "Majlisa Olaanaa Dhimmoota Islaamaa Itoophiyaa",
        date: "2018 A.L.I. / 1447 Hijraa",
        summary:
          "Dambii Komishinicha hundeessee aangoo isaa, boordii isaa, boordii gorsa Shari'aa fi Komishinara isaa ibsu.",
        alt: "Fuula duraa dambii Majlisa Olaanaa kan Komishinii Zakaa hundeessu, Dambii Lakk. 3/2018, Afaan Amaaraan, chaappaa Majlisichaa wajjin",
      },
    },
  },
};

export default about;
