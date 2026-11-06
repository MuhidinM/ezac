"use client";

import { type FormEvent, type ReactNode, useRef, useState } from "react";
import { BadgeCheckIcon, SearchIcon, XCircleIcon } from "lucide-react";

import { useI18n } from "@/lib/i18n/client";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { format } from "@/lib/i18n/messages";
import { toAsciiNumber } from "@/lib/i18n/digits";

type Result = {
  valid: boolean;
  certificateId: string;
  amountEtb?: number | null;
  zakatType?: string | null;
  paidAt?: string | null;
};

type Strings = Dictionary["giving"]["certificate"];

/** A message with {id} in it, with the certificate number set in monospace and kept left-to-right. */
function withId(template: string, id: string): ReactNode {
  const [before, ...rest] = template.split("{id}");
  if (rest.length === 0) return template;
  return (
    <>
      {before}
      <bdi className="font-mono break-all">{id}</bdi>
      {rest.join(id)}
    </>
  );
}

/**
 * Public check of a zakat certificate number (no login). The payer's name is
 * never shown here. Strings come from the page: `t={giving.certificate}`.
 */
export function CertificateVerify({ t }: { t: Strings }) {
  const { intlLocale } = useI18n();
  const [id, setId] = useState("");
  // The number that was actually checked, so the answer always names it.
  const [checkedId, setCheckedId] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  // Bumped on every edit and submit, so a slow answer for an old number is dropped.
  const requestRef = useRef(0);

  function onChange(value: string) {
    setId(value);
    // A "genuine" badge must never sit next to a number that wasn't checked.
    requestRef.current += 1;
    setResult(null);
    setError(null);
    setIsChecking(false);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Arabic keypads type ٠-٩; certificate numbers use ASCII digits.
    const number = toAsciiNumber(id.trim());
    const request = ++requestRef.current;
    setResult(null);
    setError(null);
    setCheckedId(number);
    setIsChecking(true);
    try {
      const response = await fetch(`/bff/certificates/verify/${encodeURIComponent(number)}`);
      const body = (await response.json().catch(() => null)) as { success?: boolean; data?: Result; message?: string } | null;
      if (request !== requestRef.current) return;
      if (!response.ok || !body?.success || !body.data) {
        // The service's own wording is English: show ours for the cases we know,
        // and its message only for another refusal (4xx) we have no words for.
        const status = response.status;
        setError(
          status === 400
            ? t.badNumber
            : status === 404
              ? format(t.notFound, { id: number })
              : status >= 400 && status < 500 && body?.message
                ? body.message
                : t.couldNotCheck,
        );
      } else {
        setResult(body.data);
      }
    } catch {
      if (request !== requestRef.current) return;
      setError(t.couldNotCheck);
    } finally {
      if (request === requestRef.current) setIsChecking(false);
    }
  }

  const shownId = result?.certificateId || checkedId;
  const amount = new Intl.NumberFormat(intlLocale, { maximumFractionDigits: 2 });

  return (
    <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
      <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor="certificate-id" className="sr-only">
          {t.label}
        </label>
        <input
          id="certificate-id"
          value={id}
          onChange={(event) => onChange(event.target.value)}
          placeholder={t.placeholder}
          className="h-12 min-w-0 flex-1 rounded-full border border-black/10 px-5 font-mono text-sm outline-none focus:border-brand focus-visible:ring-2 focus-visible:ring-brand/30"
          autoComplete="off"
          spellCheck={false}
          required
        />
        <button
          type="submit"
          disabled={isChecking || !id.trim()}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-brand px-6 text-sm text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:opacity-60"
        >
          <SearchIcon className="h-4 w-4" aria-hidden="true" />
          {isChecking ? t.checking : t.verify}
        </button>
      </form>
      <div aria-live="polite">
        {error ? <p className="mt-4 text-sm text-accent-ink">{error}</p> : null}
        {result ? (
          result.valid ? (
            <div className="mt-5 rounded-xl bg-brand/[0.06] p-4">
              <p className="flex items-center gap-2 text-sm font-medium text-brand">
                <BadgeCheckIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{withId(t.genuine, shownId)}</span>
              </p>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                {[
                  [t.amount, result.amountEtb != null ? format(t.amountValue, { amount: amount.format(result.amountEtb) }) : t.none],
                  [t.type, result.zakatType ? result.zakatType.replace(/_/g, " ") : t.none],
                  [
                    t.paidOn,
                    result.paidAt ? new Date(result.paidAt).toLocaleDateString(intlLocale, { dateStyle: "medium" }) : t.none,
                  ],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs text-muted-ink">{label}</dt>
                    <dd className="text-navy capitalize">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : (
            <p className="mt-5 flex items-center gap-2 text-sm text-accent-ink">
              <XCircleIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{withId(t.notFound, shownId)}</span>
            </p>
          )
        ) : null}
      </div>
    </div>
  );
}
