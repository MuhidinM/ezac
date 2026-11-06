"use client";

import { ColumnPairs } from "@/components/charts/column-pairs";
import { STATUS } from "@/components/charts/palette";
import { SplitBar } from "@/components/charts/split-bar";
import { InlineAlert } from "@/components/dashboard/inline-alert";
import { Panel } from "@/components/dashboard/panel";
import { useResource } from "@/lib/api/use-resource";
import { formatCount, formatEtb } from "@/lib/backoffice/format";
import type { DisbursementSummary } from "@/lib/zakat/disbursements";
import type { PaymentSummary } from "@/lib/zakat/payments";

type ImpactSeries = {
  interval: "month";
  points: { period: string; collectedEtb: number | null; disbursedEtb: number | null }[];
};

const IN_PROGRESS = new Set(["AWAITING_CONFIRMATION", "OTP_SENT", "AWAITING_PAYMENT", "PROCESSING"]);

function monthLabel(period: string) {
  const date = new Date(`${period.slice(0, 7)}-01T00:00:00`);
  return Number.isNaN(date.getTime()) ? period : new Intl.DateTimeFormat("en", { month: "short", year: "2-digit" }).format(date);
}

/** Money in and out: Zakat collected vs paid to households per month, and how payments ended. */
export function MoneySection({ payments, payouts }: { payments?: PaymentSummary; payouts?: DisbursementSummary }) {
  const series = useResource<ImpactSeries>("/bff/zakat/impact/timeseries");
  const points = series.data?.points ?? [];

  const byStatus = payments?.byStatus ?? [];
  const sum = (match: (status: string) => boolean) => byStatus.filter((item) => match(item.status)).reduce((total, item) => total + item.count, 0);
  const outcomes = [
    { key: "paid", label: "Paid", value: sum((s) => s === "SUCCEEDED"), color: STATUS.good },
    { key: "progress", label: "Still in progress", value: sum((s) => IN_PROGRESS.has(s)), color: STATUS.waiting },
    { key: "failed", label: "Failed", value: sum((s) => s === "FAILED"), color: STATUS.bad },
    { key: "ended", label: "Cancelled or expired", value: sum((s) => s === "CANCELLED" || s === "EXPIRED"), color: STATUS.neutral },
  ];
  const paidByFund = payouts?.paidByFund ?? [];

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <Panel
        className="lg:col-span-8"
        title="Zakat in and out"
        description="Collected from donors and paid to households, per month (last 12 months, as published)"
      >
        {series.error ? (
          <InlineAlert>{series.error.message}</InlineAlert>
        ) : series.isLoading && !series.data ? (
          <div className="h-[260px] animate-pulse rounded-lg bg-black/[0.03]" />
        ) : (
          <ColumnPairs
            label="Zakat collected and paid out per month, in birr"
            rows={points.map((point) => ({ period: point.period, collected: point.collectedEtb ?? 0, paid: point.disbursedEtb ?? 0 }))}
            series={[
              { key: "collected", label: "Collected" },
              { key: "paid", label: "Paid to households" },
            ]}
            formatLabel={monthLabel}
            formatValue={(value) => formatEtb(value)}
            formatTick={(value) => formatEtb(value, { compact: true })}
            emptyText="No Zakat collected or paid in the last 12 months."
          />
        )}
      </Panel>

      <Panel className="lg:col-span-4" title="Donor payments" description="How payments started in this period ended">
        <div className="space-y-6">
          <div>
            <p className="text-3xl font-semibold tracking-tight text-navy">{formatEtb(payments?.succeededAmountEtb, { compact: true })}</p>
            <p className="mt-1 text-xs text-black/60">
              collected from {formatCount(payments?.succeededCount)} of {formatCount(payments?.totalCount)} payments
            </p>
          </div>
          <SplitBar label="Donor payments by outcome" parts={outcomes} emptyText="No payments in this period." />
          <div className="border-t border-black/[0.06] pt-4">
            <p className="text-sm font-medium text-navy">Payouts to households</p>
            <p className="mt-1 text-xs text-black/60">
              {formatCount(payouts?.succeededCount)} paid · {formatEtb(payouts?.succeededAmountEtb)}
              {payouts?.needsChecking ? ` · ${formatCount(payouts.needsChecking)} need checking` : ""}
            </p>
            {paidByFund.some((fund) => fund.count > 0) ? (
              <ul className="mt-2 space-y-1 text-xs text-black/70">
                {paidByFund.map((fund) => (
                  <li key={fund.fund} className="flex justify-between">
                    <span>{fund.fund === "ZAKAT" ? "Zakat fund" : "Waqf fund"}</span>
                    <span className="tabular-nums">{formatEtb(fund.amountEtb)}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </Panel>
    </div>
  );
}
