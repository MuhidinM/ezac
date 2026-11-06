"use client";

import { type KeyboardEvent as ReactKeyboardEvent, type MouseEvent as ReactMouseEvent, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { DownloadIcon, ExternalLinkIcon, XIcon, ZoomInIcon } from "lucide-react";

import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { format } from "@/lib/i18n/messages";

export type LegalDocument = {
  /** Anchor id of the card, so "Source:" links elsewhere on the page can jump to it. */
  id: string;
  src: string;
  /** Pixel size of the scan, for the width and height attributes. */
  width: number;
  height: number;
  title: string;
  issuer: string;
  date: string;
  summary: string;
  /** What the scan shows, for screen readers and search engines. */
  alt: string;
  /** Landscape scans are centred; portrait ones show their top. */
  landscape?: boolean;
};

type GalleryStrings = Dictionary["about"]["documents"]["gallery"];

/** Scanned legal documents as cards; a click opens the full-size scan. */
export function DocumentGallery({ documents, t }: { documents: LegalDocument[]; t: GalleryStrings }) {
  const [open, setOpen] = useState<LegalDocument | null>(null);
  // The "View" button that opened the viewer gets focus back when it closes.
  const trigger = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const opener = trigger.current;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(null);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      opener?.focus();
    };
  }, [open]);

  const show = (doc: LegalDocument, event: ReactMouseEvent<HTMLButtonElement>) => {
    trigger.current = event.currentTarget;
    setOpen(doc);
  };

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2">
        {documents.map((doc) => (
          <article
            key={doc.src}
            id={doc.id}
            className="flex flex-col overflow-hidden rounded-3xl border border-black/5 bg-white shadow-xl shadow-black/5"
          >
            <button
              type="button"
              onClick={(event) => show(doc, event)}
              className="group relative block overflow-hidden bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-inset"
              aria-label={format(t.viewLabel, { view: t.view, title: doc.title })}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- static scans served from /public */}
              <img
                src={doc.src}
                alt={doc.alt}
                width={doc.width}
                height={doc.height}
                loading="lazy"
                decoding="async"
                className={`mx-auto aspect-[4/3] h-auto w-full object-contain p-4 transition duration-500 group-hover:scale-[1.02] ${doc.landscape ? "" : "object-top"}`}
              />
              <span className="absolute end-4 bottom-4 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs text-navy shadow-sm">
                <ZoomInIcon className="h-3.5 w-3.5" aria-hidden="true" />
                {t.view}
              </span>
            </button>
            <div className="flex flex-1 flex-col gap-2 p-6">
              <p className="text-xs tracking-[0.16em] text-brand uppercase">
                {doc.issuer} · {doc.date}
              </p>
              <h3 className="font-serif-display text-xl leading-tight text-navy">{doc.title}</h3>
              <p className="text-sm leading-relaxed text-muted-ink">{doc.summary}</p>
            </div>
          </article>
        ))}
      </div>

      {open ? createPortal(<Viewer doc={open} t={t} onClose={() => setOpen(null)} />, document.body) : null}
    </>
  );
}

/** Full-size scan over the whole page; rendered in a portal so no section can clip or cover it. */
function Viewer({ doc, t, onClose }: { doc: LegalDocument; t: GalleryStrings; onClose: () => void }) {
  const dialog = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeButton.current?.focus();
  }, []);

  // Keep Tab inside the dialog while it is open.
  const trapFocus = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Tab" || !dialog.current) return;
    const focusable = dialog.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled])");
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const linkClass =
    "inline-flex items-center gap-1.5 rounded-full border border-white/30 px-3 py-1.5 text-xs hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white";

  return (
    <div
      ref={dialog}
      role="dialog"
      aria-modal="true"
      aria-label={doc.title}
      className="fixed inset-0 z-[100] flex flex-col bg-navy/90 backdrop-blur-sm"
      onClick={() => onClose()}
      onKeyDown={trapFocus}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3 text-white sm:px-6" onClick={(event) => event.stopPropagation()}>
        <p className="truncate text-sm">{doc.title}</p>
        <div className="flex items-center gap-2">
          <a
            href={doc.src}
            target="_blank"
            rel="noopener noreferrer"
            title={format(t.openTitle, { title: doc.title })}
            className={linkClass}
          >
            <ExternalLinkIcon className="h-3.5 w-3.5 rtl:-scale-x-100" aria-hidden="true" />
            {t.open}
          </a>
          <a href={doc.src} download title={format(t.downloadTitle, { title: doc.title })} className={linkClass}>
            <DownloadIcon className="h-3.5 w-3.5" aria-hidden="true" />
            {t.download}
          </a>
          <button
            ref={closeButton}
            type="button"
            onClick={() => onClose()}
            aria-label={t.close}
            title={t.close}
            className="rounded-full p-2 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <XIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center p-4 sm:p-8">
        {/* eslint-disable-next-line @next/next/no-img-element -- static scans served from /public */}
        <img
          src={doc.src}
          alt={doc.alt}
          width={doc.width}
          height={doc.height}
          className="max-h-full max-w-full rounded-lg bg-white object-contain shadow-2xl"
          onClick={(event) => event.stopPropagation()}
        />
      </div>
    </div>
  );
}
