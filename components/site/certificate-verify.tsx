"use client";

import { type FormEvent, useRef, useState } from "react";
import { BadgeCheckIcon, SearchIcon, XCircleIcon } from "lucide-react";

type Result = {
  valid: boolean;
  certificateId: string;
  amountEtb?: number | null;
  zakatType?: string | null;
  paidAt?: string | null;
};

const etb = new Intl.NumberFormat("en-ET", { maximumFractionDigits: 2 });

/** Public check of a zakat certificate number (no login). The payer's name is never shown here. */
export function CertificateVerify() {
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
    const number = id.trim();
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
        setError(body?.message ?? "Couldn't check the certificate. Try again in a moment.");
      } else {
        setResult(body.data);
      }
    } catch {
      if (request !== requestRef.current) return;
      setError("Couldn't check the certificate. Try again in a moment.");
    } finally {
      if (request === requestRef.current) setIsChecking(false);
    }
  }

  const shownId = result?.certificateId || checkedId;

  return (
    <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
      <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor="certificate-id" className="sr-only">
          Certificate number
        </label>
        <input
          id="certificate-id"
          value={id}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Certificate number, e.g. ZC-2026-000451"
          className="h-12 min-w-0 flex-1 rounded-full border border-black/10 px-5 font-mono text-sm outline-none focus:border-[#007050]"
          autoComplete="off"
          spellCheck={false}
          required
        />
        <button
          type="submit"
          disabled={isChecking || !id.trim()}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-sm text-white transition disabled:opacity-60"
          style={{ backgroundColor: "#007050" }}
        >
          <SearchIcon className="h-4 w-4" />
          {isChecking ? "Checking…" : "Verify"}
        </button>
      </form>
      <div aria-live="polite">
        {error ? (
          <p className="mt-4 text-sm" style={{ color: "#b4532a" }}>
            {error}
          </p>
        ) : null}
        {result ? (
          result.valid ? (
            <div className="mt-5 rounded-xl p-4" style={{ backgroundColor: "rgba(0,112,80,0.06)" }}>
              <p className="flex items-center gap-2 text-sm font-medium" style={{ color: "#007050" }}>
                <BadgeCheckIcon className="h-4 w-4 shrink-0" />
                <span>
                  <span className="font-mono break-all">{shownId}</span> is a genuine certificate
                </span>
              </p>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                {[
                  ["Amount", result.amountEtb != null ? `ETB ${etb.format(result.amountEtb)}` : "—"],
                  ["Zakat", result.zakatType ? result.zakatType.replace(/_/g, " ") : "—"],
                  ["Paid on", result.paidAt ? new Date(result.paidAt).toLocaleDateString("en", { dateStyle: "medium" }) : "—"],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs" style={{ color: "#6F6F6F" }}>
                      {label}
                    </dt>
                    <dd className="capitalize" style={{ color: "#001539" }}>
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : (
            <p className="mt-5 flex items-center gap-2 text-sm" style={{ color: "#b4532a" }}>
              <XCircleIcon className="h-4 w-4 shrink-0" />
              <span>
                No certificate with the number <span className="font-mono break-all">{shownId}</span>. Check it and try
                again.
              </span>
            </p>
          )
        ) : null}
      </div>
    </div>
  );
}
