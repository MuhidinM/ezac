/**
 * Arabic strings for the landing page. Mirrors ../en/home.ts. Terms follow
 * ar/about.ts (هيئة الزكاة والأوقاف الإثيوبية، المجلس الأعلى، الهيئة الشرعية،
 * لوحة الشفافية المباشرة، آلية العمل). A "cause" is حملة / حملات (as in
 * ./common.ts and ./giving.ts); مشروع is kept for "project". Amounts put ETB after
 * the number, like the Intl-formatted figures on the dashboard.
 * Count templates use "label: value" so Arabic number agreement never breaks.
 */
import type { Messages } from "@/lib/i18n/messages";
import type en from "../en/home";

const home: Messages<typeof en> = {
  meta: {
    title: "EZAC — هيئة الزكاة والأوقاف الإثيوبية",
    description:
      "المنصة الرقمية الموثوقة للزكاة والوقف في إثيوبيا. احسب زكاتك بأسعار النصاب المحدّثة، وادفعها عبر رمز QR من أي تطبيق مصرفي إثيوبي، وتتبّع مسار كل بر.",
    keywords:
      "حاسبة الزكاة إثيوبيا, حساب الزكاة, دفع الزكاة, نصاب الزكاة اليوم, سعر الذهب في إثيوبيا, الوقف في إثيوبيا, حملات الزكاة, هيئة الزكاة والأوقاف الإثيوبية, هيئة الزكاة الإثيوبية, EZAC",
  },
  hero: {
    title: {
      accent1: "زكاة",
      text1: "موثوقة.",
      accent2: "وقف",
      text2: "دائم.",
    },
    body: "المنصة الرقمية الموثوقة للزكاة والوقف في إثيوبيا. احسب زكاتك، وتبرّع، وأوقِف، بدقة حسابية وشفافية تامة؛ فكل بر يُتتبَّع من يدك حتى يصل إلى الأسر التي يعينها والمستقبل الذي يبنيه.",
    calculate: { label: "احسب زكاتك", title: "افتح حاسبة الزكاة" },
    receive: {
      label: "كيفية تلقّي الزكاة",
      title: "كيف تُسجَّل الأسر لتلقّي الزكاة",
    },
    partnersLabel: "بالتعاون مع",
    partners: {
      coopbank: { alt: "Coopbank Alhuda", title: "زُر موقع Coopbank Alhuda (يُفتح في علامة تبويب جديدة)" },
      dxvalley: { alt: "DX Valley", title: "زُر موقع DX Valley (يُفتح في علامة تبويب جديدة)" },
    },
  },
  trustStrip: {
    eyebrow: "قائمة على بنية تحتية موثوقة",
    title: "دقة وشفافية وسهولة في الوصول.",
    link: { label: "تعرّف على آلية العمل", title: "كيف تُجمع الزكاة وتُراجَع وتُصرف" },
    items: {
      nisab: { label: "أسعار النصاب المباشرة", sub: "تُحدَّث أسعار الذهب والفضة يوميًا" },
      households: { label: "أسر مقيَّمة", sub: "زيارة وتقييم بالنقاط واعتماد في الفرع" },
      qr: { label: "الدفع عبر رمز QR", sub: "من أي تطبيق مصرفي إثيوبي" },
      languages: { label: "أربع لغات", sub: "الإنجليزية والأمهرية والأورومية والعربية" },
      dashboard: { label: "لوحة بيانات مباشرة", sub: "علنية ومدقَّقة وقابلة للتتبّع" },
    },
  },
  ticker: {
    ariaLabel: "شريط الأثر المباشر",
    live: "الأثر المباشر",
    groupLabel: "أرقام الأثر المباشرة. مرّر المؤشر فوقها أو انتقل إليها لإيقافها مؤقتًا.",
    /** An amount in birr. */
    etb: "{amount} ETB",
    /** A price in birr per gram. */
    etbPerGram: "{amount} ETB للغرام",
    nisabGold: "نصاب اليوم (الذهب)",
    nisabSilver: "نصاب اليوم (الفضة)",
    gold24k: "ذهب عيار 24",
    collected: "الزكاة المجموعة",
    thisMonth: "هذا الشهر",
    families: "الأسر المدعومة",
    distributed: "الأموال الموزَّعة",
    lives: "الأفراد المستفيدون",
    projects: "المشاريع النشطة",
  },
  causes: {
    eyebrowUrgent: "احتياجات عاجلة",
    eyebrowOpen: "حملات مفتوحة",
    eyebrowEmpty: "الحملات",
    title: { before: "", accent: "زكاتك", after: "تصل إلى هذه الحملات." },
    intro: "حملات موثَّقة في أنحاء إثيوبيا، مع عرض شفاف لتقدّم كل منها نحو هدفها.",
    introEmpty: "لا توجد حملات مفتوحة حاليًا. ستظهر الحملات الجديدة هنا فور أن تنشرها الهيئة.",
    seeAll: { label: "اطّلع على جميع الحملات", title: "تصفّح جميع الحملات المفتوحة" },
    howReaches: { label: "كيف تصل الزكاة إلى الأسر", title: "كيف تُقيَّم الأسر وتُصرف لها الزكاة" },
  },
  howItWorks: {
    eyebrow: "الشفافية والتحقق والأمان",
    title: "كيف تُصان زكاتك؟",
    intro:
      "تخضع كل حملة للفحص وفق المعايير الشرعية، وتُقيَّم كل أسرة قبل الصرف لها، وتُطابَق كل دفعة مع سجل مصرفي.",
    step: "الخطوة {n}",
    steps: [
      {
        title: "توافق شرعي بنسبة 100%",
        description: "تخضع كل حملة وكل حركة للأموال للفحص وفق معايير الحوكمة الشرعية المعتمدة.",
      },
      {
        title: "أسر مقيَّمة بالنقاط",
        description:
          "تُزار كل أسرة، وتُمنح درجة وفق جدول نقاط منشور، وتُعتمد في فرعها، قبل أن يصرف لها المقر الرئيسي المبلغ بتحويل مصرفي.",
      },
      {
        title: "تحقق مصرفي وتدقيق",
        description:
          "تُطابَق المدفوعات الواردة مع المعاملات المصرفية، ولا تُصرف الأموال إلا إلى حسابات جرى التحقق منها لدى البنك، ويُسجَّل كل تغيير.",
      },
    ],
    cta: { label: "اطّلع على العملية كاملة", title: "اقرأ خطوة بخطوة كيف تُجمع الزكاة وتُراجَع وتُصرف" },
  },
  impactMap: {
    eyebrow: "رؤية على مستوى البلاد",
    title: { before: "إلى أين يصل", accent: "الدعم", after: "؟" },
    mapLabel: "خريطة الأقاليم التي وصلها الدعم",
    beneficiaries: "المستفيدون: {count}",
    distributed: "الموزَّع: {amount} ETB",
    projects: "المشاريع النشطة: {count}",
    noFigures: "لم تُنشر أي أرقام بعد",
    dashboardLink: {
      label: "اطّلع على لوحة الشفافية كاملة",
      title: "افتح لوحة الشفافية المباشرة",
    },
  },
  partners: {
    eyebrow: "دعم مؤسسي",
    title: { before: "الشركاء", accent: "والرعاة", after: "." },
    names: {
      majlis: "المجلس الأعلى للشؤون الإسلامية («المجلس»)",
      coopbank: "Coopbank Alhuda",
      dxvalley: "DX Valley",
      fayda: "Fayda",
      ethswitch: "EthSwitch",
    },
    /** Tooltip on a partner's logo link. */
    visit: "زُر موقع {name} (يُفتح في علامة تبويب جديدة)",
  },
};

export default home;
