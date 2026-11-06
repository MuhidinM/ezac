import type { Messages } from "@/lib/i18n/messages";
import type en from "../en/giving";

const giving: Messages<typeof en> = {
  breadcrumbs: {
    home: "Fuula Jalqabaa",
  },

  pay: {
    meta: {
      title: "Amma Zakaa Kaffalaa",
      description:
        "Zakaa keessan appii baankii Itoophiyaa kamiinuu koodii QR fayyadamuun kallattiin herrega Komishinichaatti kaffalaa, ragaa namni kamiyyuu mirkaneessuu danda'u argadhaa.",
      keywords:
        "Zakaa kaffaluu, Zakaa toora interneetiin kaffaluu, kaffaltii Zakaa Itoophiyaa, kaffaltii QR, appii baankii, ragaa Zakaa, Baankii Hojii Gamtaa Oromiyaa, Coopbank, pay Zakat Ethiopia",
    },
    breadcrumb: "Zakaa Kaffaluu",
    hero: {
      eyebrow: "Zakaa",
      title: "Zakaa keessan",
      accent: "amma kaffalaa",
      intro:
        "Appii baankii keessaniin tuqaa muraasaan kallattiin herrega Komishinichaatti kaffalaa; kaffaltiin hundi galmee baankichaa mataa isaa wajjin ni walsimsiifama.",
    },
    channels: {
      eyebrow: "Karaalee kennaa",
      title: "Salphaa, baankii irraa baankiitti",
      intro: "Kaffaltiin karaa sirna kaffaltii QR biyyaalessaa raawwatamee baankii wajjin ni walsimsiifama.",
      items: [
        {
          title: "QR appii baankii kamiinuu",
          description:
            "Koodii QR appii EZAC keessatti argamu appii bilbilaa baankii Itoophiyaa kamiinuu iskaan godhaa. Kaardii ykn waalleetiin hin barbaachisu.",
        },
        {
          title: "Kallattiin gara Komishinichaatti",
          description:
            "Maallaqni kallattiin herrega Komishinichaa Baankii Hojii Gamtaa Oromiyaa keessa jirutti seena; qaamni giddu-galeessaa tokkollee hin qabatu.",
        },
        {
          title: "Baankii wajjin mirkanaa'a",
          description:
            "Kaffaltiin hundi osoo hin lakkaa'amin dura galmee daddabarsaa baankichaa wajjin ni walsimsiifama; daddabarsi tokko kaffaltii tokko qofa mirkaneessuu danda'a.",
        },
        {
          title: "Nagahee hordofamu",
          description:
            "Kaffaltiin mirkanaa'e hundi ragaa lakkoofsa qabu kenna; ragaa kana namni kamiyyuu fuula Akkaataa Hojii irratti mirkaneessuu danda'a.",
        },
      ],
    },
    steps: {
      eyebrow: "Akkaataa Hojii",
      title: "Zakaa akkamittan kaffala?",
      intro:
        "Tarkaanfii sadiin: waan isin irra jiru shallagaa, appii baankii keessaniin koodii QR fayyadamuun kaffalaa, ragaa namni kamiyyuu mirkaneessuu danda'u argadhaa.",
      items: [
        {
          title: "Dirqama keessan shallagaa",
          body: "Hamma qabeenya keessan hunda irratti isin irra jiru sirriitti beekuuf shallagduu Zakaa fayyadamaa.",
        },
        {
          title: "QR iskaan godhaa",
          body: "Appii EZAC keessatti kuusaa waliigalaa ykn kaayyoo tokko filadhaa, achiis koodii QR appii baankii keessaniin iskaan godhaa. Koodichi daqiiqaa 30f hojjeta.",
        },
        {
          title: "Ragaa keessan argadhaa",
          body: "Kaffaltiin galmee baankichaa wajjin ni mirkanaa'a; isinis ragaa lakkoofsa qabu, kan yeroo barbaaddanitti mirkaneessuu dandeessan, ni argattu.",
        },
      ],
    },
    app: {
      title: "Appii EZAC argadhaa",
      body: "Kaffaltiin appii EZAC keessatti raawwatama. Appichi bilbilota Android qofaaf kan qophaa'e yoo ta'u, kuusaa appii irraa osoo hin taane kallattiin (faayila APK) buufatama.",
      download: "Appii Android buufadhaa",
      downloadNote: "(faayila APK, tabii haaraa keessatti banama)",
      downloadTitle: "Appii EZAC kan Android faayila APK ta'een buufadhaa (tabii haaraa keessatti banama)",
    },
    cta: {
      title: "Dura hamma isin irra jiru beekaa",
      body: "Hamma isin irra jiru sirriitti shallagaa, achiis ofitti amanamummaadhaan kaffalaa.",
      primary: "Shallagduu banaa",
      primaryTitle: "Shallagduu Zakaa banaa",
      secondary: "Eessa akka ga'u ilaalaa",
      secondaryTitle: "Zakaan eessa akka ga'u daashboordii iftoominaa kallattii irratti ilaalaa",
    },
  },

  corporate: {
    meta: {
      title: "Zakaa Dhaabbilee",
      description:
        "Kubbaaniyyootaa fi dhaabbileef: shallaggii Zakaa qabeenya tokkoon tokkoon isaatiin, raabsa maatiiwwan madaalamaniif, akkasumas gabaasa bu'aa boordiif dhiyaachuuf qophaa'e.",
      keywords:
        "Zakaa dhaabbilee, Zakaa kubbaaniyyaa, Zakaa daldalaa, Zakaa institiyuushinii, madaallii Zakaa, gabaasa CSR, Itoophiyaa, corporate Zakat",
    },
    breadcrumb: "Zakaa Dhaabbilee",
    hero: {
      eyebrow: "Zakaa",
      title: "Zakaa",
      accent: "Dhaabbilee",
      intro:
        "Tajaajila qindaa'aa kubbaaniyyootaa fi dhaabbileef — madaallii sirrii, raabsa seera hordofu fi gabaasa iftoomina qabu, hojii bal'aaf illee.",
    },
    features: {
      eyebrow: "Maal argattu",
      title: "Dhaabbileef kan qophaa'e",
      intro:
        "Galmee herregaa tokko irraa kaasee hanga sagantaa CSR biyya guutuutti, Zakaan dhaabbilee jalqabaa hanga xumuraatti nuun geggeeffama.",
      items: [
        {
          title: "Shallaggii ifa ta'e",
          description:
            "Qabeenyi kubbaaniyyaa tokkoon tokkoon ni madaalama; akka gareen faayinaansii keessanii mirkaneessuu danda'uuf, adeemsi shallaggii ni agarsiifama.",
        },
        {
          title: "Raabsa walitti qabaa",
          description:
            "Gumaachi keessan maatiiwwan madaalamanii fi dameetti raggaasifaman walitti qabamanitti dabalama; daddabarsa baankiitiin kaffalamee guutummaatti ni walsimsiifama.",
        },
        {
          title: "Gabaasa bu'aa",
          description: "Gabaasota boordii fi CSR qarshii hunda bu'aa safaramuu fi mirkanaa'uu danda'utti hidhan.",
        },
        {
          title: "Qajeelfama Shari'aa",
          description: "Madaalliiwwan murtiiwwan Boordii Gorsa Shari'aa EZAC ni hordofu; gaaffiiwwan hin furamne immoo gara boordichaatti ni ergamu.",
        },
      ],
    },
    process: {
      eyebrow: "Adeemsa",
      title: "Zakaan dhaabbilee akkamitti hojjeta?",
      intro:
        "Tarkaanfiileen afur marii jalqabaa irraa kaasee hanga lakkoofsa sakatta'amee fi gabaasa boordii keessaniif qophaa'etti isin geessu.",
      items: [
        {
          title: "Garee dhaabbilee keenya quunnamaa",
          body: "Waa'ee dhaabbata keessanii, damee hojii keessanii fi ulaagaalee gabaasaa keessanii nuuf himaa.",
        },
        {
          title: "Odeeffannoo faayinaansii dhiyeessaa",
          body: "Qabeenya Zakaan irratti dirqama ta'e madaaluuf ibsota barbaachisan karaa nageenya qabuun nuuf qoodaa.",
        },
        {
          title: "Gamaagamuu fi waliigaluu",
          body: "Lakkoofsa ni shallagna, isin wajjin ni ilaalla, gaaffii Shari'aa kamiyyuu gara boordiitti ni ergina.",
        },
        {
          title: "Raabsuu fi gabaasuu",
          body: "Maallaqni kaayyoolee mirkanaa'anitti raabsamee gabaasni isaa boordii keessaniif ni dhiyaata.",
        },
      ],
    },
    cta: {
      title: "Zakaa dhaabbata keessanii irratti nu wajjin mari'adhaa",
      body: "Gareen dhaabbilee keenyaa madaallii, raabsaa fi gabaasa akkaataa fedhii keessaniitti ni qopheessa.",
      primary: "Garee dhaabbilee quunnamaa",
      primaryTitle: "Garee tajaajila dhaabbilee EZAC quunnamaa",
      secondary: "Shallagduun tilmaamaa",
      secondaryTitle: "Zakaa keessan shallagduu fayyadamuun tilmaamaa",
    },
  },

  donate: {
    meta: {
      title: "Kennaa",
      description:
        "Zakaa, Sadaqaa, Zakaatul Fixrii kennaa, ykn Waqfii godhaa — karaa EZAC, nageenyaan, iftoominaan fi hordofamuu danda'uun.",
      keywords: "arjooma, Zakaa kennuu, Sadaqaa, Zakaatul Fixrii, Waqfii, arjooma Islaamaa, Itoophiyaa, donate Zakat",
    },
    breadcrumb: "Kennaa",
    hero: {
      eyebrow: "Kennaa",
      title: "Amma",
      accent: "kennaa",
      intro:
        "Akkaataa kennuu barbaaddan filadhaa. Gumaachi hundi — dirqamas ta'u fedhiidhaan — harka keessanii irraa kaasee hanga maatiiwwanii fi egeree inni ijaaruutti ni hordofama.",
    },
    ways: {
      eyebrow: "Karaalee kennaa",
      title: "Karaa EZAC maalan kennuu danda'a?",
      intro:
        "Zakaa, Sadaqaa, Zakaatul Fixrii ykn kennaa Waqfii. Kaffaltiiwwan baankota Itoophiyaa keessaan raawwatamu, galmee baankichaa mataa isaa wajjinis ni walsimsiifamu.",
      items: [
        {
          title: "Zakaa",
          description: "Dirqama keessan sirriitti raawwadhaa. Waan isin irra jiru shallagaa, achiis karaa amanamaa ta'een kaffalaa.",
        },
        {
          title: "Sadaqaa",
          description:
            "Sadaqaa fedhiidhaan, hamma kamiyyuu, yeroo kamiyyuu kennaa — kaayyoolee garaa keessan tuqaniif.",
        },
        {
          title: "Zakaatul Fixrii",
          description:
            "Zakaatul Fixrii nama tokkoon kaffalamu Iidaa dura kaffalaa; akka guyyaa Iidaa ga'uuf maatiiwwaniif ni raabsama.",
        },
        {
          title: "Kennaa Waqfii",
          description: "Kennaa bara baraa, kan bu'aan isaa dhaloota hedduuf hawaasa deeggaru, godhaa.",
        },
      ],
    },
    cta: {
      title: "Kennuuf qophooftaniittuu?",
      body: "Dirqama Zakaa keessaniin jalqabaa, ykn kaayyoolee amma banaa ta'an keessaa tokko filadhaa.",
      primary: "Shallagaa fi Zakaa kaffalaa",
      primaryTitle: "Shallagduu fayyadamuun Zakaa keessan shallagaa, achiis kaffalaa",
      secondary: "Kaayyoolee banaa ilaalaa",
      secondaryTitle: "Kaayyoolee amma kennaaf banaa ta'an ilaalaa",
    },
  },

  waqf: {
    crowdfunding: {
      meta: {
        title: "Waqfii Waloo",
        description:
          "Waqfiin waloo namoonni hedduun pirojektii itti fufiinsa qabu tokko waliin akka deeggaran ni dandeessisa. Pirojektoonni akkuma Komishiniin maxxanseen asitti tarreeffamu.",
        keywords:
          "Waqfii waloo, pirojektii Waqfii, Waqfii, maallaqa ummataan walitti qabuu, pirojektii hawaasaa, Itoophiyaa, Waqf crowdfunding",
      },
      breadcrumb: "Waqfii waloo",
      hero: {
        eyebrow: "Waqfii",
        title: "Waqfii",
        accent: "waloo",
        intro:
          "Waqfiin waloo namoonni hedduun Waqfii itti fufiinsa qabu tokko, kan akka bakka bishaanii ykn mana barumsaa, waliin akka deeggaran ni dandeessisa; inni erga maallaqni isaa guutameen booda illee yeroo dheeraaf kennuu itti fufa.",
      },
      projects: {
        eyebrow: "Pirojektoota",
        title: "Ammatti pirojektiin tarreeffame hin jiru",
        intro:
          "Pirojektoonni Waqfii akkuma Komishiniin maxxanseen asitti tarreeffamu. Hanga sanaatti fuula kana irratti wanti maallaqaan deeggaramu hin jiru.",
        causes: {
          title: "Kaayyoo Zakaa banaa ta'eef kennaa",
          body: "Kaayyoolee amma Zakaa fudhachaa jiran, galma isaanii fi hamma sassaabame wajjin ilaalaa.",
          linkTitle: "Kaayyoolee amma Zakaa fudhachaa jiran ilaalaa",
        },
        contact: {
          title: "Garee keenya wajjin mari'adhaa",
          body: "Waa'ee Waqfii godhuu ykn pirojektoota dhufan gaafadhaa.",
          linkTitle: "Waa'ee Waqfii garee EZAC quunnamaa",
        },
      },
      howItWorks: {
        eyebrow: "Akkaataa itti hojjetu",
        title: "Waqfiin waloo akkamitti hojjeta?",
        intro:
          "Namoonni hedduun pirojektii tokkoof kennu. Qabeenyi isaan deeggaran ni eegama; wanti inni argamsiisu ykn kennu qofti kaayyichaaf oola.",
        items: [
          {
            title: "Kennitoota hedduu, pirojektii tokko",
            description:
              "Namni hundi hamma danda'u pirojektii Waqfii tokkoof kenna; kanaanis waan namni tokko kophaa isaa deeggaruu hin dandeenye waliin deeggaruu danda'u.",
          },
          {
            title: "Qabeenyi bu'uuraa ni eegama",
            description:
              "Waqfiin hin baasamu. Qabeenyi Waqfii ta'e ni eegama; wanti inni argamsiisu ykn kennu qofti kaayyichaaf oola.",
          },
          {
            title: "Faayidaa itti fufu",
            description:
              "Pirojektiin tokko erga maallaqni isaa guutameen booda, kennaa dhumaa booda illee waggoota hedduuf hawaasa tajaajiluu itti fufa.",
          },
        ],
      },
      cta: {
        title: "Qabeenya Waqfii gochuu barbaaddan qabduu?",
        body: "Manni fi lafti, maallaqni ykn aksiyoonni Waqfii itti fufu ta'uu danda'u. Gareen keenya tarkaanfii hunda keessatti isin qajeelcha.",
        primary: "Qabeenya Waqfii galmeessaa",
        primaryTitle: "Akkaataa qabeenya tokko Waqfii godhanii itti galmeessan",
        secondary: "Invastimantii Waqfii ilaalaa",
        secondaryTitle: "Akkaataa kaappitaalli Waqfii itti invastii godhamu",
      },
    },
    investments: {
      meta: {
        title: "Invastimantii Waqfii",
        description:
          "Akkaataa kaappitaalli Waqfii qabeenya naamusa qabeessa fi Shari'aa hordofu keessatti itti invastii godhamu, akka qabeenyi bu'uuraa eegamee bu'aan isaa bara baraan kaayyoolee deeggaruuf.",
        keywords:
          "invastimantii Waqfii, Waqfii maallaqaa, invastimantii Shari'aa hordofu, Waqfii, sadaqaa jaariyaa, arjooma bara baraa, Itoophiyaa, Waqf investment",
      },
      breadcrumb: "Invastimantii Waqfii",
      hero: {
        eyebrow: "Waqfii",
        title: "Invastimantii",
        accent: "Waqfii",
        intro:
          "Kennaan Waqfii invastii godhama malee hin baasamu. Qabeenyi bu'uuraa bara baraan ni eegama; bu'aan isaa immoo waggaa waggaan gara kaayyoolee isiniif barbaachisoo ta'aniitti ni qajeelfama.",
      },
      principles: {
        eyebrow: "Akkaataa Hojii",
        title: "Waqfiin akkamitti kennuu itti fufa?",
        intro:
          "Waqfiin kennaa al tokkoo gara madda galii hawaasaa dhaabbataa ta'etti jijjiira: kaappitaalli Waqfii ta'e eegamee invastii godhama, bu'aan isaa qofti baasama.",
        items: [
          {
            title: "Qabeenya bu'uuraa bara baraa",
            description:
              "Kaappitaalli Waqfii ta'e bara baraan ni eegama — bu'aan inni argamsiisu qofti kaayyooleef baasama.",
          },
          {
            title: "Qabeenya Shari'aa hordofu",
            description:
              "Kaappitaalli gosoota qabeenyaa halaala, qoratamanii fi Boordii Gorsa Shari'aatiin raggaasifaman qofa keessa kaa'ama.",
          },
          {
            title: "Bu'aan kaayyoolee deeggara",
            description: "Galiin invastimantii bishaan, barnoota, tajaajila fayyaa fi hir'isuu hiyyummaatiif itti fufiinsaan ni oola.",
          },
          {
            title: "Bu'aa dabalaa deemu",
            description:
              "Akkuma Waqfiin guddatuun, kennaan waggaa inni danda'us ni guddata — kennaa kennuu hin dhiisne.",
          },
        ],
      },
      cta: {
        title: "Waqfii itti fufu ijaaraa",
        body: "Qabeenya tokko Waqfii godhaa galmeessaa, akka dhaloota dhufaniif deeggarsa itti fufaa argamsiisuuf.",
        primary: "Qabeenya Waqfii galmeessaa",
        primaryTitle: "Akkaataa qabeenya tokko Waqfii godhanii itti galmeessan",
        secondary: "Garee keenya wajjin mari'adhaa",
        secondaryTitle: "Waa'ee Waqfii garee EZAC quunnamaa",
      },
    },
    registerAsset: {
      meta: {
        title: "Qabeenya Waqfii Galmeessaa",
        description:
          "Qabeenya dhaabbataa, maallaqa, aksiyoona ykn lafa qonnaa Waqfii bara baraa godhaa — galmaa'ee, sanadaan deeggaramee fi bulchiinsa EZAC jalatti kan bulfamu.",
        keywords:
          "Waqfii galmeessuu, qabeenya Waqfii, qabeenya waqfuu, Waqfii maallaqaa, sanada Waqfii, Waqfii lafa qonnaa, Itoophiyaa, register Waqf",
      },
      breadcrumb: "Qabeenya Waqfii galmeessuu",
      hero: {
        eyebrow: "Waqfii",
        title: "Qabeenya Waqfii",
        accent: "galmeessaa",
        intro:
          "Qabeenya dhaabbataa, maallaqa, aksiyoona ykn lafa Waqfii bara baraa godhaa. Sanadoota, gamaaggama Shari'aa fi bulchiinsa itti fufaa nuti ni hojjenna, akka kennaan keessan bara baraan kennu.",
      },
      assets: {
        eyebrow: "Waan Waqfii gochuu dandeessan",
        title: "Maalan Waqfii gochuu danda'a?",
        intro:
          "Qabeenyi dhaabbataa, maallaqni, aksiyoonaa fi waraqaaleen qabeenyaa, akkasumas lafti qonnaa hundi Waqfii ta'anii galmaa'uu danda'u.",
        items: [
          {
            title: "Mana fi lafa",
            description: "Gamoowwanii fi lafa, kan galiin kiraa isaanii bara baraan kaayyoolee murtaa'an deeggaru.",
          },
          {
            title: "Waqfii maallaqaa",
            description: "Kennaa maallaqaa walitti qabamee invastii godhamu; bu'aan isaa qofti raabsama.",
          },
          {
            title: "Aksiyoonaa fi waraqaalee qabeenyaa",
            description: "Aksiyoonaa fi sukuuk Shari'aa hordofan, kennaa Waqfii itti fufu ta'uuf kan kennaman.",
          },
          {
            title: "Lafa qonnaa",
            description: "Lafa qonnaa, kan oomishni ykn galiin kiraa isaa sagantaalee hawaasaa deeggaru.",
          },
        ],
      },
      process: {
        eyebrow: "Adeemsa",
        title: "Yaada irraa hanga Waqfiitti",
        items: [
          {
            title: "Yaada keessan ibsaa",
            body: "Qabeenya Waqfii gochuu barbaaddanii fi kaayyoolee akka tajaajilu barbaaddan nuuf himaa.",
          },
          {
            title: "Sanadeessuu fi mirkaneessuu",
            body: "Abbummaa ni mirkaneessina, sanada Waqfiis to'annoo Shari'aa jalatti ni qopheessina.",
          },
          {
            title: "Waqfii gochuu fi bulchuu",
            body: "Qabeenyichi Waqfii ta'ee galmaa'a, bakka keessan bu'uudhaanis ogummaadhaan ni bulfama.",
          },
        ],
      },
      cta: {
        title: "Galmee Waqfii keessanii jalqabaa",
        body: "Galmeen marii irraa jalqaba: garee Waqfii keenya quunnamaa, tarkaanfii hunda keessatti isin qajeelchina.",
        primary: "Galmee jalqabaa",
        primaryTitle: "Galmee jalqabuuf garee Waqfii quunnamaa",
        secondary: "Akkaataa invastimantii Waqfii",
        secondaryTitle: "Akkaataa kaappitaalli Waqfii itti invastii godhamu dubbisaa",
      },
    },
  },

  causes: {
    meta: {
      title: "Kaayyoolee",
      description:
        "Kaayyoolee mirkanaa'an Itoophiyaa guutuu keessatti Zakaan keessan deeggaru, galma tokkoon tokkoon isaanii irratti hammam akka dhihaatan ifatti.",
      keywords:
        "kaayyoolee Zakaa, kaayyoolee mirkanaa'an, kaayyoo tokkoof kennuu, pirojektoota arjoomaa Itoophiyaa, Sadaqaa, Zakat causes",
      closedTitle: "Kaayyoolee xumuraman",
      closedDescription:
        "Kaayyoolee Itoophiyaa guutuu keessaa cufaman, tokkoon tokkoon isaanii galma isaatiif hammam akka sassaabe wajjin.",
    },
    breadcrumb: "Kaayyoolee",
    hero: {
      eyebrow: "Zakaa",
      title: "Kaayyoolee",
      accent: "deeggaruu dandeessan",
      intro:
        "Kaayyoon hundi osoo hin tarreeffamin dura ni gamaagamama. Fedhiiwwan hatattamaa dursa argatu; tokkoon tokkoon isaa hanga ammaatti hammam akka sassaabame agarsiisa.",
    },
    filter: {
      label: "Haala kaayyoo",
      active: "Amma banaa",
      activeTitle: "Kaayyoolee amma banaa ta'an agarsiisaa",
      closed: "Xumuraman",
      closedTitle: "Kaayyoolee cufaman agarsiisaa",
      seeClosed: { label: "Kaayyoolee xumuraman {count} ilaalaa", title: "Kaayyoolee cufamanii fi maallaqa walitti qaban" },
    },
    listHeading: {
      active: "Kaayyoolee amma banaa ta'an",
      closed: "Kaayyoolee xumuraman",
    },
    empty: {
      active: "Ammatti kaayyoon banaa ta'e hin jiru. Zakaan keessan ammas karaa kuusaa waliigalaa maatiiwwan ga'a.",
      closed: "Hanga ammaatti kaayyoon xumurame hin jiru.",
    },
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
    badges: {
      urgent: "Hatattamaa",
      essential: "Barbaachisaa",
    },
    cta: {
      title: "Eessaaf akka kennitan hin beektanii?",
      body: "Kuusaan Zakaa waliigalaa bakka fedhiin itti caalaa jirutti maatiiwwan mirkanaa'an ga'a.",
      primary: "Amma Zakaa kaffalaa",
      primaryTitle: "Akkaataa appii EZAC keessatti Zakaa itti kaffaltan",
      secondary: "Bu'aa keenya ilaalaa",
      secondaryTitle: "Bu'aa keenya daashboordii iftoominaa kallattii irratti ilaalaa",
    },
  },

  causeCard: {
    imageAlt: "Suuraa: {title}",
    raisedOfGoal: "ETB {raised}, galma {goal} keessaa",
    raisedOnly: "ETB {raised}",
    goalOnly: "Galma: ETB {goal}",
    raised: "Sassaabame",
    percent: "{pct}%",
    goalReached: "Galmi ga'ameera",
    give: "Zakaa keessan kennaa",
    support: "Kaayyoo kana deeggaraa",
    giveTitle: "Akkaataa appii EZAC keessatti itti kennitan",
    seeResult: "Bu'aa ilaalaa",
    seeResultTitle: "Bu'aa {title} ilaalaa",
  },

  cause: {
    meta: {
      fallbackTitle: "Kaayyoo",
      keywords: "kaayyoo Zakaa, Zakaa kennuu, pirojektii arjoomaa, Itoophiyaa",
    },
    coverAlt: "Suuraa: {title}",
    galleryAlt: "Suuraa {count} keessaa {n}ffaa: {title}",
    amount: "ETB {amount}",
    noAmount: "—",
    raised: "Sassaabame",
    raisedOfGoal: "ETB {goal} keessaa sassaabame",
    progressLabel: "Galma ga'uuf kan sassaabame",
    percentOfGoal: "Galma keessaa {pct}%",
    goalReached: "Galmi ga'ameera",
    region: "Naannoo",
    closed: "Guyyaa cufame",
    ended: "Guyyaa xumurame",
    ends: "Guyyaa xumuramu",
    zakatEligible: "Zakaa fudhachuu danda'a",
    yes: "Eeyyee",
    no: "Lakki",
    closedNote: "Kaayyoon kun cufameera. Namoota kennan hunda ni galateeffanna.",
    give: "Zakaa keessan kennaa",
    support: "Kaayyoo kana deeggaraa",
    giveTitle: "Akkaataa appii EZAC keessatti itti kennitan",
    paymentNote: "Kaffaltiin appii EZAC keessatti, karaa Baankii Hojii Gamtaa Oromiyaa raawwatama.",
    cta: {
      title: "Zakaan eessa akka ga'u ilaalaa",
      body: "Sassaabbii fi raabsa Itoophiyaa guutuu keessaa daashboordii kallattii irratti hordofaa.",
      primary: "Daashboordii kallattii",
      primaryTitle: "Daashboordii iftoominaa kallattii banaa",
      secondary: "Kaayyoolee hunda",
      secondaryTitle: "Kaayyoolee hunda ilaalaa",
    },
  },

  certificate: {
    label: "Lakkoofsa ragaa",
    placeholder: "Lakkoofsa ragaa, fkn. ZC-2026-000451",
    verify: "Mirkaneessaa",
    checking: "Sakatta'amaa jira…",
    genuine: "{id} ragaa dhugaa dha",
    notFound: "Ragaan lakkoofsa {id} qabu hin jiru. Lakkoofsicha sakatta'aatii irra deebi'aa yaalaa.",
    badNumber: "Kun lakkoofsa ragaa hin fakkaatu.",
    couldNotCheck: "Ragaa mirkaneessuu hin dandeenye. Xiqqoo booda irra deebi'aa yaalaa.",
    amount: "Hamma",
    amountValue: "ETB {amount}",
    type: "Zakaa",
    paidOn: "Guyyaa kaffalame",
    none: "—",
  },
};

export default giving;
