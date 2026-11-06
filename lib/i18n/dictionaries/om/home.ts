import type { Messages } from "@/lib/i18n/messages";
import type en from "../en/home";

const home: Messages<typeof en> = {
  meta: {
    title: "EZAC — Komishinii Zakaa fi Awqaaf Itoophiyaa",
    description:
      "Waltajjii dijitaalaa amanamaa Zakaa fi Waqfii Itoophiyaa. Gatii Nisaabaa kallattii fayyadamuun Zakaa shallagaa, appii baankii Itoophiyaa kamiinuu karaa QR kaffalaa, qarshii hundas hordofaa.",
    keywords:
      "shallagduu Zakaa Itoophiyaa, Zakaa kaffaluu, Nisaaba har'aa, gatii warqee Itoophiyaa, Waqfii Itoophiyaa, kaayyoolee Zakaa, Komishinii Zakaa fi Awqaaf Itoophiyaa, Zakat calculator Ethiopia, EZAC",
  },
  hero: {
    title: {
      accent1: "Zakaa",
      text1: "amanamaa.",
      accent2: "Waqfii",
      text2: "bara baraa.",
    },
    body: "Waltajjii dijitaalaa amanamaa Zakaa fi Waqfii Itoophiyaa. Sirrummaa lakkoofsaa fi iftoomina guutuudhaan shallagaa, kennaa, Waqfiis godhaa — qarshiin hundi harka keessanii irraa kaasee hanga maatiiwwanii fi egeree inni ijaaruutti ni hordofama.",
    calculate: { label: "Zakaa Keessan Shallagaa", title: "Shallagduu Zakaa banaa" },
    receive: {
      label: "Akkaataa Zakaa Argachuu",
      title: "Akkaataa maatiiwwan Zakaa argachuuf itti galmaa'an",
    },
    partnersLabel: "Kan waliin hojjennu",
    partners: {
      coopbank: {
        alt: "Coopbank Alhuda",
        title: "Weebsaayitii Coopbank Alhuda daawwadhaa (tabii haaraa keessatti banama)",
      },
      dxvalley: { alt: "DX Valley", title: "Weebsaayitii DX Valley daawwadhaa (tabii haaraa keessatti banama)" },
    },
  },
  trustStrip: {
    eyebrow: "Bu'uura amanamaa irratti ijaarame",
    title: "Sirrummaa, iftoomina, dhaqqabamummaa.",
    link: {
      label: "Akkaataa hojii ilaalaa",
      title: "Akkaataa Zakaan itti sassaabamu, itti mirkanaa'uu fi itti kaffalamu",
    },
    items: {
      nisab: { label: "Gatii Nisaabaa Kallattii", sub: "Gatiin warqee fi meetii guyyaa guyyaan haaromfama" },
      households: { label: "Maatiiwwan Madaalaman", sub: "Daawwataman, qabxiin kennameef, dameetti raggaasifaman" },
      qr: { label: "Karaa QR Kaffalaa", sub: "Appii baankii Itoophiyaa kamiinuu" },
      languages: { label: "Afaanota Afur", sub: "Ingiliffaa, Afaan Amaaraa, Afaan Oromoo fi Arabiffaa" },
      dashboard: { label: "Daashboordii Kallattii", sub: "Lakkoofsota ummataaf banaa, daqiiqaa muraasa hundaan haaromfaman" },
    },
  },
  ticker: {
    ariaLabel: "Agarsiisa bu'aa kallattii",
    live: "Bu'aa Kallattii",
    groupLabel: "Lakkoofsota bu'aa kallattii. Dhaabuuf maawusii irra qabaa ykn irratti xiyyeeffadhaa.",
    etb: "ETB {amount}",
    etbPerGram: "ETB {amount}/g",
    nisabGold: "Nisaaba har'aa (warqee)",
    nisabSilver: "Nisaaba har'aa (meetii)",
    gold24k: "Warqee 24k",
    collected: "Zakaa Sassaabame",
    thisMonth: "Ji'a Kana",
    families: "Maatiiwwan Deeggaraman",
    distributed: "Maallaqa Raabsame",
    lives: "Namoota Fayyadaman",
    projects: "Kaayyoolee Banaa",
  },
  causes: {
    eyebrowUrgent: "Fedhiiwwan hatattamaa",
    eyebrowOpen: "Kaayyoolee banaa",
    eyebrowEmpty: "Kaayyoolee",
    title: { before: "Kaayyoolee", accent: "Zakaan", after: "keessan ga'u." },
    intro:
      "Kaayyoolee Itoophiyaa guutuu keessaa; tokkoon tokkoon isaanii osoo hin tarreeffamin dura ni gamaagamu, galma isaaniitti hammam akka dhihaatan ni agarsiisu.",
    introEmpty:
      "Ammatti kaayyoon banaa ta'e hin jiru. Kaayyooleen haaraan akkuma Komishiniin maxxanseen asitti mul'atu.",
    seeAll: { label: "Kaayyoolee hunda ilaalaa", title: "Kaayyoolee banaa hunda sakatta'aa" },
    howReaches: {
      label: "Akkaataa Zakaan maatiiwwan itti ga'u",
      title: "Akkaataa maatiiwwan itti madaalamanii fi kaffaltii itti argatan",
    },
  },
  howItWorks: {
    eyebrow: "Iftoomina, mirkaneessa, nageenya",
    title: "Zakaan keessan akkamitti nagaan eegama?",
    intro:
      "Beektonni Shari'aa seerota ni qajeelchu, maatiin hundi osoo kaffaltii hin argatin dura ni madaalama, kaffaltiin hundis galmee baankii wajjin ni walsimsiifama.",
    step: "Tarkaanfii {n}",
    steps: [
      {
        title: "Qajeelfama Shari'aa",
        description:
          "Boordiin Gorsa Shari'aa dambii hundeeffama Komishinichaa jalatti hundeeffame, akkaataa Zakaan itti shallagamuu fi raabsamu ni qajeelcha.",
      },
      {
        title: "Maatiiwwan Madaalamanii Qabxii Argatan",
        description:
          "Maatiin hundi ni daawwatama, gabatee qabxii maxxanfame irratti hundaa'uun qabxiin itti kennama, dame isaatti ni raggaasifama; achiis waajjirri muummee karaa daddabarsa baankii kaffaltii raawwata.",
      },
      {
        title: "Baankii Wajjin Walsimsiifame, Galmaa'e",
        description:
          "Kaffaltiin seenu daddabarsa baankii wajjin ni walsimsiifama, kaffaltiin bahu herrega baankiin mirkanaa'e qofatti ni ergama, jijjiiramni hundis ni galmaa'a.",
      },
    ],
    cta: {
      label: "Adeemsa guutuu ilaalaa",
      title: "Akkaataa Zakaan itti sassaabamu, itti mirkanaa'uu fi itti kaffalamu tarkaanfii tarkaanfiin dubbisaa",
    },
  },
  impactMap: {
    eyebrow: "Ilaalcha biyya guutuu",
    title: { before: "Bakkeewwan deeggarsi", accent: "ga'u", after: "." },
    mapLabel: "Kaartaa naannolee deeggarsi ga'e",
    beneficiaries: "fayyadamtoota {count}",
    distributed: "ETB {amount} raabsame",
    projects: "kaayyoolee banaa {count}",
    noFigures: "Hanga ammaatti lakkoofsi hin maxxanfamne",
    dashboardLink: {
      label: "Daashboordii Iftoominaa Guutuu Ilaalaa",
      title: "Daashboordii iftoominaa kallattii banaa",
    },
  },
  partners: {
    eyebrow: "Deeggarsa dhaabbilee",
    title: { before: "Michoota", accent: "fi deeggartoota", after: "." },
    names: {
      majlis: "Majlisa Olaanaa Dhimmoota Islaamaa (Majlisa)",
      coopbank: "Coopbank Alhuda",
      dxvalley: "DX Valley",
      fayda: "Fayda",
      ethswitch: "EthSwitch",
    },
    visit: "Weebsaayitii {name} daawwadhaa (tabii haaraa keessatti banama)",
  },
};

export default home;
