import { localizedPath } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/server";
import { ORGANIZATION_NAME, SITE_NAME, absoluteUrl } from "@/lib/site";

/**
 * /llms.txt (https://llmstxt.org): a plain Markdown guide to the site for AI
 * assistants and answer engines. Every fact here is stated on the public
 * pages it links to; when a page's facts change, change them here too.
 *
 * Built once and refreshed daily, like a static file. Absolute URLs use
 * SITE_URL (lib/site.ts).
 */
export const dynamic = "force-static";
export const revalidate = 86400;

type PageLink = { title: string; path: string; note: string };

const MAIN_PAGES: PageLink[] = [
  {
    title: "Zakat calculator",
    path: "/zakat/calculator",
    note: "Calculate Zakat on cash, gold, business, agriculture, livestock and more, with a breakdown before you pay.",
  },
  {
    title: "Pay Zakat",
    path: "/zakat/pay",
    note: "Pay by QR code from any Ethiopian bank app, straight into the Commission's account, and get a certificate anyone can verify.",
  },
  {
    title: "Causes",
    path: "/causes",
    note: "Causes across Ethiopia that Zakat supports, with progress toward each goal.",
  },
  {
    title: "How it works",
    path: "/how-it-works",
    note: "How Zakat is calculated and paid, how households are registered, assessed and scored, how decisions are made, how support is paid out, the rules the calculator applies today, and the certificate check.",
  },
  {
    title: "Transparency dashboard",
    path: "/transparency/dashboard",
    note: "Published figures on Zakat collected, families supported and funds distributed across Ethiopia.",
  },
  {
    title: "Reports",
    path: "/transparency/reports",
    note: "Quarterly and annual reports on how Zakat and Waqf funds were collected, invested and disbursed.",
  },
  {
    title: "Impact stories",
    path: "/transparency/stories",
    note: "Stories from families and communities that Zakat has reached, published with their consent.",
  },
  {
    title: "Fatwas",
    path: "/fatwas",
    note: "Rulings from the Commission's Shari'ah Advisory Board on Zakat, Waqf and contemporary financial questions.",
  },
  {
    title: "FAQ",
    path: "/faq",
    note: "Answers on Zakat, Nisab, Waqf, payments and how recipients are chosen.",
  },
  {
    title: "About the Commission",
    path: "/about",
    note: "The legal basis under Proclamation No. 1207/2020, the founding regulation, the mandate, the governance structure and the official certificates.",
  },
  {
    title: "Governance",
    path: "/about/governance",
    note: "The Majlis, the oversight structure and how the Commission is held to account.",
  },
  {
    title: "Shari'ah Advisory Board",
    path: "/about/shariah-board",
    note: "The scholars who check that the Commission's work follows Shari'ah and the applicable fatwas.",
  },
  {
    title: "Contact",
    path: "/contact",
    note: "Reach the Commission's support team by email, phone or in person in Addis Ababa.",
  },
  {
    title: "Privacy policy",
    path: "/privacy",
    note: "How the Commission collects, uses and protects personal and financial information.",
  },
];

const OTHER_PAGES: PageLink[] = [
  { title: "Ways to give", path: "/donate", note: "Zakat, Sadaqah, Zakat al-Fitr and Waqf." },
  {
    title: "Corporate Zakat",
    path: "/zakat/corporate",
    note: "Zakat calculation and impact reporting for companies and institutions.",
  },
  {
    title: "Register a Waqf asset",
    path: "/waqf/register-asset",
    note: "Endow property, cash, shares or agricultural land as a perpetual Waqf.",
  },
  {
    title: "Waqf investments",
    path: "/waqf/investments",
    note: "How endowed Waqf capital is invested so the principal is preserved and only the returns are spent.",
  },
  {
    title: "Waqf crowdfunding",
    path: "/waqf/crowdfunding",
    note: "Many people funding one lasting Waqf project together. Projects are listed once the Commission publishes them.",
  },
  {
    title: "Legal documents (PDF)",
    path: "/legal/ezac-legal-documents.pdf",
    note: "The documents that establish and register the Commission, in full (12 pages).",
  },
];

const link = ({ title, path, note }: PageLink) => `- [${title}](${absoluteUrl(path)}): ${note}`;

export async function GET() {
  const { common } = await getDictionary("en");
  const lines = [
    `# ${ORGANIZATION_NAME} (${SITE_NAME})`,
    "",
    `> ${common.site.tagline}`,
    "",
    `${SITE_NAME} is the Zakat Commission of the Ethiopian Islamic Affairs Supreme Council, established under Proclamation No. 1207/2020. It collects Zakat from individuals and institutions obliged to pay it, in Ethiopia and abroad, and distributes it to the people, institutions and works entitled to it, according to Shari'ah and current fatwas. It is accountable to the Supreme Council and independent in its professional and administrative work.`,
    "",
    "Key facts from the site:",
    "",
    "- Zakat is paid by scanning a QR code with any Ethiopian bank app. The money goes straight into the Commission's account at Cooperative Bank of Oromia, and each payment is matched to the bank's own record.",
    "- Every confirmed payment issues a numbered Zakat certificate that anyone can verify on the site.",
    "- Nisab is the value of 85 g of gold or 595 g of silver. The Commission's published rules say which one applies, and the calculator converts it to birr with gold and silver prices updated every morning.",
    "- Households are supported through a published process: registration at a branch, a household assessment, a need score from the Commission's points table, a decision by the branch supervisor, the head office pool, and payment to a bank account checked with the bank.",
    "- Public figures are totals, never individuals. An impact story is published only after the family has agreed to it.",
    "",
    "## Check a Zakat certificate",
    "",
    `Open ${absoluteUrl("/how-it-works#check-certificate")} (the "Check a certificate" section). Enter the number printed on the certificate (for example ZC-2026-000451). The answer says whether the certificate is genuine and shows the amount, the type of Zakat and the payment date. It never shows the payer's name.`,
    "",
    "## Main pages",
    "",
    ...MAIN_PAGES.map(link),
    "",
    "## Languages",
    "",
    `English is the default: ${absoluteUrl("/")}. The site is also available in Amharic (${absoluteUrl(localizedPath("am", "/"))}), Afaan Oromoo (${absoluteUrl(localizedPath("om", "/"))}) and Arabic (${absoluteUrl(localizedPath("ar", "/"))}). Each page keeps the same path after the language prefix, for example ${absoluteUrl(localizedPath("am", "/zakat/calculator"))}.`,
    "",
    `Every public page in every language is listed in ${absoluteUrl("/sitemap.xml")}.`,
    "",
    "## Optional",
    "",
    ...OTHER_PAGES.map(link),
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
