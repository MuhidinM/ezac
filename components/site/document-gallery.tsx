"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { DownloadIcon, ExternalLinkIcon, XIcon, ZoomInIcon } from "lucide-react";

export type LegalDocument = {
  src: string;
  title: string;
  issuer: string;
  date: string;
  summary: string;
  /** Landscape scans get a wider card. */
  landscape?: boolean;
};

/** Scanned legal documents as cards; a click opens the full-size scan. */
export function DocumentGallery({ documents }: { documents: LegalDocument[] }) {
  const [open, setOpen] = useState<LegalDocument | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(null);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2">
        {documents.map((doc) => (
          <article key={doc.src} className="flex flex-col overflow-hidden rounded-3xl border border-black/5 bg-white shadow-xl shadow-black/5">
            <button
              type="button"
              onClick={() => setOpen(doc)}
              className="group relative block overflow-hidden bg-[#f4f4f2]"
              aria-label={`View ${doc.title} full size`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- static scans served from /public */}
              <img
                src={doc.src}
                alt={doc.title}
                loading="lazy"
                className={`mx-auto w-full object-contain p-4 transition duration-500 group-hover:scale-[1.02] ${doc.landscape ? "aspect-[4/3]" : "aspect-[4/3] object-top"}`}
              />
              <span className="absolute right-4 bottom-4 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs shadow-sm" style={{ color: "#001539" }}>
                <ZoomInIcon className="h-3.5 w-3.5" />
                View
              </span>
            </button>
            <div className="flex flex-1 flex-col gap-2 p-6">
              <p className="text-[10px] tracking-[0.16em] uppercase" style={{ color: "#007050" }}>
                {doc.issuer} · {doc.date}
              </p>
              <h3 className="font-serif-display text-xl leading-tight" style={{ color: "#001539" }}>
                {doc.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "#6F6F6F" }}>
                {doc.summary}
              </p>
            </div>
          </article>
        ))}
      </div>

      {open ? createPortal(<Viewer doc={open} onClose={() => setOpen(null)} />, document.body) : null}
    </>
  );
}

/** Full-size scan over the whole page; rendered in a portal so no section can clip or cover it. */
function Viewer({ doc, onClose }: { doc: LegalDocument; onClose: () => void }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={doc.title}
      className="fixed inset-0 z-[100] flex flex-col bg-[#001539]/90 backdrop-blur-sm"
      onClick={() => onClose()}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3 text-white sm:px-6" onClick={(event) => event.stopPropagation()}>
        <p className="truncate text-sm">{doc.title}</p>
        <div className="flex items-center gap-2">
          <a
            href={doc.src}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/30 px-3 py-1.5 text-xs hover:bg-white/10"
          >
            <ExternalLinkIcon className="h-3.5 w-3.5" />
            Open
          </a>
          <a
            href={doc.src}
            download
            className="inline-flex items-center gap-1.5 rounded-full border border-white/30 px-3 py-1.5 text-xs hover:bg-white/10"
          >
            <DownloadIcon className="h-3.5 w-3.5" />
            Download
          </a>
          <button
            type="button"
            onClick={() => onClose()}
            aria-label="Close"
            className="rounded-full p-2 hover:bg-white/10"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center p-4 sm:p-8">
        {/* eslint-disable-next-line @next/next/no-img-element -- static scans served from /public */}
        <img
          src={doc.src}
          alt={doc.title}
          className="max-h-full max-w-full rounded-lg bg-white object-contain shadow-2xl"
          onClick={(event) => event.stopPropagation()}
        />
      </div>
    </div>
  );
}
