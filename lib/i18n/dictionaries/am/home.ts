import type { Messages } from "@/lib/i18n/messages";
import type en from "../en/home";

/**
 * Amharic strings for the landing page (app/[lang]/page.tsx). Arrays stay
 * aligned by position with the English source (icons depend on the order).
 */
const home: Messages<typeof en> = {
  meta: {
    title: "EZAC — የኢትዮጵያ ዘካ እና አውቃፍ ኮሚሽን",
    description:
      "የኢትዮጵያ ታማኝ የዘካ እና የወቅፍ ዲጂታል መድረክ። በወቅታዊ የኒሷብ ዋጋ ዘካዎን ያስሉ፣ ከማንኛውም የኢትዮጵያ ባንክ መተግበሪያ በQR ይክፈሉ፣ እያንዳንዱ ብር የት እንደሚደርስ ይከታተሉ።",
    keywords:
      "የዘካ ማስያ, ዘካ ማስያ ኢትዮጵያ, ዘካ መክፈል, የዛሬ ኒሷብ, የወርቅ ዋጋ ኢትዮጵያ, የዛሬ የወርቅ ዋጋ, ወቅፍ ኢትዮጵያ, ዘካ ኢትዮጵያ, ዘካት, የዘካ ዓላማዎች, የኢትዮጵያ ዘካ እና አውቃፍ ኮሚሽን",
  },
  hero: {
    title: {
      accent1: "አስተማማኝ",
      text1: "ዘካ።",
      accent2: "ዘላቂ",
      text2: "ወቅፍ።",
    },
    body: "የኢትዮጵያ ታማኝ የዘካ እና የወቅፍ ዲጂታል መድረክ። በሂሳባዊ ትክክለኛነትና በተሟላ ግልጽነት ዘካዎን ያስሉ፣ ይስጡ፣ ወቅፍ ያድርጉ — እያንዳንዱ ብር ከእጅዎ ወጥቶ ለሚደግፋቸው ቤተሰቦችና ለሚገነባው ነገ እስኪደርስ ድረስ ክትትል ይደረግበታል።",
    calculate: { label: "ዘካዎን ያስሉ", title: "የዘካ ማስያውን ይክፈቱ" },
    receive: {
      label: "ዘካ እንዴት እንደሚቀበሉ",
      title: "ቤተሰቦች ዘካ ለመቀበል እንዴት እንደሚመዘገቡ",
    },
    partnersLabel: "ከሚከተሉት ጋር በመተባበር",
    partners: {
      coopbank: { alt: "Coopbank Alhuda", title: "ወደ Coopbank Alhuda ድረ ገጽ ይሂዱ (በአዲስ ትር ይከፈታል)" },
      dxvalley: { alt: "DX Valley", title: "ወደ DX Valley ድረ ገጽ ይሂዱ (በአዲስ ትር ይከፈታል)" },
    },
  },
  trustStrip: {
    eyebrow: "በታመነ መሠረተ ልማት ላይ የተገነባ",
    title: "ትክክለኛነት፣ ግልጽነት፣ ተደራሽነት።",
    link: { label: "እንዴት እንደሚሠራ ይመልከቱ", title: "ዘካ እንዴት እንደሚሰበሰብ፣ እንደሚጣራ እና እንደሚከፈል" },
    items: {
      nisab: { label: "ወቅታዊ የኒሷብ ዋጋ", sub: "በየቀኑ የሚታደስ የወርቅና የብር ዋጋ" },
      households: { label: "የተገመገሙ ቤተሰቦች", sub: "ተጎብኝተው፣ ነጥብ ተሰጥቷቸው በቅርንጫፍ የጸደቁ" },
      qr: { label: "በQR ይክፈሉ", sub: "ከማንኛውም የኢትዮጵያ ባንክ መተግበሪያ" },
      languages: { label: "አራት ቋንቋዎች", sub: "እንግሊዝኛ፣ አማርኛ፣ አፋን ኦሮሞ እና ዓረብኛ" },
      dashboard: { label: "የቀጥታ ዳሽቦርድ", sub: "ይፋዊ አኃዞች፣ በየጥቂት ደቂቃው የሚታደሱ" },
    },
  },
  ticker: {
    ariaLabel: "የቀጥታ ውጤት ማሳያ",
    live: "የቀጥታ ውጤት",
    groupLabel: "የቀጥታ ውጤት አኃዞች። ለአፍታ ለማቆም ጠቋሚውን በላዩ ላይ ያሳርፉ ወይም በቁልፍ ሰሌዳ ይምረጡት።",
    /** An amount in birr. */
    etb: "ETB {amount}",
    /** A price in birr per gram. */
    etbPerGram: "ETB {amount}/ግራም",
    nisabGold: "የዛሬው ኒሷብ (ወርቅ)",
    nisabSilver: "የዛሬው ኒሷብ (ብር)",
    gold24k: "ወርቅ 24 ካራት",
    collected: "የተሰበሰበ ዘካ",
    thisMonth: "በዚህ ወር",
    families: "የተደገፉ ቤተሰቦች",
    distributed: "የተከፋፈለ ገንዘብ",
    lives: "የደረሰላቸው ሰዎች",
    projects: "ክፍት የድጋፍ ዓላማዎች",
  },
  causes: {
    eyebrowUrgent: "አስቸኳይ ፍላጎቶች",
    eyebrowOpen: "ክፍት የድጋፍ ዓላማዎች",
    eyebrowEmpty: "የድጋፍ ዓላማዎች",
    title: { before: "", accent: "ዘካዎ", after: "የሚደርስላቸው ዓላማዎች።" },
    intro: "በመላው ኢትዮጵያ የሚገኙ የድጋፍ ዓላማዎች፤ እያንዳንዳቸው ከመዘርዘራቸው በፊት ይገመገማሉ፣ ወደ ግባቸው የሚያደርጉት እድገትም ይታያል።",
    introEmpty: "በአሁኑ ጊዜ ክፍት የሆነ የድጋፍ ዓላማ የለም። ኮሚሽኑ አዳዲስ ዓላማዎችን ይፋ እንዳደረገ ወዲያውኑ እዚህ ይታያሉ።",
    seeAll: { label: "ሁሉንም ዓላማዎች ይመልከቱ", title: "ክፍት የሆኑትን ሁሉንም የድጋፍ ዓላማዎች ይመልከቱ" },
    howReaches: { label: "ዘካ ለቤተሰቦች እንዴት እንደሚደርስ", title: "ቤተሰቦች እንዴት እንደሚገመገሙና ክፍያ እንደሚፈጸምላቸው" },
  },
  howItWorks: {
    eyebrow: "ግልጽነት፣ ማረጋገጫ፣ ደኅንነት",
    title: "ዘካዎ እንዴት ይጠበቃል?",
    intro:
      "የሸሪዓ ምሁራን ደንቦቹን ይመራሉ፣ እያንዳንዱ ቤተሰብ ክፍያ ከመፈጸሙ በፊት ይገመገማል፤ እያንዳንዱ ክፍያም ከባንክ መዝገብ ጋር ይመሳከራል።",
    step: "ደረጃ {n}",
    steps: [
      {
        title: "የሸሪዓ መመሪያ",
        description: "በኮሚሽኑ ማቋቋሚያ ደንብ የተቋቋመ የሸሪዓ አማካሪ ቦርድ ዘካ እንዴት እንደሚሰላና እንደሚከፋፈል ይመራል።",
      },
      {
        title: "የተገመገሙና ነጥብ የተሰጣቸው ቤተሰቦች",
        description:
          "ዋናው መሥሪያ ቤት በባንክ ዝውውር ክፍያ ከመፈጸሙ በፊት እያንዳንዱ ቤተሰብ ይጎበኛል፣ ይፋ በተደረገ የነጥብ ሰንጠረዥ ነጥብ ይሰጠዋል፣ በቅርንጫፉም ይጸድቃል።",
      },
      {
        title: "ከባንክ መዝገብ ጋር የተመሳከረ፣ የተመዘገበ",
        description:
          "የሚገቡ ክፍያዎች ከባንክ ግብይቶች ጋር ይመሳከራሉ፣ ወጪ ክፍያዎች የሚተላለፉት ከባንኩ ጋር ወደተጣሩ ሂሳቦች ብቻ ነው፤ እያንዳንዱ ለውጥም ይመዘገባል።",
      },
    ],
    cta: { label: "ሙሉውን ሂደት ይመልከቱ", title: "ዘካ እንዴት እንደሚሰበሰብ፣ እንደሚጣራ እና እንደሚከፈል ደረጃ በደረጃ ያንብቡ" },
  },
  impactMap: {
    eyebrow: "ሀገር አቀፍ እይታ",
    title: { before: "ድጋፍ የት", accent: "እንደሚደርስ", after: "።" },
    mapLabel: "ድጋፍ የደረሰባቸው ክልሎች ካርታ",
    beneficiaries: "{count} ተጠቃሚዎች",
    distributed: "ETB {amount} ተከፋፍሏል",
    projects: "{count} ክፍት የድጋፍ ዓላማዎች",
    noFigures: "እስካሁን ይፋ የተደረገ አኃዝ የለም",
    dashboardLink: {
      label: "ሙሉውን የግልጽነት ዳሽቦርድ ይመልከቱ",
      title: "የቀጥታ የግልጽነት ዳሽቦርዱን ይክፈቱ",
    },
  },
  partners: {
    eyebrow: "ተቋማዊ ድጋፍ",
    title: { before: "አጋሮችና", accent: "ደጋፊ አካላት", after: "።" },
    names: {
      majlis: "የኢትዮጵያ እስልምና ጉዳዮች ጠቅላይ ምክር ቤት (መጅሊስ)",
      coopbank: "Coopbank Alhuda",
      dxvalley: "DX Valley",
      fayda: "Fayda",
      ethswitch: "EthSwitch",
    },
    /** Tooltip on a partner's logo link. */
    visit: "ወደ {name} ድረ ገጽ ይሂዱ (በአዲስ ትር ይከፈታል)",
  },
};

export default home;
