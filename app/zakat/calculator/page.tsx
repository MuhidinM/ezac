import type { Metadata } from "next";
import { SitePage } from "@/components/site/site-page";
import { ZakatCalculator } from "@/components/landing/zakat-calculator";

export const metadata: Metadata = {
  title: "Zakat Calculator — EZAC",
  description:
    "Calculate your Zakat across cash, gold, business, agriculture, livestock and more, with a transparent breakdown before you pay.",
};

export default function ZakatCalculatorPage() {
  return (
    <SitePage
      eyebrow="Zakat"
      title="Zakat"
      accent="Calculator"
      intro="Add only the assets you own and we total your obligation across every category — cash, gold, business, agriculture, livestock and more — with a clear breakdown before you pay."
    >
      <ZakatCalculator />
    </SitePage>
  );
}
