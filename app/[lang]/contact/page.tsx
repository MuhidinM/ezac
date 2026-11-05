import type { Metadata } from "next";
import { MailIcon, MapPinIcon, PhoneIcon } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { JsonLd } from "@/components/seo/json-ld";
import { SitePage } from "@/components/site/site-page";
import { Section, SectionHeading } from "@/components/site/sections";
import { format } from "@/lib/i18n/messages";
import { getDictionary, localeFromParam } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/structured-data";

export async function generateMetadata({ params }: PageProps<"/[lang]/contact">): Promise<Metadata> {
  const locale = localeFromParam((await params).lang);
  const { meta } = (await getDictionary(locale)).about.contact;
  return pageMetadata({ locale, path: "/contact", ...meta });
}

/**
 * Placeholders until the Commission confirms them: the phone number is not a
 * working line, and the email domain is not confirmed. Office hours are left
 * out until they are confirmed too. Change them here only.
 */
const SUPPORT_EMAIL = "support@ezac.gov.et";
const SUPPORT_PHONE = { display: "+251 11 000 0000", tel: "+251110000000" };

const inputClass =
  "w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-brand focus-visible:ring-2 focus-visible:ring-brand";

const labelClass = "text-xs text-muted-ink";

type Channel = { icon: LucideIcon; title: string; value: string; href?: string; linkTitle?: string };

export default async function ContactPage({ params }: PageProps<"/[lang]/contact">) {
  const locale = localeFromParam((await params).lang);
  const dictionary = await getDictionary(locale);
  const t = dictionary.about.contact;
  const crumbs = dictionary.about.breadcrumbs;

  const channels: Channel[] = [
    {
      icon: MailIcon,
      title: t.channels.email,
      value: SUPPORT_EMAIL,
      href: `mailto:${SUPPORT_EMAIL}`,
      linkTitle: format(t.channels.emailTitle, { email: SUPPORT_EMAIL }),
    },
    {
      icon: PhoneIcon,
      title: t.channels.phone,
      value: SUPPORT_PHONE.display,
      href: `tel:${SUPPORT_PHONE.tel}`,
      linkTitle: format(t.channels.phoneTitle, { phone: SUPPORT_PHONE.display }),
    },
    { icon: MapPinIcon, title: t.channels.office, value: t.channels.officeValue },
  ];

  return (
    <SitePage eyebrow={t.header.eyebrow} title={t.header.title} accent={t.header.accent} intro={t.header.intro}>
      <JsonLd
        data={breadcrumbJsonLd(locale, [
          { name: crumbs.home, path: "/" },
          { name: crumbs.contact, path: "/contact" },
        ])}
      />
      <Section>
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <SectionHeading eyebrow={t.channels.eyebrow} title={t.channels.title} />
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {channels.map(({ icon: Icon, title, value, href, linkTitle }) => {
                const inner = (
                  <>
                    <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand/10">
                      <Icon className="h-5 w-5 text-brand" aria-hidden="true" />
                    </span>
                    <p className="text-xs tracking-[0.14em] text-muted-ink uppercase">{title}</p>
                    {/* Phone numbers and email addresses read left to right in every language. */}
                    <p className="mt-1 text-sm text-navy">{href ? <span dir="ltr">{value}</span> : value}</p>
                  </>
                );
                return href ? (
                  <a
                    key={title}
                    href={href}
                    title={linkTitle}
                    className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm transition-colors hover:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  >
                    {inner}
                  </a>
                ) : (
                  <div key={title} className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
                    {inner}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-xl shadow-black/5 sm:p-8">
            <h2 className="font-serif-display text-2xl tracking-[-0.5px] text-navy">{t.form.title}</h2>
            <p id="contact-form-note" className="mt-2 text-sm leading-relaxed text-muted-ink">
              {format(t.form.note, { email: SUPPORT_EMAIL })}
            </p>
            <form
              action={`mailto:${SUPPORT_EMAIL}`}
              method="post"
              encType="text/plain"
              aria-describedby="contact-form-note"
              className="mt-6 space-y-4"
            >
              <div className="space-y-1.5">
                <label htmlFor="contact-name" className={labelClass}>
                  {t.form.name}
                </label>
                <input id="contact-name" name="name" type="text" autoComplete="name" required className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="contact-email" className={labelClass}>
                  {t.form.email}
                </label>
                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  dir="ltr"
                  required
                  className={inputClass}
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="contact-message" className={labelClass}>
                  {t.form.message}
                </label>
                <textarea id="contact-message" name="message" rows={4} required className={`${inputClass} resize-y`} />
              </div>
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center rounded-full bg-brand py-3.5 text-sm font-medium text-white transition-transform duration-300 hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
              >
                {t.form.submit}
              </button>
            </form>
          </div>
        </div>
      </Section>
    </SitePage>
  );
}
