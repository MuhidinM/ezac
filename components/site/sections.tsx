import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowRightIcon } from "lucide-react";

import { LocalizedLink } from "@/lib/i18n/client";

export function Section({
  children,
  className = "",
  muted = false,
  id,
}: {
  children: ReactNode;
  className?: string;
  muted?: boolean;
  /** Anchor for in-page links ("/about#documents"). */
  id?: string;
}) {
  return (
    <section id={id} className={`w-full ${muted ? "bg-surface-muted" : "bg-white"}`}>
      <div className={`mx-auto max-w-6xl px-6 py-16 sm:px-8 sm:py-20 ${className}`}>
        {children}
      </div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  intro,
  id,
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
  /** Lets the section point at its heading (aria-labelledby). */
  id?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      {eyebrow && <p className="text-xs uppercase tracking-[0.16em] text-brand">{eyebrow}</p>}
      <h2 id={id} className="font-serif-display mt-3 text-3xl tracking-[-1px] text-navy sm:text-4xl">
        {title}
      </h2>
      {intro && <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-ink">{intro}</p>}
    </div>
  );
}

export type FeatureItem = {
  icon?: LucideIcon;
  title: string;
  description: string;
};

export function FeatureGrid({
  items,
  columns = 3,
}: {
  items: readonly FeatureItem[];
  columns?: 2 | 3;
}) {
  const cols = columns === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3";
  return (
    <div className={`mt-12 grid grid-cols-1 gap-5 ${cols}`}>
      {items.map(({ icon: Icon, title, description }) => (
        <div key={title} className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
          {Icon && (
            <span className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand/10">
              <Icon aria-hidden="true" className="h-5 w-5 text-brand" />
            </span>
          )}
          <h3 className="font-serif-display text-xl tracking-[-0.3px] text-navy">{title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-ink">{description}</p>
        </div>
      ))}
    </div>
  );
}

export function StepList({ steps }: { steps: readonly { title: string; body: string }[] }) {
  return (
    <ol className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {steps.map((step, i) => (
        <li key={step.title} className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
          {/* The list already numbers the steps for screen readers. */}
          <span aria-hidden="true" className="font-serif-display text-3xl text-accent-ink">
            {String(i + 1).padStart(2, "0")}
          </span>
          <h3 className="mt-3 text-base font-medium text-navy">{step.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-ink">{step.body}</p>
        </li>
      ))}
    </ol>
  );
}

export function FaqAccordion({
  items,
}: {
  items: readonly { q: string; a: string }[];
}) {
  return (
    <div className="mx-auto mt-12 max-w-3xl space-y-3">
      {items.map(({ q, a }) => (
        <details
          key={q}
          className="group rounded-2xl border border-black/10 bg-white p-5 [&_summary::-webkit-details-marker]:hidden"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-sm text-sm font-medium text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-4">
            {q}
            <span aria-hidden="true" className="text-brand transition-transform duration-200 group-open:rotate-45">
              +
            </span>
          </summary>
          <p className="mt-3 text-sm leading-relaxed text-muted-ink">{a}</p>
        </details>
      ))}
    </div>
  );
}

export function LegalProse({
  sections,
}: {
  sections: readonly { heading: string; paragraphs: readonly string[] }[];
}) {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {sections.map(({ heading, paragraphs }) => (
        <div key={heading}>
          <h2 className="font-serif-display text-2xl tracking-[-0.5px] text-navy">{heading}</h2>
          {paragraphs.map((p, i) => (
            <p key={i} className="mt-3 text-sm leading-relaxed text-muted-ink">
              {p}
            </p>
          ))}
        </div>
      ))}
    </div>
  );
}

type CtaLink = {
  label: string;
  /** A public path ("/zakat/pay"); it is put in the visitor's language here. */
  href: string;
  /** Link tooltip: where the link goes or what it does. */
  title?: string;
};

export function CtaBand({
  title,
  body,
  primary,
  secondary,
}: {
  title: string;
  body?: string;
  primary: CtaLink;
  secondary?: CtaLink;
}) {
  return (
    <section className="relative w-full overflow-hidden bg-brand">
      {/* Decorative brand watermark: a CSS background, so it isn't an image without a description. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 -end-[20%] z-0 aspect-[1200/1038] h-[180%] -translate-y-1/2 bg-[url(/images/bg.webp)] bg-contain bg-no-repeat opacity-50 select-none"
      />
      <div className="relative z-10 mx-auto max-w-4xl px-6 py-16 text-center sm:px-8 sm:py-20">
        <h2 className="font-serif-display text-3xl tracking-[-0.8px] text-white sm:text-4xl">{title}</h2>
        {body && <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-white/80">{body}</p>}
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <LocalizedLink
            href={primary.href}
            title={primary.title}
            className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-medium text-brand transition-transform duration-300 hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand"
          >
            {primary.label}
            <ArrowRightIcon aria-hidden="true" className="h-4 w-4 rtl:-scale-x-100" />
          </LocalizedLink>
          {secondary && (
            <LocalizedLink
              href={secondary.href}
              title={secondary.title}
              className="inline-flex items-center gap-2 rounded-full border border-white/40 px-7 py-3.5 text-sm text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand"
            >
              {secondary.label}
            </LocalizedLink>
          )}
        </div>
      </div>
    </section>
  );
}
