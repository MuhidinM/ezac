import type { Metadata } from "next";
import {
  ArrowRightLeftIcon,
  BadgeCheckIcon,
  BanknoteIcon,
  BuildingIcon,
  CalculatorIcon,
  ClipboardListIcon,
  FileSearchIcon,
  GaugeIcon,
  HandCoinsIcon,
  InboxIcon,
  QrCodeIcon,
  ScaleIcon,
  ShieldCheckIcon,
  UserCheckIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { CertificateVerify } from "@/components/site/certificate-verify";
import { CtaBand, Section, SectionHeading } from "@/components/site/sections";
import { SitePage } from "@/components/site/site-page";
import { ASNAF } from "@/lib/backoffice/options";
import type { CalculatorConfig, LivestockRow } from "@/lib/zakat/calculator-config";
import { formatCount, formatEtbCompact, getCalculatorConfig, getHomeSummary, getImpactSummary } from "@/lib/zakat/impact";

export const metadata: Metadata = {
  title: "How It Works — EZAC",
  description:
    "The full process behind EZAC: how Zakat is calculated and paid, how households are registered, assessed and scored, how decisions are made, and how support is paid out.",
};

// Live rules and figures from zakat-engine, refreshed every 5 minutes.
export const revalidate = 300;

const etb = new Intl.NumberFormat("en-ET", { maximumFractionDigits: 0 });
const pct = (rate: number) => `${+(rate * 100).toFixed(2)}%`;

type Step = { icon: LucideIcon; title: string; body: string; detail?: string[] };

const GIVING: Step[] = [
  {
    icon: CalculatorIcon,
    title: "Calculate what is due",
    body: "The calculator applies the published Zakat rules to your cash, gold, silver, business stock, crops and livestock.",
    detail: [
      "Gold and silver prices are fetched every morning at 06:00 (Addis Ababa) from the international market and converted to birr.",
      "If the price feed is down, an administrator enters the day's prices by hand until the next automatic fetch.",
      "The rules (nisab, rates, livestock tables) are versioned: a change creates a new version and the calculator always uses the active one.",
    ],
  },
  {
    icon: QrCodeIcon,
    title: "Pay by QR from any bank app",
    body: "The EZAC app shows a QR code for the amount. Scan it with any Ethiopian bank app; the money goes straight into the Commission's account at Cooperative Bank of Oromia.",
    detail: [
      "The QR is valid for 30 minutes.",
      "You can pay the general Zakat fund or a specific cause that accepts Zakat.",
    ],
  },
  {
    icon: BadgeCheckIcon,
    title: "Confirmed automatically",
    body: "The payment is matched to the bank's own transaction record, then marked paid.",
    detail: [
      "The system keeps checking pending payments with the QR network for up to a day after the QR expires.",
      "One bank transaction can confirm only one payment, so nothing is counted twice.",
      "Anything unclear goes to a person at head office, who checks it with the bank before settling it.",
    ],
  },
  {
    icon: FileSearchIcon,
    title: "Receive a certificate",
    body: "Every confirmed payment issues a numbered Zakat certificate that anyone can verify below.",
  },
];

const RECEIVING: Step[] = [
  {
    icon: BuildingIcon,
    title: "Registration at a branch",
    body: "Households are registered at their nearest branch, or by a field officer working for that branch.",
    detail: [
      "Each field officer works in exactly one branch and only sees households registered there.",
      "Every new household is checked against existing records for possible duplicates before going further.",
      "A bank account in the household's name is recorded, because support is paid by bank transfer only.",
    ],
  },
  {
    icon: ClipboardListIcon,
    title: "Household assessment",
    body: "A field officer visits and records the household's situation: members and dependants, income, assets, housing, health and vulnerability, plus which of the eight eligible categories (asnaf) apply.",
  },
  {
    icon: GaugeIcon,
    title: "A need score",
    body: "The answers are turned into one poverty score using a published points table. More points means greater need.",
    detail: [
      "The points table is versioned. Each score records the version it was calculated with, and a later change never rewrites past scores.",
      "Before a new version goes live, its effect is tested on recent assessments.",
    ],
  },
  {
    icon: UserCheckIcon,
    title: "Branch decision",
    body: "The branch supervisor reviews the assessment with the score and the system's recommendation, then approves, returns it for correction, rejects or defers it, always with a written comment.",
  },
  {
    icon: InboxIcon,
    title: "Head office pool",
    body: "Approved households join head office's queue. Head office adds them to the disbursement pool, or declines with a reason. Emergencies can be fast-tracked (see below).",
  },
  {
    icon: BanknoteIcon,
    title: "Payout to the household's bank account",
    body: "Head office pays one pooled household at a time from the Commission's account.",
    detail: [
      "Cooperative Bank of Oromia accounts are paid by internal transfer; other banks through the national instant payment system (IPS).",
      "Before paying, the account is looked up with the bank and the bank's account-holder name is compared with the name on file. A mismatch must be checked and acknowledged by a person.",
      "A prepared payout must be confirmed within 15 minutes or it expires.",
      "Once paid, the household leaves the pool. To be supported again it is assessed again.",
    ],
  },
];

const SAFEGUARDS: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: ShieldCheckIcon, title: "Separation of duties", body: "Field officers assess, branch supervisors decide, head office pools and pays. Fast-track and priority marks need evidence and a head-office decision." },
  { icon: ScaleIcon, title: "Rules before people", body: "Scores come from a published, versioned points table, not from individual judgement, and every decision carries a written reason." },
  { icon: ArrowRightLeftIcon, title: "Bank-verified payments", body: "Incoming money is matched to bank transactions; outgoing money goes only to an account checked with the bank." },
  { icon: FileSearchIcon, title: "Full audit trail", body: "Every change to prices, rules, scoring, decisions and payments is recorded with who made it and when." },
  { icon: UserCheckIcon, title: "Privacy by design", body: "Household details, scores and decisions are visible only to the staff who need them. Public figures are totals, never individuals." },
  { icon: HandCoinsIcon, title: "Consent for stories", body: "An impact story is published only after the family has agreed to it, and never names them without that consent." },
];

function livestockRows(rows: LivestockRow[]) {
  return rows.map((row) => ({
    range: row.max != null ? `${row.min}–${row.max}` : `${row.min} and above`,
    due: row.due,
  }));
}

function RulesTable({ config }: { config: CalculatorConfig }) {
  const prices = config.livestockAverageUnitPriceEtb ?? {};
  return (
    <div className="mt-12 grid gap-5 lg:grid-cols-2">
      <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
        <h3 className="font-serif-display text-xl" style={{ color: "#001539" }}>
          Nisab and rates
        </h3>
        <dl className="mt-4 divide-y divide-black/5 text-sm">
          {[
            ["Nisab basis", `${config.nisab.basis === "gold" ? "Gold" : "Silver"} (${config.nisab.basis === "gold" ? config.nisab.goldGrams : config.nisab.silverGrams} g)`],
            ["Nisab today", `ETB ${etb.format(Math.round(config.nisab.valueEtb))}`],
            [`Gold nisab (${config.nisab.goldGrams} g)`, `ETB ${etb.format(Math.round(config.nisab.goldValueEtb))}`],
            [`Silver nisab (${config.nisab.silverGrams} g)`, `ETB ${etb.format(Math.round(config.nisab.silverValueEtb))}`],
            ["Wealth, cash and trade goods", `${pct(config.wealth.rate)} after ${config.wealth.hawlLunarDays} lunar days`],
            ["Crops: nisab", `${etb.format(config.crops.nisabKg)} kg`],
            ["Crops: rain-fed / irrigated", `${pct(config.crops.rainFedRate)} / ${pct(config.crops.irrigatedRate)}`],
            ["Prices as of", new Date(config.pricesAsOf).toLocaleString("en", { dateStyle: "medium", timeStyle: "short" })],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4 py-2.5">
              <dt style={{ color: "#6F6F6F" }}>{label}</dt>
              <dd className="text-right tabular-nums" style={{ color: "#001539" }}>
                {value}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-xs" style={{ color: "#6F6F6F" }}>
          Rules version {config.configVersion}
          {config.priceSource ? ` · prices from ${config.priceSource}` : ""}
        </p>
      </div>

      <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
        <h3 className="font-serif-display text-xl" style={{ color: "#001539" }}>
          Livestock
        </h3>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          {[
            { title: "Sheep and goats", rows: livestockRows(config.livestock.sheepGoats) },
            { title: "Camels", rows: livestockRows(config.livestock.camels) },
          ].map((table) => (
            <div key={table.title}>
              <p className="text-xs tracking-[0.12em] uppercase" style={{ color: "#007050" }}>
                {table.title}
              </p>
              <table className="mt-2 w-full text-xs">
                <tbody>
                  {table.rows.map((row) => (
                    <tr key={row.range} className="border-b border-black/5 last:border-0">
                      <td className="py-1.5 pr-2 tabular-nums" style={{ color: "#6F6F6F" }}>
                        {row.range}
                      </td>
                      <td className="py-1.5" style={{ color: "#001539" }}>
                        {row.due}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm" style={{ color: "#6F6F6F" }}>
          Cattle: from {config.livestock.cattle.minimum} head, one one-year calf per {config.livestock.cattle.tabiPer} and one two-year cow per{" "}
          {config.livestock.cattle.musinnahPer}.
        </p>
        {Object.keys(prices).length > 0 ? (
          <p className="mt-3 text-sm" style={{ color: "#6F6F6F" }}>
            Average prices used to value animals:{" "}
            {Object.entries(prices)
              .map(([animal, price]) => `${animal} ETB ${etb.format(price)}`)
              .join(" · ")}
            .
          </p>
        ) : null}
      </div>
    </div>
  );
}

function Timeline({ steps, accent }: { steps: Step[]; accent: string }) {
  return (
    <ol className="relative mx-auto mt-12 max-w-3xl space-y-6 border-l border-black/10 pl-8">
      {steps.map(({ icon: Icon, title, body, detail }, index) => (
        <li key={title} className="relative">
          <span
            className="absolute -left-[3.05rem] flex h-9 w-9 items-center justify-center rounded-full text-white shadow-sm"
            style={{ backgroundColor: accent }}
          >
            <Icon className="h-4 w-4" />
          </span>
          <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
            <p className="text-[10px] tracking-[0.16em] uppercase" style={{ color: accent }}>
              Step {index + 1}
            </p>
            <h3 className="font-serif-display mt-1 text-xl sm:text-2xl" style={{ color: "#001539", letterSpacing: "-0.4px" }}>
              {title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: "#4a4a4a" }}>
              {body}
            </p>
            {detail ? (
              <ul className="mt-3 space-y-1.5 text-sm leading-relaxed" style={{ color: "#6F6F6F" }}>
                {detail.map((line) => (
                  <li key={line} className="flex gap-2">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full" style={{ backgroundColor: accent }} />
                    {line}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

export default async function HowItWorksPage() {
  const [config, home, impact] = await Promise.all([getCalculatorConfig(), getHomeSummary(), getImpactSummary()]);
  const live = [
    { value: formatEtbCompact(home?.totalCollectedEtb), label: "Collected" },
    { value: formatCount(home?.totalBeneficiariesSupported), label: "Families supported" },
    { value: formatEtbCompact(impact?.distributedFundsEtb), label: "Distributed" },
    { value: formatCount(impact?.activeProjects), label: "Active causes" },
  ].filter((item) => item.value);

  return (
    <SitePage
      eyebrow="Transparency"
      title="How EZAC"
      accent="works"
      intro="From the moment you calculate your Zakat to the day support reaches a family's bank account: every step, every rule and every safeguard, in the open."
    >
      <Section>
        <div className="grid gap-5 md:grid-cols-2">
          {[
            { href: "#giving", title: "Giving Zakat", body: "Calculate, pay by QR, get a verifiable certificate.", color: "#007050" },
            { href: "#receiving", title: "Receiving support", body: "Register, be assessed and scored, decided on, and paid.", color: "#001539" },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="group rounded-2xl border border-black/5 p-6 shadow-sm transition hover:shadow-md"
              style={{ boxShadow: `inset 4px 0 0 ${item.color}` }}
            >
              <p className="font-serif-display text-2xl" style={{ color: "#001539" }}>
                {item.title} <span className="inline-block transition group-hover:translate-x-1">→</span>
              </p>
              <p className="mt-2 text-sm" style={{ color: "#6F6F6F" }}>
                {item.body}
              </p>
            </a>
          ))}
        </div>
        {live.length > 0 ? (
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {live.map((item) => (
              <div key={item.label} className="rounded-2xl bg-black/[0.03] p-5 text-center">
                <p className="font-serif-display text-2xl" style={{ color: "#007050" }}>
                  {item.value}
                </p>
                <p className="mt-1 text-[11px] tracking-[0.12em] uppercase" style={{ color: "#6F6F6F" }}>
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        ) : null}
      </Section>

      <div id="giving" className="scroll-mt-24">
        <Section muted>
          <SectionHeading eyebrow="Giving" title="From your calculation to your certificate" />
          <Timeline steps={GIVING} accent="#007050" />
        </Section>
      </div>

      {config ? (
        <Section>
          <SectionHeading
            eyebrow="The rules in force"
            title="What the calculator applies today"
            intro="These figures are read live from the active rules version, so what you see here is exactly what the calculator uses."
          />
          <RulesTable config={config} />
        </Section>
      ) : null}

      <Section muted>
        <SectionHeading eyebrow="Check a certificate" title="Is this certificate genuine?" intro="Enter the number printed on a Zakat certificate." />
        <div className="mx-auto mt-10 max-w-2xl">
          <CertificateVerify />
        </div>
      </Section>

      <div id="receiving" className="scroll-mt-24">
        <Section>
          <SectionHeading
            eyebrow="Receiving"
            title="How a household is supported"
            intro="Support is decided by a published process, not by who you know. These are the steps every household goes through."
          />
          <Timeline steps={RECEIVING} accent="#001539" />
        </Section>
      </div>

      <Section muted>
        <SectionHeading
          eyebrow="Need levels"
          title="How the score is read"
          intro="The score runs from 0 to 270 points. Where it lands sets the need level and the recommendation the branch sees; the branch still decides."
        />
        <div className="mx-auto mt-10 max-w-3xl">
          <div className="flex h-12 overflow-hidden rounded-xl text-sm font-medium text-white">
            <div className="flex items-center justify-center" style={{ width: `${(110 / 270) * 100}%`, backgroundColor: "#4c9a7a" }}>
              Low need
            </div>
            <div className="flex items-center justify-center" style={{ width: `${(70 / 270) * 100}%`, backgroundColor: "#e18f35" }}>
              Medium
            </div>
            <div className="flex items-center justify-center" style={{ width: `${(90 / 270) * 100}%`, backgroundColor: "#b4532a" }}>
              High need
            </div>
          </div>
          <div className="relative mt-1 h-5 text-xs tabular-nums" style={{ color: "#6F6F6F" }}>
            <span className="absolute left-0">0</span>
            <span className="absolute -translate-x-1/2" style={{ left: `${(110 / 270) * 100}%` }}>
              110
            </span>
            <span className="absolute -translate-x-1/2" style={{ left: `${(180 / 270) * 100}%` }}>
              180
            </span>
            <span className="absolute right-0">270</span>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              ["Low need", "Below 110", "Recommendation: defer and review later"],
              ["Medium need", "110 to 179", "Recommendation: conditional approval"],
              ["High need", "180 and above", "Recommendation: approve"],
            ].map(([title, range, body]) => (
              <div key={title} className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
                <p className="font-medium" style={{ color: "#001539" }}>
                  {title}
                </p>
                <p className="text-sm tabular-nums" style={{ color: "#007050" }}>
                  {range}
                </p>
                <p className="mt-2 text-sm" style={{ color: "#6F6F6F" }}>
                  {body}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-center text-xs" style={{ color: "#6F6F6F" }}>
            The current bands of the published points table. When the table changes, past scores keep the version they were given.
          </p>
        </div>
      </Section>

      <Section>
        <SectionHeading
          eyebrow="Urgent cases"
          title="Fast track and priority"
          intro="Some needs can't wait for the normal cycle. A field officer or branch requests a whitelist mark with evidence; head office decides. It changes the order of the queue, never the score."
        />
        <div className="mx-auto mt-10 grid max-w-4xl gap-5 md:grid-cols-2">
          {[
            {
              title: "Fast track",
              body: "For emergencies such as disaster, displacement or sudden severe illness. The household joins head office's queue straight away, before a full assessment.",
            },
            {
              title: "Priority",
              body: "For lasting needs such as an orphan in care, severe disability or an elderly person without a carer. The household is still assessed, then listed first.",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
              <p className="font-serif-display text-2xl" style={{ color: "#001539" }}>
                {item.title}
              </p>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "#6F6F6F" }}>
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section muted>
        <SectionHeading
          eyebrow="Who can receive Zakat"
          title="The eight eligible categories"
          intro="Every assessment records which of the categories named in the Qur'an (9:60) apply to the household."
        />
        <div className="mx-auto mt-10 grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-4">
          {ASNAF.filter((item) => item.value !== "other").map((item) => (
            <div key={item.value} className="rounded-xl bg-white p-4 text-center text-sm shadow-sm" style={{ color: "#001539" }}>
              {item.label}
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <SectionHeading eyebrow="Safeguards" title="Built so every birr can be traced" />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SAFEGUARDS.map(({ icon: Icon, title, body }) => (
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

      <CtaBand
        title="See it working"
        body="Follow collection and distribution month by month on the live dashboard."
        primary={{ label: "Live dashboard", href: "/transparency/dashboard" }}
        secondary={{ label: "Calculate your Zakat", href: "/zakat/calculator" }}
      />
    </SitePage>
  );
}
