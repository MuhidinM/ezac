import type { Messages } from "@/lib/i18n/messages";
import type en from "../en/common";

const common: Messages<typeof en> = {
  site: {
    name: "EZAC",
    organization: "Komishinii Zakaa fi Awqaaf Itoophiyaa",
    tagline:
      "Bakka dijitaalaa amanamaa Zakaa fi Waqfii Itoophiyaa. Sirriitti fi iftoominaan shallagaa, kennaa, Waqfiis godhaa.",
    defaultTitle: "EZAC — Komishinii Zakaa fi Awqaaf Itoophiyaa",
    keywords:
      "Zakaa, Zakat, Waqfii, Awqaaf, Itoophiyaa, shallagduu Zakaa, Nisaaba, nisab, Sadaqaa, arjooma Islaamaa, Zakaatul Fixrii, EZAC",
    logoAlt: "Asxaa EZAC",
  },
  skipToContent: "Gara qabiyyeetti darbaa",
  newTab: "(tabii haaraa keessatti banama)",
  language: {
    label: "Afaan",
    choose: "Afaan filadhaa",
    current: "Afaan ammaa",
    switchTo: "Fuula kana afaan kanaan dubbisaa: {language}",
  },
  nav: {
    ariaLabel: "Muummee",
    mobileAriaLabel: "Baafata muummee",
    home: {
      tagline: "Komishinii Zakaa fi Awqaaf Itoophiyaa",
      title: "Gara fuula jalqabaa EZAC deemaa",
    },
    groups: {
      zakat: "Zakaa",
      waqf: "Waqfii",
      transparency: "Iftoominaa fi Bu'aa",
      about: "Waa'ee Keenya",
    },
    links: {
      calculator: { label: "Shallagduu Zakaa", title: "Shallagduu Zakaa banaa" },
      pay: { label: "Amma Zakaa Kaffalaa", title: "Akkaataa Zakaa keessan itti kaffaltan ilaalaa" },
      causes: { label: "Kaayyoolee", title: "Kaayyoolee Zakaan keessan deeggaru ilaalaa" },
      corporate: { label: "Zakaa Dhaabbilee", title: "Zakaa kubbaaniyyootaa fi daldaltootaaf" },
      waqfCrowdfunding: { label: "Waqfii Waloo", title: "Pirojektoota Waqfiitiif waliin kennaa" },
      waqfInvestments: { label: "Invastimantii Waqfii", title: "Akkaataa qabeenyi Waqfii itti invastii godhamu ilaalaa" },
      waqfRegister: {
        label: "Qabeenya Waqfii Galmeessaa",
        title: "Qabeenya tokko Waqfii godhaa Komishinicha biratti galmeessaa",
      },
      dashboard: { label: "Daashboordii Kallattii", title: "Lakkoofsota sassaabbii fi raabsaa kallattiin ilaalaa" },
      howItWorks: {
        label: "Akkaataa Hojii",
        title: "Akkaataa Zakaan itti sassaabamu, itti mirkanaa'uu fi itti kaffalamu",
      },
      stories: { label: "Seenaalee Bu'aa", title: "Seenaa namootaa fi pirojektoota Zakaan ga'e dubbisaa" },
      reports: { label: "Gabaasota Bu'aa", title: "Gabaasota Komishinichi maxxanse dubbisaa" },
      about: { label: "Waa'ee Komishinichaa", title: "Eenyu akka taanee fi Komishinichi maal akka hojjetu" },
      documents: { label: "Sanadoota Seeraa", title: "Sanadoota seeraa Komishinichaa dubbisaa" },
      governance: { label: "Bulchiinsaa fi Majlisa", title: "Akkaataa Komishiniin itti bulfamu" },
      shariahBoard: { label: "Boordii Gorsa Shari'aa", title: "Miseensota Boordii Gorsa Shari'aa beekaa" },
    },
    donate: { label: "Amma Kennaa", title: "Kaayyoo banaa ta'eef kennaa" },
    staffSignIn: { label: "Seensa hojjettootaa", title: "Poortaalii hojjettootaatti seenaa (hojjettoota qofaaf)" },
    openMenu: "Baafata banaa",
    closeMenu: "Baafata cufaa",
    menuTitle: "Baafata",
    menuDescription: "Fuulota weebsaayitii EZAC",
  },
  footer: {
    ariaLabel: "Miila fuulaa",
    app: {
      eyebrow: "Bilbila harkaatiin",
      title: "Appii lammiilee argadhaa",
      body: "Bilbilota Android qofaaf. Appichi kallattiin kan buufatamu (faayila APK) malee kuusaa appii irraa miti.",
      download: "Appii Android buufadhaa",
      downloadNote: "(faayila APK, tabii haaraa keessatti banama)",
      downloadTitle: "Appii lammiilee EZAC kan Android buufadhaa (faayila APK, tabii haaraa keessatti banama)",
    },
    links: {
      privacy: {
        label: "Imaammata Iccitii Dhuunfaa",
        title: "Akkaataa odeeffannoo keessan itti sassaabnu, itti fayyadamnuu fi itti eegnu",
      },
      faq: { label: "Gaaffii fi Deebii", title: "Deebii gaaffilee waa'ee Zakaa fi EZAC baay'inaan gaafatamanii" },
      fatwas: {
        label: "Fatwaawwan / Murtiiwwan Islaamaa Zakaa irratti",
        title: "Murtiiwwan seerotni Zakaa hordofan dubbisaa",
      },
      contact: { label: "Deeggarsa Quunnamaa", title: "Garee EZAC irraa gargaarsa argadhaa" },
    },
    copyright: "© {year} EZAC. Mirgi hundi seeraan eegamaadha.",
    developedBy: "Misoomaa fi deeggarsa: DX Valley.",
    developedByTitle: "Weebsaayitii DX Valley daawwadhaa (tabii haaraa keessatti banama)",
  },
  errors: {
    notFound: {
      metaTitle: "Fuulli hin argamne",
      eyebrow: "Fuulli hin argamne",
      title: "Fuula sana",
      accent: "argachuu hin dandeenye",
      body: "Liinkichi dogoggora ta'uu mala, ykn fuulichi bakka biraatti socho'ee ykn kaafamee ta'uu mala.",
      goHome: { label: "Gara fuula jalqabaa deemaa", title: "Gara fuula jalqabaa EZAC deemaa" },
      seeCauses: { label: "Kaayyoolee banaa ilaalaa", title: "Kaayyoolee amma Zakaaf banaa ta'an ilaalaa" },
    },
    error: {
      metaTitle: "Rakkoon uumameera",
      eyebrow: "Dogoggora",
      title: "Rakkoon tokko",
      accent: "uumameera",
      body: "Rakkoon kun kan keenya malee kan keessan miti. Xiqqoo booda irra deebi'aa yaalaa.",
      tryAgain: "Irra deebi'aa yaalaa",
      goHome: { label: "Gara fuula jalqabaa deemaa", title: "Gara fuula jalqabaa EZAC deemaa" },
      contact: {
        before: "Yoo irra deddeebi'e,",
        link: "nu quunnamaa",
        after: "lakkoofsa wabii kanas nuuf himaa.",
        title: "Garee EZAC quunnamaa",
      },
      reference: "Lakkoofsa wabii:",
    },
  },
};

export default common;
