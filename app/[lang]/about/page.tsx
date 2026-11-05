import type { Metadata } from "next";
import {
  BookOpenIcon,
  BuildingIcon,
  DownloadIcon,
  GlobeIcon,
  HandCoinsIcon,
  LandmarkIcon,
  LineChartIcon,
  ScaleIcon,
  ShieldCheckIcon,
  UsersIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { DocumentGallery, type LegalDocument } from "@/components/site/document-gallery";
import { CtaBand, Section, SectionHeading } from "@/components/site/sections";
import { SitePage } from "@/components/site/site-page";

export const metadata: Metadata = {
  title: "About the Commission — EZAC",
  description:
    "How the Ethiopian Zakat Commission was established: its legal basis under Proclamation 1207/2020, its founding regulation, mandate, governance, and the official certificates.",
};

const TIMELINE = [
  {
    date: "4 July 2020",
    title: "Proclamation No. 1207/2020",
    body: "The House of Peoples' Representatives grants legal personality to the Ethiopian Islamic Affairs Supreme Council, and to the religious institutions established under it, without further registration. The proclamation requires the Council to run a clear and transparent financial administration.",
  },
  {
    date: "2018 E.C. (2025)",
    title: "The Zakat Commission regulation",
    body: "Using its power under Article 6(2) of the proclamation, the Supreme Council issues the regulation establishing its Zakat Commission: a religious administration body with its own legal personality, accountable to the Council and independent in its professional and administrative work.",
  },
  {
    date: "18/10/2018 E.C. (2026)",
    title: "Certificate of Establishment",
    body: "The Supreme Council certifies the Ethiopian Zakat Commission as a legal person under Article 80(1) of the Mejlis regulation and Article 2(1) of Proclamation 1207/2020.",
  },
  {
    date: "24 Sene 2018 E.C. (1 July 2026)",
    title: "Registered with the Ministry of Revenues",
    body: "The Commission is registered as a taxpayer in Addis Ababa under medical and social welfare support services.",
  },
];

const MANDATE: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: HandCoinsIcon,
    title: "Collect Zakat",
    body: "Collect Zakat money and property from individuals and institutions obliged to pay it, in Ethiopia and abroad, according to the principles of Shari'ah and current fatwas.",
  },
  {
    icon: UsersIcon,
    title: "Distribute it to those entitled",
    body: "Distribute what is collected to the people, institutions and works entitled to Zakat, following the same principles.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Transparency and trust",
    body: "Build a system where collecting and distributing Zakat is transparent, accountable and trustworthy, run with modern, efficient administration.",
  },
  {
    icon: LineChartIcon,
    title: "Reduce poverty",
    body: "Set strategic plans so that Zakat contributes to sustainable poverty reduction, aligned with national poverty reduction programmes.",
  },
  {
    icon: LandmarkIcon,
    title: "Islamic finance",
    body: "Ensure that interest-free financial institutions pay Zakat on their wealth, working with the National Bank and other public and private institutions.",
  },
  {
    icon: BookOpenIcon,
    title: "Research and awareness",
    body: "Study Zakat, publish research, hold workshops and training, learn from other countries' experience, and advise on law and policy.",
  },
  {
    icon: BuildingIcon,
    title: "Development without touching Zakat",
    body: "Set up development and administrative institutions with other Shari'ah-permitted funds, never from the Zakat collected.",
  },
  {
    icon: GlobeIcon,
    title: "Work with others",
    body: "Cooperate with the Supreme Council, Shari'ah courts, the Waqf Commission, government, banks, NGOs, civil society, international bodies and embassies.",
  },
];

const STRUCTURE = [
  {
    title: "Board of Directors",
    body: "25 members. The first board was nominated by the President of the Supreme Council and approved by its General Assembly. Members serve five years and at most two consecutive terms. The board leads and supervises the Commission, appoints the Commissioner, issues directives and approves the annual plan and budget.",
  },
  {
    title: "Shari'ah Advisory Board",
    body: "Formed together with the Supreme Council's Ulama Assembly to check that the Commission's work follows Shari'ah and the applicable fatwas. Its first members are 9 scholars.",
  },
  {
    title: "Commissioner",
    body: "The chief executive, accountable to the board. Recommends deputy commissioners for collection and for distribution, manages staff, prepares the plan and budget, and represents the Commission.",
  },
  {
    title: "Control committee",
    body: "An oversight committee within the Commission's structure, alongside the other committees and administrative bodies the work requires.",
  },
];

const DOCUMENTS: LegalDocument[] = [
  {
    src: "/legal/certificate-of-establishment.jpg",
    title: "Certificate of Establishment",
    issuer: "Ethiopian Islamic Affairs Supreme Council",
    date: "18/10/2018 E.C.",
    summary: "Grants the Ethiopian Zakat Commission legal personality under Proclamation 1207/2020. Signed by the President of the Supreme Council and the Ulama Assembly.",
    landscape: true,
  },
  {
    src: "/legal/taxpayer-registration-certificate.jpg",
    title: "Taxpayer Registration Certificate",
    issuer: "Ministry of Revenues",
    date: "1 July 2026",
    summary: "Registration with the federal Ministry of Revenues, Addis Ababa, under medical and social welfare support services.",
    landscape: true,
  },
  {
    src: "/legal/proclamation-1207-2020.jpg",
    title: "Proclamation No. 1207/2020",
    issuer: "Federal Negarit Gazette",
    date: "4 July 2020",
    summary: "The federal law that gives the Supreme Council, and the institutions it establishes, legal personality.",
  },
  {
    src: "/legal/zakat-commission-regulation-cover.jpg",
    title: "Zakat Commission establishment regulation",
    issuer: "Ethiopian Islamic Affairs Supreme Council",
    date: "2018 E.C. / 1447 AH",
    summary: "The regulation that establishes the Commission and sets out its mandate, board, Shari'ah advisory board and Commissioner.",
  },
];

export default function AboutPage() {
  return (
    <SitePage
      eyebrow="About Us"
      title="A commission"
      accent="established in law"
      intro="The Ethiopian Zakat Commission was set up by the Ethiopian Islamic Affairs Supreme Council, under a federal proclamation, to collect and distribute Zakat with transparency, accountability and trust."
    >
      <Section>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-center">
          <div>
            <p className="text-[10px] tracking-[0.18em] uppercase" style={{ color: "#007050" }}>
              Why the Commission exists
            </p>
            <h2 className="font-serif-display mt-3 text-3xl sm:text-4xl" style={{ color: "#001539", letterSpacing: "-1px" }}>
              Zakat, organised the way it deserves
            </h2>
            <div className="mt-5 space-y-4 text-base leading-relaxed" style={{ color: "#4a4a4a" }}>
              <p>
                Zakat is one of the five pillars of Islam. The founding regulation sets out to give Ethiopia&apos;s Muslim community a
                system that lets them fulfil it properly, and to make sure Zakat reaches its purpose: helping the community, reducing
                poverty and contributing to the country&apos;s development.
              </p>
              <p>
                It calls for collection and distribution that are transparent, accountable and trustworthy, follow Shari&apos;ah and
                the country&apos;s laws, and use modern economic systems and technology, run by an institution with legal personality
                that Zakat payers and recipients can trust.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              ["1207/2020", "Federal proclamation it rests on"],
              ["25", "Members of the Board of Directors"],
              ["9", "Scholars on the first Shari'ah Advisory Board"],
              ["5 yrs", "Board term, at most two in a row"],
            ].map(([value, label]) => (
              <div key={label} className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
                <p className="font-serif-display text-3xl" style={{ color: "#007050", letterSpacing: "-1px" }}>
                  {value}
                </p>
                <p className="mt-2 text-xs leading-relaxed tracking-[0.08em] uppercase" style={{ color: "#6F6F6F" }}>
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section muted>
        <SectionHeading eyebrow="Legal foundation" title="How the Commission came to be" />
        <ol className="relative mx-auto mt-12 max-w-3xl space-y-6 border-l border-black/10 pl-8">
          {TIMELINE.map((item) => (
            <li key={item.title} className="relative">
              <span className="absolute -left-[2.45rem] top-6 h-4 w-4 rounded-full border-4 border-[#ececec]" style={{ backgroundColor: "#007050" }} />
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <p className="text-[10px] tracking-[0.16em] uppercase tabular-nums" style={{ color: "#007050" }}>
                  {item.date}
                </p>
                <h3 className="font-serif-display mt-1 text-xl sm:text-2xl" style={{ color: "#001539" }}>
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: "#4a4a4a" }}>
                  {item.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section>
        <SectionHeading
          eyebrow="Mandate"
          title="What the Commission is charged with"
          intro="From Article 4 of the establishment regulation."
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {MANDATE.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
              <Icon className="h-5 w-5" style={{ color: "#007050" }} />
              <p className="mt-3 font-medium" style={{ color: "#001539" }}>
                {title}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed" style={{ color: "#6F6F6F" }}>
                {body}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section muted>
        <SectionHeading
          eyebrow="Governance"
          title="Who runs the Commission"
          intro="The Commission is accountable to the Supreme Council and independent in its professional and administrative work."
        />
        <div className="mx-auto mt-12 grid max-w-5xl gap-5 md:grid-cols-2">
          {STRUCTURE.map((item) => (
            <div key={item.title} className="rounded-2xl bg-white p-6 shadow-sm">
              <p className="font-serif-display text-xl" style={{ color: "#001539" }}>
                {item.title}
              </p>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "#4a4a4a" }}>
                {item.body}
              </p>
            </div>
          ))}
        </div>
        <div className="mx-auto mt-8 flex max-w-5xl items-start gap-3 rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
          <ScaleIcon className="mt-0.5 h-5 w-5 shrink-0" style={{ color: "#007050" }} />
          <p className="text-sm leading-relaxed" style={{ color: "#4a4a4a" }}>
            <span className="font-medium" style={{ color: "#001539" }}>
              Where it applies.{" "}
            </span>
            The regulation binds the Supreme Council at every level, the regional Islamic affairs councils down to the woreda Mejlis,
            mosques and their institutions, and Ethiopian Muslims at home and in the diaspora. Existing Zakat committees are registered,
            recognised and trained by the Commission. The Commission has its head office and may open branch offices in the regions
            and abroad.
          </p>
        </div>
      </Section>

      <div id="documents" className="scroll-mt-24">
        <Section>
          <SectionHeading
            eyebrow="Transparency"
            title="Official documents"
            intro="The documents that establish and register the Commission, published in full."
          />
          <div className="mt-12">
            <DocumentGallery documents={DOCUMENTS} />
          </div>
          <div className="mt-10 text-center">
            <a
              href="/legal/ezac-legal-documents.pdf"
              className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm text-white transition-transform hover:scale-[1.02]"
              style={{ backgroundColor: "#001539" }}
            >
              <DownloadIcon className="h-4 w-4" />
              Download the complete legal documents (PDF, 12 pages)
            </a>
          </div>
        </Section>
      </div>

      <CtaBand
        title="See the mandate at work"
        body="Follow how Zakat is collected, decided on and paid out, step by step."
        primary={{ label: "How it works", href: "/how-it-works" }}
        secondary={{ label: "Live dashboard", href: "/transparency/dashboard" }}
      />
    </SitePage>
  );
}
