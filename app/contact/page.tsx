import type { Metadata } from "next";
import { ClockIcon, MailIcon, MapPinIcon, PhoneIcon } from "lucide-react";
import { SitePage } from "@/components/site/site-page";
import { Section, SectionHeading } from "@/components/site/sections";

export const metadata: Metadata = {
  title: "Contact Support — EZAC",
  description:
    "Get in touch with the Ethiopian Zakat & Awqaf Commission — by email, phone, or in person.",
};

const CHANNELS = [
  {
    icon: MailIcon,
    title: "Email",
    value: "support@ezac.gov.et",
    href: "mailto:support@ezac.gov.et",
  },
  {
    icon: PhoneIcon,
    title: "Phone",
    value: "+251 11 000 0000",
    href: "tel:+251110000000",
  },
  {
    icon: MapPinIcon,
    title: "Office",
    value: "Addis Ababa, Ethiopia",
  },
  {
    icon: ClockIcon,
    title: "Hours",
    value: "Mon–Fri, 8:30–17:00 (EAT)",
  },
];

const inputClass =
  "w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-[#007050] focus-visible:ring-2 focus-visible:ring-[#007050]";

export default function ContactPage() {
  return (
    <SitePage
      eyebrow="Support"
      title="Contact"
      accent="support"
      intro="Questions about Zakat, Waqf, a payment, or your account? Reach us through any channel below and our team will help."
    >
      <Section>
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <SectionHeading eyebrow="Reach us" title="Get in touch" />
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {CHANNELS.map(({ icon: Icon, title, value, href }) => {
                const inner = (
                  <>
                    <span
                      className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full"
                      style={{ backgroundColor: "rgba(0,112,80,0.1)" }}
                    >
                      <Icon className="h-5 w-5" style={{ color: "#007050" }} />
                    </span>
                    <p
                      className="text-xs uppercase tracking-[0.14em]"
                      style={{ color: "#6F6F6F" }}
                    >
                      {title}
                    </p>
                    <p className="mt-1 text-sm" style={{ color: "#001539" }}>
                      {value}
                    </p>
                  </>
                );
                return href ? (
                  <a
                    key={title}
                    href={href}
                    className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm transition-colors hover:border-[#007050]"
                  >
                    {inner}
                  </a>
                ) : (
                  <div
                    key={title}
                    className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm"
                  >
                    {inner}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-xl shadow-black/5 sm:p-8">
            <h2
              className="font-serif-display text-2xl"
              style={{ color: "#001539", letterSpacing: "-0.5px" }}
            >
              Send us a message
            </h2>
            <form
              action="mailto:support@ezac.gov.et"
              method="post"
              encType="text/plain"
              className="mt-6 space-y-4"
            >
              <div className="space-y-1.5">
                <label
                  htmlFor="contact-name"
                  className="text-xs"
                  style={{ color: "#6F6F6F" }}
                >
                  Your name
                </label>
                <input id="contact-name" name="name" type="text" required className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <label
                  htmlFor="contact-email"
                  className="text-xs"
                  style={{ color: "#6F6F6F" }}
                >
                  Email address
                </label>
                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  required
                  className={inputClass}
                />
              </div>
              <div className="space-y-1.5">
                <label
                  htmlFor="contact-message"
                  className="text-xs"
                  style={{ color: "#6F6F6F" }}
                >
                  Message
                </label>
                <textarea
                  id="contact-message"
                  name="message"
                  rows={4}
                  required
                  className={`${inputClass} resize-y`}
                />
              </div>
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center rounded-full py-3.5 text-sm font-medium text-white transition-transform duration-300 hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007050] focus-visible:ring-offset-2"
                style={{ backgroundColor: "#007050" }}
              >
                Send message
              </button>
            </form>
          </div>
        </div>
      </Section>
    </SitePage>
  );
}
