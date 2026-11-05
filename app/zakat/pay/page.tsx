import type { Metadata } from "next";
import {
  Building2Icon,
  DownloadIcon,
  QrCodeIcon,
  ReceiptIcon,
  ShieldCheckIcon,
  SmartphoneIcon,
} from "lucide-react";
import { SitePage } from "@/components/site/site-page";
import { CITIZEN_APP_DOWNLOAD_URL } from "@/lib/constants/app-download";
import {
  CtaBand,
  FeatureGrid,
  Section,
  SectionHeading,
  StepList,
} from "@/components/site/sections";

export const metadata: Metadata = {
  title: "Pay Zakat Now — EZAC",
  description:
    "Pay your Zakat by QR code from any Ethiopian bank app, straight into the Commission's account, and get a certificate anyone can verify.",
};

const CHANNELS = [
  {
    icon: QrCodeIcon,
    title: "QR from any bank app",
    description:
      "Scan the QR code in the EZAC app with the mobile app of any Ethiopian bank. No card or wallet needed.",
  },
  {
    icon: Building2Icon,
    title: "Straight to the Commission",
    description:
      "The money goes directly into the Commission's account at Cooperative Bank of Oromia, with no intermediary holding it.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Confirmed against the bank",
    description:
      "Each payment is matched to the bank's own transaction record before it counts, and one transaction can confirm only one payment.",
  },
  {
    icon: ReceiptIcon,
    title: "Traceable receipt",
    description:
      "Every confirmed payment issues a numbered certificate that anyone can verify on the How it works page.",
  },
];

const STEPS = [
  {
    title: "Calculate your obligation",
    body: "Use the Zakat calculator to find the exact amount due across all your assets.",
  },
  {
    title: "Scan the QR",
    body: "In the EZAC app, choose the general fund or a cause, then scan the QR code with your bank app. It's valid for 30 minutes.",
  },
  {
    title: "Get your certificate",
    body: "The payment is confirmed against the bank's record and you receive a numbered certificate you can verify any time.",
  },
];

export default function PayZakatPage() {
  return (
    <SitePage
      eyebrow="Zakat"
      title="Pay Zakat"
      accent="now"
      intro="Settle your obligation in a few taps through trusted, audited channels — with every birr traced from your hand to the families and futures it builds."
    >
      <Section>
        <SectionHeading
          eyebrow="Ways to give"
          title="Simple, bank-to-bank"
          intro="Payments run through the national QR payment network and are reconciled with the bank."
        />
        <FeatureGrid items={CHANNELS} columns={2} />
      </Section>
      <Section muted>
        <SectionHeading eyebrow="How it works" title="Three simple steps" />
        <StepList steps={STEPS} />
      </Section>
      {/* The calculator's "Proceed to Pay Zakat" lands here: give people the app itself. */}
      <Section>
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 rounded-3xl border border-black/5 bg-white p-8 text-center shadow-sm sm:p-10">
          <span
            className="inline-flex h-12 w-12 items-center justify-center rounded-full"
            style={{ backgroundColor: "rgba(0,112,80,0.1)" }}
          >
            <SmartphoneIcon className="h-6 w-6" style={{ color: "#007050" }} />
          </span>
          <div>
            <h2 className="font-serif-display text-3xl sm:text-4xl" style={{ color: "#001539", letterSpacing: "-1px" }}>
              Get the EZAC app
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed" style={{ color: "#6F6F6F" }}>
              You pay in the EZAC app. It is available for Android phones only, as
              a direct download (APK file) rather than from an app store.
            </p>
          </div>
          <a
            href={CITIZEN_APP_DOWNLOAD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-medium text-white transition-transform duration-300 hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007050] focus-visible:ring-offset-2"
            style={{ backgroundColor: "#007050" }}
          >
            <DownloadIcon className="h-4 w-4" />
            Download the Android app
            <span className="sr-only">(APK file, opens in a new tab)</span>
          </a>
        </div>
      </Section>
      <CtaBand
        title="Know your number first"
        body="Work out exactly what you owe, then pay with confidence."
        primary={{ label: "Open the calculator", href: "/zakat/calculator" }}
        secondary={{ label: "See where it goes", href: "/transparency/dashboard" }}
      />
    </SitePage>
  );
}
