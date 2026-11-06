/**
 * Arabic strings shared by every public page. Mirrors ../en/common.ts. Terms
 * follow ./about.ts: هيئة الزكاة والأوقاف الإثيوبية، الهيئة الشرعية الاستشارية،
 * المجلس، لوحة البيانات المباشرة، آلية العمل، تقارير الأثر. Shared terms (cause =
 * حملة، ETB after the number, UI verbs) are fixed in docs/translation-review/ar-glossary.md.
 */
import type { Messages } from "@/lib/i18n/messages";
import type en from "../en/common";

const common: Messages<typeof en> = {
  site: {
    name: "EZAC",
    organization: "هيئة الزكاة والأوقاف الإثيوبية",
    tagline: "المنصة الرقمية الموثوقة للزكاة والوقف في إثيوبيا. احسب زكاتك، وتبرّع، وأوقِف، بدقة وشفافية.",
    defaultTitle: "EZAC — هيئة الزكاة والأوقاف الإثيوبية",
    keywords:
      "الزكاة, الوقف, الأوقاف, إثيوبيا, الزكاة في إثيوبيا, حاسبة الزكاة, نصاب الزكاة, الصدقة, العمل الخيري الإسلامي, هيئة الزكاة والأوقاف الإثيوبية, EZAC",
    logoAlt: "شعار EZAC",
  },
  skipToContent: "تخطَّ إلى المحتوى",
  /** Added (visually hidden) after the text of links that open a new tab. */
  newTab: "(يُفتح في علامة تبويب جديدة)",
  language: {
    label: "اللغة",
    choose: "اختر اللغة",
    current: "اللغة الحالية",
    /** Tooltip on each language in the switcher. {language} is the language's own name (English, Afaan Oromoo, አማርኛ), so it is kept apart from the Arabic preposition. */
    switchTo: "اقرأ هذه الصفحة بهذه اللغة: {language}",
  },
  nav: {
    ariaLabel: "التنقل الرئيسي",
    mobileAriaLabel: "القائمة الرئيسية",
    home: {
      tagline: "هيئة الزكاة والأوقاف الإثيوبية",
      title: "انتقل إلى الصفحة الرئيسية لموقع EZAC",
    },
    groups: {
      zakat: "الزكاة",
      waqf: "الوقف",
      transparency: "الشفافية والأثر",
      about: "من نحن",
    },
    links: {
      calculator: { label: "حاسبة الزكاة", title: "افتح حاسبة الزكاة" },
      pay: { label: "ادفع الزكاة الآن", title: "تعرّف على طرق دفع زكاتك" },
      causes: { label: "الحملات", title: "اطّلع على الحملات التي تدعمها زكاتك" },
      corporate: { label: "زكاة الشركات", title: "الزكاة على الشركات والأعمال التجارية" },
      waqfCrowdfunding: { label: "التمويل الجماعي للوقف", title: "ساهم مع غيرك في تمويل مشاريع الوقف" },
      waqfInvestments: { label: "استثمارات الوقف", title: "اطّلع على كيفية استثمار أصول الوقف" },
      waqfRegister: { label: "تسجيل أصل وقفي", title: "سجّل أصلًا بصفته وقفًا لدى الهيئة" },
      dashboard: { label: "لوحة البيانات المباشرة", title: "اطّلع على أرقام الجمع والتوزيع أولًا بأول" },
      howItWorks: { label: "آلية العمل", title: "كيف تُجمع الزكاة وتُراجَع وتُصرف" },
      stories: { label: "قصص الأثر", title: "اقرأ قصص الأشخاص والحملات التي وصلتها الزكاة" },
      reports: { label: "تقارير الأثر", title: "اقرأ التقارير التي نشرتها الهيئة" },
      about: { label: "عن الهيئة", title: "من نحن وما الذي تقوم به الهيئة" },
      documents: { label: "الوثائق القانونية", title: "اقرأ الوثائق القانونية للهيئة" },
      governance: { label: "الحوكمة والمجلس", title: "كيف تُدار الهيئة" },
      shariahBoard: { label: "الهيئة الشرعية الاستشارية", title: "تعرّف على الهيئة الشرعية الاستشارية" },
    },
    donate: { label: "تبرّع الآن", title: "تبرّع لحملة مفتوحة" },
    staffSignIn: { label: "دخول الموظفين", title: "سجّل الدخول إلى بوابة الموظفين (للموظفين فقط)" },
    openMenu: "فتح القائمة",
    closeMenu: "إغلاق القائمة",
    menuTitle: "القائمة",
    menuDescription: "صفحات موقع EZAC",
  },
  footer: {
    ariaLabel: "تذييل الصفحة",
    app: {
      eyebrow: "الوصول عبر الهاتف المحمول",
      title: "احصل على تطبيق المواطن",
      body: "لهواتف أندرويد فقط. يُنزَّل التطبيق مباشرة (ملف APK)، لا من متجر التطبيقات.",
      download: "تنزيل تطبيق أندرويد",
      downloadNote: "(ملف APK، يُفتح في علامة تبويب جديدة)",
      downloadTitle: "تنزيل تطبيق المواطن من EZAC لهواتف أندرويد (ملف APK، يُفتح في علامة تبويب جديدة)",
    },
    links: {
      privacy: { label: "سياسة الخصوصية", title: "كيف نجمع بياناتك ونستخدمها ونحميها" },
      faq: { label: "الأسئلة الشائعة", title: "إجابات عن الأسئلة الشائعة حول الزكاة وعن EZAC" },
      fatwas: { label: "الفتاوى والأحكام الشرعية في الزكاة", title: "اقرأ الأحكام الشرعية التي تستند إليها قواعد الزكاة" },
      contact: { label: "التواصل مع الدعم", title: "احصل على المساعدة من فريق EZAC" },
    },
    copyright: "© {year} EZAC. جميع الحقوق محفوظة.",
    developedBy: "من تطوير DX Valley ورعايتها.",
    developedByTitle: "زُر موقع DX Valley (يُفتح في علامة تبويب جديدة)",
  },
  pagination: {
    label: "الصفحات",
    status: "الصفحة {page} من {pages}",
    previous: "السابق",
    next: "التالي",
    goTo: "الانتقال إلى الصفحة {page}",
    pageTitle: "{title} (الصفحة {page})",
  },
  errors: {
    notFound: {
      metaTitle: "الصفحة غير موجودة",
      eyebrow: "الصفحة غير موجودة",
      title: "لم نعثر على",
      accent: "هذه الصفحة",
      body: "ربما يكون الرابط غير صحيح، أو نُقلت الصفحة أو حُذفت.",
      goHome: { label: "العودة إلى الصفحة الرئيسية", title: "انتقل إلى الصفحة الرئيسية لموقع EZAC" },
      seeCauses: { label: "اطّلع على الحملات المفتوحة", title: "اطّلع على الحملات المفتوحة لتلقّي الزكاة الآن" },
    },
    error: {
      metaTitle: "حدث خطأ ما",
      eyebrow: "خطأ",
      title: "حدث",
      accent: "خطأ ما",
      body: "المشكلة من جهتنا لا من جهتك. حاول مرة أخرى بعد لحظات.",
      tryAgain: "حاول مرة أخرى",
      goHome: { label: "العودة إلى الصفحة الرئيسية", title: "انتقل إلى الصفحة الرئيسية لموقع EZAC" },
      contact: {
        before: "إذا تكررت المشكلة،",
        link: "تواصل معنا",
        after: "واذكر الرقم المرجعي الظاهر أدناه.",
        title: "تواصل مع فريق EZAC",
      },
      reference: "الرقم المرجعي:",
    },
  },
};

export default common;
