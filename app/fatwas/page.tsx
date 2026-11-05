import type { Metadata } from "next";
import Link from "next/link";
import { SitePage } from "@/components/site/site-page";
import { Section, SectionHeading, FaqAccordion, CtaBand } from "@/components/site/sections";
import { readCalculatorConfig } from "@/components/landing/read-calculator-config";
import { MIXED_IRRIGATION_RATE, RIKAZ_RATE, type CalculatorConfig } from "@/lib/zakat/calculator-config";
import { getCalculatorConfig } from "@/lib/zakat/impact";

export const metadata: Metadata = {
  title: "Fatwas & Islamic Rulings on Zakat — EZAC",
  description:
    "Authoritative rulings from the EZAC Shari'ah Advisory Board on Zakat, Waqf, and contemporary financial questions.",
};

// The figures below come from the rules version the calculator applies, refreshed
// every 5 minutes, so this page can't contradict the calculator.
export const revalidate = 300;

const pct = (rate: number) => `${+(rate * 100).toFixed(2)}%`;
const number = new Intl.NumberFormat("en-ET", { maximumFractionDigits: 1 });

/**
 * Rule figures are read from the live config. When it can't be loaded (gateway
 * down, or during the build), the answers fall back to wording without figures
 * and point to How it works, rather than state a threshold the calculator may
 * not apply.
 */
function rulings(config: CalculatorConfig | null) {
  const rate = config ? pct(config.wealth.rate) : "2.5%";
  return [
    {
      q: "On which assets is Zakat obligatory?",
      a: "Zakat is due on cash and savings, gold and silver, trade goods, agricultural produce, livestock, and certain modern assets such as tradable shares — once each meets its Nisab and, where required, a full lunar year (Hawl).",
    },
    {
      q: "Is the Nisab based on gold or silver?",
      a: config
        ? `Nisab is the value of ${number.format(config.nisab.goldGrams)} g of gold or ${number.format(config.nisab.silverGrams)} g of silver. The rules in force today use the ${config.nisab.basis} standard: ${number.format(config.nisab.basis === "gold" ? config.nisab.goldGrams : config.nisab.silverGrams)} g of ${config.nisab.basis}, which the calculator converts to birr at the day's price.`
        : "Nisab is the value of a set weight of gold or of silver. The Commission's published rules say which one applies, and the calculator converts it to birr at the day's price. The 'How it works' page shows the rules in force today.",
    },
    {
      q: "When is agricultural Zakat (Ushr) paid?",
      a: config
        ? `Ushr is due on the day of harvest, with no Hawl required: ${pct(config.crops.rainFedRate)} for rain-fed produce, ${pct(MIXED_IRRIGATION_RATE)} for mixed irrigation, and ${pct(config.crops.irrigatedRate)} for artificially irrigated crops, once the harvest reaches ${number.format(config.crops.nisabKg)} kg.`
        : "Ushr is due on the day of harvest, with no Hawl required. The rate is higher for rain-fed produce than for irrigated crops, and it applies once the harvest reaches the crop Nisab. The 'How it works' page shows the rates in force today.",
    },
    {
      q: "How is Zakat on business assets calculated?",
      a: `Trade goods bought with the intention of resale — inventory, business cash, and receivables, less short-term payables — are assessed at ${rate}. Fixed assets such as machinery, vehicles, and premises are exempt.`,
    },
    {
      q: "What is the ruling on Rikaz and mined minerals?",
      a: `Rikaz (buried treasure) owes ${pct(RIKAZ_RATE)} immediately on discovery, with no Nisab or Hawl. Extracted minerals owe ${rate} once they reach the Nisab value.`,
    },
    {
      q: "Can long-term debts be deducted before Zakat?",
      a: "Only short-term debts due within the lunar year, and the next twelve months of long-term loan payments, may be deducted. Deducting full long-term debt would unduly keep payers below Nisab.",
    },
  ];
}

export default async function FatwasPage() {
  // null means no prices are published yet. The catch keeps this page up during
  // an outage too: its wording without figures is still correct, unlike an empty
  // figure on the other pages, so it may be cached for the 5-minute window.
  const config = readCalculatorConfig(await getCalculatorConfig().catch(() => null));

  return (
    <SitePage
      eyebrow="Knowledge"
      title="Fatwas & Islamic"
      accent="rulings"
      intro="Guidance issued by the EZAC Shari'ah Advisory Board. These rulings underpin the calculator's logic and the Commission's disbursement policy."
    >
      <Section>
        <SectionHeading
          eyebrow="Rulings"
          title="Zakat rulings, explained"
          intro="Each ruling reflects the considered opinion of qualified scholars."
        />
        <FaqAccordion items={rulings(config)} />
        <p className="mx-auto mt-6 max-w-3xl text-center text-xs" style={{ color: "#6F6F6F" }}>
          {config ? (
            <>
              Figures on this page come from the rules the calculator applies today
              {config.configVersion > 0 ? ` (version ${config.configVersion})` : ""}.
            </>
          ) : (
            <>
              Today&apos;s figures could not be loaded. See{" "}
              <Link href="/how-it-works" className="underline underline-offset-2" style={{ color: "#007050" }}>
                How it works
              </Link>{" "}
              for the rules in force.
            </>
          )}
        </p>
      </Section>
      <CtaBand
        title="Put the rulings into practice"
        body="The calculator applies each of these rulings automatically across your assets."
        primary={{ label: "Open the calculator", href: "/zakat/calculator" }}
        secondary={{ label: "Meet the Shari'ah board", href: "/about/shariah-board" }}
      />
    </SitePage>
  );
}
