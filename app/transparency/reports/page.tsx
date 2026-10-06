import type { Metadata } from "next";
import { FileTextIcon, DownloadIcon } from "lucide-react";
import { SitePage } from "@/components/site/site-page";
import { Section, SectionHeading, CtaBand } from "@/components/site/sections";
import { getImpactReports } from "@/lib/zakat/impact";

export const metadata: Metadata = {
  title: "Impact Reports — EZAC",
  description:
    "Audited quarterly and annual reports detailing how Zakat and Waqf funds were collected, invested, and disbursed.",
};

// Published reports from zakat-engine, refreshed every 5 minutes.
export const revalidate = 300;

function fileSize(bytes: number | null) {
  if (!bytes) return null;
  return bytes > 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

export default async function ImpactReportsPage() {
  const reports = (await getImpactReports())?.items ?? [];

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
          intro="Each report is reviewed before release."
        />
        <div className="mx-auto mt-12 max-w-3xl space-y-3">
          {reports.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-black/15 p-10 text-center text-sm" style={{ color: "#6F6F6F" }}>
              No reports have been published yet.
            </p>
          ) : null}
          {reports.map((r) => (
            <a
              key={r.id}
              href={r.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 rounded-2xl border border-black/10 bg-white p-5 transition hover:border-black/20"
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
                  {r.period ? <span style={{ color: "#e18f35" }}>{r.period}</span> : null}
                  {r.period && (r.summary || r.publishedAt) ? " · " : null}
                  {r.summary ?? (r.publishedAt ? `Published ${new Date(r.publishedAt).toLocaleDateString("en", { dateStyle: "medium" })}` : null)}
                </p>
              </div>
              <span
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-black/10 px-3 py-1.5 text-xs"
                style={{ color: "#001539" }}
              >
                <DownloadIcon className="h-3.5 w-3.5" />
                PDF{fileSize(r.sizeBytes) ? ` · ${fileSize(r.sizeBytes)}` : ""}
              </span>
            </a>
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
