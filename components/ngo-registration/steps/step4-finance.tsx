"use client";

import { BarChart3 } from "lucide-react";

import { StepWrapper } from "@/components/questionnaire/step-wrapper";
import { CheckboxGroup } from "@/components/questionnaire/ui/checkbox-group";
import { CurrencyInput } from "@/components/questionnaire/ui/currency-input";
import { FormField } from "@/components/questionnaire/ui/form-field";
import { RadioGroup } from "@/components/questionnaire/ui/radio-group";
import { TextArea } from "@/components/questionnaire/ui/text-area";
import { parseCurrency, formatDisplayCurrency } from "@/components/questionnaire/utils";

import {
  createFundingSource,
  FUNDING_SOURCE_KEYS,
  FUNDING_SOURCE_LABELS,
} from "../initial-state";
import { getGapColor } from "../scoring";
import type { NgoStepProps } from "../types";

const inputClass =
  "min-h-[48px] w-full rounded-xl border border-[#1a3d2b]/20 bg-white px-4 py-3 text-base text-[#1a3d2b] outline-none transition focus:border-[#1a3d2b] focus:ring-2 focus:ring-[#1a3d2b]/20";

const yesNo = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

export function Step4Finance({ state, setState, errors }: NgoStepProps) {
  const s = state.step4;
  const totalBudget = parseCurrency(s.totalBudget);
  const securedBudget = parseCurrency(s.securedBudget);
  const gap = Math.max(0, totalBudget - securedBudget);
  const gapPercent = totalBudget > 0 ? (gap / totalBudget) * 100 : 0;

  function update(field: keyof typeof s, value: string) {
    setState((prev) => ({ ...prev, step4: { ...prev.step4, [field]: value } }));
  }

  function updateDonor(field: keyof typeof s.previousDonorAid, value: string) {
    setState((prev) => ({
      ...prev,
      step4: {
        ...prev.step4,
        previousDonorAid: { ...prev.step4.previousDonorAid, [field]: value },
      },
    }));
  }

  function toggleFundingSource(key: string, checked: boolean) {
    setState((prev) => {
      let sources = [...prev.step4.fundingSources];
      if (checked && !sources.some((src) => src.sourceKey === key)) {
        sources.push(createFundingSource(key));
      }
      if (!checked) {
        sources = sources.filter((src) => src.sourceKey !== key);
      }
      return {
        ...prev,
        step4: {
          ...prev.step4,
          fundingSourceFlags: { ...prev.step4.fundingSourceFlags, [key]: checked },
          fundingSources: sources,
        },
      };
    });
  }

  function updateFundingSource(id: string, field: string, value: string) {
    setState((prev) => ({
      ...prev,
      step4: {
        ...prev.step4,
        fundingSources: prev.step4.fundingSources.map((src) =>
          src.id === id ? { ...src, [field]: value } : src,
        ),
      },
    }));
  }

  return (
    <StepWrapper
      title="Your organization's finances"
      description="Help us understand your funding situation and needs"
      icon={BarChart3}
    >
      <div className="space-y-8">
        <section>
          <h3 className="mb-4 text-lg font-semibold text-[#1a3d2b]">Annual Budget (current year)</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Total annual budget" htmlFor="totalBudget" required error={errors.totalBudget}>
              <CurrencyInput id="totalBudget" formatOnBlur value={s.totalBudget} onChange={(v) => update("totalBudget", v)} />
            </FormField>
            <FormField label="Budget already secured / committed" htmlFor="securedBudget">
              <CurrencyInput id="securedBudget" formatOnBlur value={s.securedBudget} onChange={(v) => update("securedBudget", v)} />
            </FormField>
          </div>
          <div className={`mt-4 rounded-xl px-4 py-4 ${getGapColor(gapPercent)}`}>
            <p className="text-sm opacity-80">Remaining funding gap</p>
            <p className="text-2xl font-semibold">ETB {formatDisplayCurrency(gap)}</p>
            {totalBudget > 0 ? (
              <p className="text-sm">({gapPercent.toFixed(1)}% of total budget)</p>
            ) : null}
          </div>
        </section>

        <section>
          <CheckboxGroup
            label="Current Funding Sources — tick all that apply"
            options={FUNDING_SOURCE_KEYS.map((k) => ({ value: k, label: FUNDING_SOURCE_LABELS[k] }))}
            values={s.fundingSourceFlags}
            onChange={toggleFundingSource}
            columns={2}
          />
          {s.fundingSources.length > 0 ? (
            <div className="mt-4 space-y-4">
              {s.fundingSources.map((src) => (
                <div key={src.id} className="rounded-xl border border-[#1a3d2b]/10 bg-[#f7f3ec]/40 p-4">
                  <p className="mb-3 font-medium text-[#1a3d2b]">
                    {FUNDING_SOURCE_LABELS[src.sourceKey as keyof typeof FUNDING_SOURCE_LABELS] ?? src.sourceKey}
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <FormField label="Source name or description">
                      <input type="text" value={src.description} onChange={(e) => updateFundingSource(src.id, "description", e.target.value)} className={inputClass} />
                    </FormField>
                    <FormField label="Annual amount received">
                      <CurrencyInput formatOnBlur value={src.annualAmount} onChange={(v) => updateFundingSource(src.id, "annualAmount", v)} />
                    </FormField>
                    <div className="sm:col-span-2">
                      <RadioGroup name={`confirmed-${src.id}`} label="Confirmed for current year?" value={src.confirmed} onChange={(v) => updateFundingSource(src.id, "confirmed", v)}
                        options={[
                          { value: "yes", label: "Yes" },
                          { value: "no", label: "No" },
                          { value: "partial", label: "Partial" },
                        ]}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </section>

        <section>
          <RadioGroup name="previousDonorAid" label="Has your organization received aid from a large donor before?" value={s.previousDonorAid.received} onChange={(v) => updateDonor("received", v)} options={yesNo} />
          {s.previousDonorAid.received === "yes" ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <FormField label="Donor organization name"><input type="text" value={s.previousDonorAid.donorName} onChange={(e) => updateDonor("donorName", e.target.value)} className={inputClass} /></FormField>
              <FormField label="Year received"><input type="number" min={1900} value={s.previousDonorAid.year} onChange={(e) => updateDonor("year", e.target.value)} className={inputClass} /></FormField>
              <FormField label="Amount received"><CurrencyInput formatOnBlur value={s.previousDonorAid.amount} onChange={(v) => updateDonor("amount", v)} /></FormField>
              <FormField label="Purpose"><input type="text" value={s.previousDonorAid.purpose} onChange={(e) => updateDonor("purpose", e.target.value)} className={inputClass} /></FormField>
              <div className="sm:col-span-2">
                <RadioGroup name="reportingOnTime" label="Was reporting submitted on time?" value={s.previousDonorAid.reportingOnTime} onChange={(v) => updateDonor("reportingOnTime", v)} options={yesNo} />
              </div>
            </div>
          ) : null}
        </section>

        <section>
          <h3 className="mb-4 text-lg font-semibold text-[#1a3d2b]">Requested Aid</h3>
          <div className="space-y-4">
            <FormField label="Total amount of aid requested" htmlFor="requestedAmount" required error={errors.requestedAmount}>
              <CurrencyInput id="requestedAmount" formatOnBlur value={s.requestedAmount} onChange={(v) => update("requestedAmount", v)} />
            </FormField>
            <FormField label="Intended use of requested funds" htmlFor="intendedUse" required error={errors.intendedUse}>
              <TextArea id="intendedUse" value={s.intendedUse} onChange={(v) => update("intendedUse", v)} placeholder="Describe specifically how these funds will be used and who will benefit" />
            </FormField>
            <RadioGroup name="timeline" label="Timeline for use" value={s.timeline} onChange={(v) => update("timeline", v)}
              options={[
                { value: "3_months", label: "Within 3 months" },
                { value: "6_months", label: "Within 6 months" },
                { value: "12_months", label: "Within 12 months" },
              ]}
            />
          </div>
        </section>

        <section>
          <h3 className="mb-4 text-lg font-semibold text-[#1a3d2b]">Bank Account Details</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Bank Name" htmlFor="bankName" required error={errors.bankName}><input id="bankName" type="text" value={s.bankName} onChange={(e) => update("bankName", e.target.value)} className={inputClass} /></FormField>
            <FormField label="Account Name" htmlFor="accountName" required error={errors.accountName}><input id="accountName" type="text" value={s.accountName} onChange={(e) => update("accountName", e.target.value)} className={inputClass} /></FormField>
            <FormField label="Account Number" htmlFor="accountNumber" required error={errors.accountNumber}><input id="accountNumber" type="text" value={s.accountNumber} onChange={(e) => update("accountNumber", e.target.value)} className={inputClass} /></FormField>
            <FormField label="Branch" htmlFor="branch"><input id="branch" type="text" value={s.branch} onChange={(e) => update("branch", e.target.value)} className={inputClass} /></FormField>
          </div>
        </section>
      </div>
    </StepWrapper>
  );
}
