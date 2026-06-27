import type { Metadata } from "next";
import { FileTextIcon, DownloadIcon } from "lucide-react";
import { SitePage } from "@/components/site/site-page";
import { Section, SectionHeading, CtaBand } from "@/components/site/sections";

export const metadata: Metadata = {
  title: "Impact Reports — EZAC",
  description:
    "Audited quarterly and annual reports detailing how Zakat and Waqf funds were collected, invested, and disbursed.",
};

const REPORTS = [
  {
    title: "Ramadan 2026 Impact Report",
    period: "Q1 2026",
    note: "Collection, disbursement, and beneficiary outcomes for the Ramadan season.",
  },
  {
    title: "Annual Report 2025",
    period: "FY 2025",
    note: "Full-year audited accounts, Waqf portfolio performance, and regional reach.",
  },
  {
    title: "Waqf Portfolio Review",
    period: "H2 2025",
    note: "Endowment asset allocation, returns, and causes funded from investment income.",
  },
  {
    title: "Beneficiary Verification Audit",
    period: "Q4 2025",
    note: "Independent review of Fayda-based verification and disbursement controls.",
  },
];

export default function ImpactReportsPage() {
  return (
    <SitePage
      eyebrow="Transparency & Impact"
      title="Impact"
      accent="reports"
      intro="Audited, downloadable reports detailing exactly how funds were collected, invested, and distributed — published on a regular cycle."
    >
      <Section>
        <SectionHeading
          eyebrow="Library"
          title="Published reports"
          intro="Each report is independently reviewed before release."
        />
        <div className="mx-auto mt-12 max-w-3xl space-y-3">
          {REPORTS.map((r) => (
            <div
              key={r.title}
              className="flex items-center gap-4 rounded-2xl border border-black/10 bg-white p-5"
            >
              <span
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: "rgba(0,112,80,0.1)" }}
              >
                <FileTextIcon className="h-5 w-5" style={{ color: "#007050" }} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium" style={{ color: "#001539" }}>
                  {r.title}
                </p>
                <p className="mt-0.5 text-xs" style={{ color: "#6F6F6F" }}>
                  <span style={{ color: "#e18f35" }}>{r.period}</span> · {r.note}
                </p>
              </div>
              <span
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-black/10 px-3 py-1.5 text-xs"
                style={{ color: "#001539" }}
              >
                <DownloadIcon className="h-3.5 w-3.5" />
                PDF
              </span>
            </div>
          ))}
        </div>
      </Section>
      <CtaBand
        title="See the live picture"
        body="Reports are point-in-time. For continuous figures, follow the live dashboard."
        primary={{ label: "Open the live dashboard", href: "/transparency/dashboard" }}
      />
    </SitePage>
  );
}
