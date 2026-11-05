import type { Messages } from "@/lib/i18n/messages";
import type en from "../en/common";

/**
 * Amharic strings shared by every public page: site name, skip link, language
 * switcher, navigation, footer, error pages. `title` strings are link
 * tooltips: they say where the link goes or what it does.
 */
const common: Messages<typeof en> = {
  site: {
    name: "EZAC",
    organization: "የኢትዮጵያ ዘካ እና አውቃፍ ኮሚሽን",
    tagline: "የኢትዮጵያ ታማኝ የዘካ እና የወቅፍ ዲጂታል መድረክ። በትክክለኛነትና በግልጽነት ያስሉ፣ ይስጡ፣ ወቅፍ ያድርጉ።",
    defaultTitle: "EZAC — የኢትዮጵያ ዘካ እና አውቃፍ ኮሚሽን",
    keywords: "ዘካ, ዘካት, ወቅፍ, አውቃፍ, ኢትዮጵያ, የዘካ ማስያ, ኒሷብ, ሰደቃ, ኢስላማዊ በጎ አድራጎት, EZAC",
    logoAlt: "የEZAC አርማ",
  },
  skipToContent: "ወደ ዋናው ይዘት ይሂዱ",
  /** Added (visually hidden) after the text of links that open a new tab. */
  newTab: "(በአዲስ ትር ይከፈታል)",
  language: {
    label: "ቋንቋ",
    choose: "ቋንቋ ይምረጡ",
    current: "የአሁኑ ቋንቋ",
    /** Tooltip on each language in the switcher. {language} is the language's own name (English, Afaan Oromoo, العربية), so it is kept apart from Amharic prefixes. */
    switchTo: "ይህን ገጽ በዚህ ቋንቋ ያንብቡ፦ {language}",
  },
  nav: {
    ariaLabel: "ዋና ማውጫ",
    mobileAriaLabel: "ዋና ምናሌ",
    home: {
      tagline: "የኢትዮጵያ ዘካ እና አውቃፍ ኮሚሽን",
      title: "ወደ EZAC ዋና ገጽ ይሂዱ",
    },
    groups: {
      zakat: "ዘካ",
      waqf: "ወቅፍ",
      transparency: "ግልጽነትና ውጤት",
      about: "ስለ እኛ",
    },
    links: {
      calculator: { label: "የዘካ ማስያ", title: "የዘካ ማስያውን ይክፈቱ" },
      pay: { label: "ዘካ አሁን ይክፈሉ", title: "ዘካዎን እንዴት እንደሚከፍሉ ይመልከቱ" },
      causes: { label: "የድጋፍ ዓላማዎች", title: "ዘካዎ የሚደግፋቸውን ዓላማዎች ይመልከቱ" },
      corporate: { label: "የድርጅት ዘካ", title: "ለኩባንያዎችና ለንግድ ድርጅቶች የሚሆን ዘካ" },
      waqfCrowdfunding: { label: "የወቅፍ የጋራ መዋጮ", title: "ለወቅፍ ፕሮጀክቶች በጋራ ያዋጡ" },
      waqfInvestments: { label: "የወቅፍ ኢንቨስትመንቶች", title: "የወቅፍ ሀብቶች እንዴት ኢንቨስት እንደሚደረጉ ይመልከቱ" },
      waqfRegister: { label: "የወቅፍ ንብረት ያስመዝግቡ", title: "ንብረትዎን በኮሚሽኑ ዘንድ ወቅፍ አድርገው ያስመዝግቡ" },
      dashboard: { label: "የቀጥታ ዳሽቦርድ", title: "የዘካ አሰባሰብና ክፍፍል አኃዞችን በቀጥታ ይመልከቱ" },
      howItWorks: { label: "እንዴት እንደሚሠራ", title: "ዘካ እንዴት እንደሚሰበሰብ፣ እንደሚጣራ እና እንደሚከፈል" },
      stories: { label: "የለውጥ ታሪኮች", title: "ዘካ የደረሰላቸውን ሰዎችና ፕሮጀክቶች ታሪክ ያንብቡ" },
      reports: { label: "የውጤት ሪፖርቶች", title: "ኮሚሽኑ ይፋ ያደረጋቸውን ሪፖርቶች ያንብቡ" },
      about: { label: "ስለ ኮሚሽኑ", title: "እኛ ማን እንደሆንንና ኮሚሽኑ ምን እንደሚሠራ" },
      documents: { label: "የሕግ ሰነዶች", title: "የኮሚሽኑን የሕግ ሰነዶች ያንብቡ" },
      governance: { label: "አስተዳደር እና መጅሊስ", title: "ኮሚሽኑ እንዴት እንደሚተዳደር ያንብቡ" },
      shariahBoard: { label: "የሸሪዓ አማካሪ ቦርድ", title: "የሸሪዓ አማካሪ ቦርዱን ይወቁ" },
    },
    donate: { label: "አሁን ይለግሱ", title: "ክፍት ለሆነ የድጋፍ ዓላማ ይስጡ" },
    staffSignIn: { label: "የሠራተኞች መግቢያ", title: "ወደ ሠራተኞች ፖርታል ይግቡ (ለሠራተኞች ብቻ)" },
    openMenu: "ምናሌውን ይክፈቱ",
    closeMenu: "ምናሌውን ይዝጉ",
    menuTitle: "ምናሌ",
    menuDescription: "በEZAC ድረ ገጽ ላይ ያሉ ገጾች",
  },
  footer: {
    ariaLabel: "የገጹ ግርጌ",
    app: {
      eyebrow: "የሞባይል አገልግሎት",
      title: "የዜጎች መተግበሪያውን ያግኙ",
      body: "ለአንድሮይድ ስልኮች ብቻ። መተግበሪያው ከመተግበሪያ መደብር ሳይሆን በቀጥታ የሚወርድ (APK ፋይል) ነው።",
      download: "የአንድሮይድ መተግበሪያውን ያውርዱ",
      downloadNote: "(APK ፋይል፣ በአዲስ ትር ይከፈታል)",
      downloadTitle: "የEZAC የዜጎች መተግበሪያን ለአንድሮይድ ያውርዱ (APK ፋይል፣ በአዲስ ትር ይከፈታል)",
    },
    links: {
      privacy: { label: "የግላዊነት ፖሊሲ", title: "መረጃዎን እንዴት እንደምንሰበስብ፣ እንደምንጠቀምበት እና እንደምንጠብቀው" },
      faq: { label: "ተደጋግመው የሚነሱ ጥያቄዎች", title: "ስለ ዘካ እና ስለ EZAC ለሚነሱ የተለመዱ ጥያቄዎች መልሶች" },
      fatwas: { label: "ፈትዋዎች / በዘካ ላይ የተሰጡ ኢስላማዊ ብይኖች", title: "የዘካ ደንቦቹ የሚከተሏቸውን ብይኖች ያንብቡ" },
      contact: { label: "ድጋፍ ለማግኘት ያግኙን", title: "ከEZAC ቡድን እገዛ ያግኙ" },
    },
    copyright: "© {year} EZAC። መብቱ በሕግ የተጠበቀ ነው።",
    developedBy: "ያለማው እና ስፖንሰር ያደረገው DX Valley ነው።",
    developedByTitle: "ወደ DX Valley ድረ ገጽ ይሂዱ (በአዲስ ትር ይከፈታል)",
  },
  errors: {
    notFound: {
      metaTitle: "ገጹ አልተገኘም",
      eyebrow: "ገጹ አልተገኘም",
      title: "ያንን ገጽ",
      accent: "ማግኘት አልቻልንም",
      body: "የተከተሉት ሊንክ የተሳሳተ ሊሆን ይችላል፤ ወይም ገጹ ተዛውሮ ወይም ተወግዶ ሊሆን ይችላል።",
      goHome: { label: "ወደ ዋናው ገጽ ይሂዱ", title: "ወደ EZAC ዋና ገጽ ይሂዱ" },
      seeCauses: { label: "ክፍት የድጋፍ ዓላማዎችን ይመልከቱ", title: "አሁን ዘካ የሚቀበሉ የድጋፍ ዓላማዎችን ይመልከቱ" },
    },
    error: {
      metaTitle: "የሆነ ችግር ተፈጥሯል",
      eyebrow: "ስህተት",
      title: "የሆነ ችግር",
      accent: "ተፈጥሯል",
      body: "ችግሩ ከእኛ በኩል እንጂ ከእርስዎ አይደለም። ጥቂት ቆይተው እንደገና ይሞክሩ።",
      tryAgain: "እንደገና ይሞክሩ",
      goHome: { label: "ወደ ዋናው ገጽ ይሂዱ", title: "ወደ EZAC ዋና ገጽ ይሂዱ" },
      contact: {
        before: "ችግሩ ከቀጠለ",
        link: "ያግኙን",
        after: "እና ከታች ያለውን የማጣቀሻ ቁጥር ይጥቀሱ።",
        title: "የEZAC ቡድንን ያግኙ",
      },
      reference: "የማጣቀሻ ቁጥር፦",
    },
  },
};

export default common;
