import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowRightIcon } from "lucide-react";

export function Section({
  children,
  className = "",
  muted = false,
}: {
  children: ReactNode;
  className?: string;
  muted?: boolean;
}) {
  return (
    <section
      className={`w-full ${muted ? "bg-[#ececec]" : "bg-white"}`}
    >
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
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      {eyebrow && (
        <p
          className="text-[10px] uppercase tracking-[0.18em]"
          style={{ color: "#007050" }}
        >
          {eyebrow}
        </p>
      )}
      <h2
        className="font-serif-display mt-3 text-3xl sm:text-4xl"
        style={{ color: "#001539", letterSpacing: "-1px" }}
      >
        {title}
      </h2>
      {intro && (
        <p
          className="mx-auto mt-4 max-w-xl text-base leading-relaxed"
          style={{ color: "#6F6F6F" }}
        >
          {intro}
        </p>
      )}
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
  items: FeatureItem[];
  columns?: 2 | 3;
}) {
  const cols = columns === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3";
  return (
    <div className={`mt-12 grid grid-cols-1 gap-5 ${cols}`}>
      {items.map(({ icon: Icon, title, description }) => (
        <div
          key={title}
          className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm"
        >
          {Icon && (
            <span
              className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full"
              style={{ backgroundColor: "rgba(0,112,80,0.1)" }}
            >
              <Icon className="h-5 w-5" style={{ color: "#007050" }} />
            </span>
          )}
          <h3
            className="font-serif-display text-xl"
            style={{ color: "#001539", letterSpacing: "-0.3px" }}
          >
            {title}
          </h3>
          <p
            className="mt-2 text-sm leading-relaxed"
            style={{ color: "#6F6F6F" }}
          >
            {description}
          </p>
        </div>
      ))}
    </div>
  );
}

export function StepList({ steps }: { steps: { title: string; body: string }[] }) {
  return (
    <ol className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {steps.map((step, i) => (
        <li
          key={step.title}
          className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm"
        >
          <span
            className="font-serif-display text-3xl"
            style={{ color: "#e18f35" }}
          >
            {String(i + 1).padStart(2, "0")}
          </span>
          <h3
            className="mt-3 text-base font-medium"
            style={{ color: "#001539" }}
          >
            {step.title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: "#6F6F6F" }}>
            {step.body}
          </p>
        </li>
      ))}
    </ol>
  );
}

export function FaqAccordion({
  items,
}: {
  items: { q: string; a: string }[];
}) {
  return (
    <div className="mx-auto mt-12 max-w-3xl space-y-3">
      {items.map(({ q, a }) => (
        <details
          key={q}
          className="group rounded-2xl border border-black/10 bg-white p-5 [&_summary::-webkit-details-marker]:hidden"
        >
          <summary
            className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium"
            style={{ color: "#001539" }}
          >
            {q}
            <span
              className="transition-transform duration-200 group-open:rotate-45"
              style={{ color: "#007050" }}
            >
              +
            </span>
          </summary>
          <p className="mt-3 text-sm leading-relaxed" style={{ color: "#6F6F6F" }}>
            {a}
          </p>
        </details>
      ))}
    </div>
  );
}

export function LegalProse({
  sections,
}: {
  sections: { heading: string; paragraphs: string[] }[];
}) {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {sections.map(({ heading, paragraphs }) => (
        <div key={heading}>
          <h2
            className="font-serif-display text-2xl"
            style={{ color: "#001539", letterSpacing: "-0.5px" }}
          >
            {heading}
          </h2>
          {paragraphs.map((p, i) => (
            <p
              key={i}
              className="mt-3 text-sm leading-relaxed"
              style={{ color: "#6F6F6F" }}
            >
              {p}
            </p>
          ))}
        </div>
      ))}
    </div>
  );
}

export function CtaBand({
  title,
  body,
  primary,
  secondary,
}: {
  title: string;
  body?: string;
  primary: { label: string; href: string };
  secondary?: { label: string; href: string };
}) {
  return (
    <section className="relative w-full overflow-hidden bg-[#007050]">
      {/* eslint-disable-next-line @next/next/no-img-element -- decorative brand watermark served as a static asset */}
      <img
        src="/bg.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-[-20%] z-0 h-[180%] w-auto max-w-none -translate-y-1/2 select-none opacity-50"
      />
      <div className="relative z-10 mx-auto max-w-4xl px-6 py-16 text-center sm:px-8 sm:py-20">
        <h2
          className="font-serif-display text-3xl sm:text-4xl"
          style={{ color: "#FFFFFF", letterSpacing: "-0.8px" }}
        >
          {title}
        </h2>
        {body && (
          <p
            className="mx-auto mt-4 max-w-xl text-base leading-relaxed"
            style={{ color: "rgba(255,255,255,0.82)" }}
          >
            {body}
          </p>
        )}
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href={primary.href}
            className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-medium transition-transform duration-300 hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#007050]"
            style={{ color: "#007050" }}
          >
            {primary.label}
            <ArrowRightIcon className="h-4 w-4" />
          </a>
          {secondary && (
            <a
              href={secondary.href}
              className="inline-flex items-center gap-2 rounded-full border border-white/40 px-7 py-3.5 text-sm transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#007050]"
              style={{ color: "#FFFFFF" }}
            >
              {secondary.label}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
