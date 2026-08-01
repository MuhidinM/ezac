"use client";

import { MapPin } from "lucide-react";

import { StepWrapper } from "@/components/questionnaire/step-wrapper";
import { FormField } from "@/components/questionnaire/ui/form-field";
import { RadioGroup } from "@/components/questionnaire/ui/radio-group";

import { createCoverageArea } from "../initial-state";
import type { CoverageArea, NgoStepProps } from "../types";
import { DynamicList } from "../ui/dynamic-list";

const inputClass =
  "form-input";

const cellInput = "min-h-[40px] w-full rounded-lg border border-black/20 px-2 text-base";

export function Step2Coverage({ state, setState, errors }: NgoStepProps) {
  const s = state.step2;
  const active = s.beneficiaryStats.activeReceiving || "0";
  const woredas = s.woredasCount || "0";
  const regions = s.regionsCount || "0";

  function updateStep2(field: keyof typeof s, value: string) {
    setState((prev) => ({ ...prev, step2: { ...prev.step2, [field]: value } }));
  }

  function updateStat(field: keyof typeof s.beneficiaryStats, value: string) {
    setState((prev) => ({
      ...prev,
      step2: {
        ...prev.step2,
        beneficiaryStats: { ...prev.step2.beneficiaryStats, [field]: value },
      },
    }));
  }

  function updateArea(index: number, field: keyof CoverageArea, value: string) {
    setState((prev) => {
      const areas = [...prev.step2.coverageAreas];
      areas[index] = { ...areas[index], [field]: value };
      return { ...prev, step2: { ...prev.step2, coverageAreas: areas } };
    });
  }

  return (
    <StepWrapper
      title="Who and where do you serve?"
      description="Tell us about the communities your organization works in"
      icon={MapPin}
    >
      <div className="space-y-8">
        <section>
          <h3 className="mb-4 text-lg font-semibold text-[#001539]">Coverage Area</h3>
          <div className="mb-4 grid gap-4 sm:grid-cols-3">
            <FormField label="Number of Regions covered" htmlFor="regionsCount">
              <input id="regionsCount" type="number" min={0} value={s.regionsCount} onChange={(e) => updateStep2("regionsCount", e.target.value)} className={inputClass} />
            </FormField>
            <FormField label="Number of Woredas covered" htmlFor="woredasCount">
              <input id="woredasCount" type="number" min={0} value={s.woredasCount} onChange={(e) => updateStep2("woredasCount", e.target.value)} className={inputClass} />
            </FormField>
            <FormField label="Number of Kebeles covered" htmlFor="kebelesCount">
              <input id="kebelesCount" type="number" min={0} value={s.kebelesCount} onChange={(e) => updateStep2("kebelesCount", e.target.value)} className={inputClass} />
            </FormField>
          </div>

          <DynamicList
            items={s.coverageAreas}
            maxItems={10}
            addLabel="Add Area"
            onAdd={() =>
              setState((prev) => ({
                ...prev,
                step2: {
                  ...prev.step2,
                  coverageAreas: [...prev.step2.coverageAreas, createCoverageArea()],
                },
              }))
            }
            onRemove={(index) =>
              setState((prev) => ({
                ...prev,
                step2: {
                  ...prev.step2,
                  coverageAreas: prev.step2.coverageAreas.filter((_, i) => i !== index),
                },
              }))
            }
            tableHeaders={
              <>
                <th className="pb-2 pr-2">Region</th>
                <th className="pb-2 pr-2">Zone</th>
                <th className="pb-2 pr-2">Woreda</th>
                <th className="pb-2 pr-2">Urban/Rural</th>
              </>
            }
            renderTableRow={(area, index) => (
              <>
                <td className="py-2 pr-2"><input type="text" value={area.region} onChange={(e) => updateArea(index, "region", e.target.value)} className={cellInput} /></td>
                <td className="py-2 pr-2"><input type="text" value={area.zone} onChange={(e) => updateArea(index, "zone", e.target.value)} className={cellInput} /></td>
                <td className="py-2 pr-2"><input type="text" value={area.woreda} onChange={(e) => updateArea(index, "woreda", e.target.value)} className={cellInput} /></td>
                <td className="py-2 pr-2">
                  <select value={area.urbanRural} onChange={(e) => updateArea(index, "urbanRural", e.target.value)} className={cellInput}>
                    <option value="">—</option>
                    <option value="urban">Urban</option>
                    <option value="rural">Rural</option>
                  </select>
                </td>
              </>
            )}
            renderMobileCard={(area, index) => (
              <div className="grid gap-3">
                <FormField label="Region"><input type="text" value={area.region} onChange={(e) => updateArea(index, "region", e.target.value)} className={inputClass} /></FormField>
                <FormField label="Zone"><input type="text" value={area.zone} onChange={(e) => updateArea(index, "zone", e.target.value)} className={inputClass} /></FormField>
                <FormField label="Woreda"><input type="text" value={area.woreda} onChange={(e) => updateArea(index, "woreda", e.target.value)} className={inputClass} /></FormField>
                <RadioGroup name={`urbanRural-${index}`} label="Urban/Rural" value={area.urbanRural} onChange={(v) => updateArea(index, "urbanRural", v)}
                  options={[{ value: "urban", label: "Urban" }, { value: "rural", label: "Rural" }]}
                />
              </div>
            )}
          />
        </section>

        <section>
          <h3 className="mb-4 text-lg font-semibold text-[#001539]">Beneficiary Statistics (last 12 months)</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Total registered beneficiaries" htmlFor="totalRegistered" required error={errors.totalRegistered}>
              <input id="totalRegistered" type="number" min={0} value={s.beneficiaryStats.totalRegistered} onChange={(e) => updateStat("totalRegistered", e.target.value)} className={inputClass} />
            </FormField>
            <FormField label="Total active beneficiaries currently receiving aid" htmlFor="activeReceiving" required error={errors.activeReceiving}>
              <input id="activeReceiving" type="number" min={0} value={s.beneficiaryStats.activeReceiving} onChange={(e) => updateStat("activeReceiving", e.target.value)} className={inputClass} />
            </FormField>
            {(["female", "children", "elderly", "disability", "orphans", "widows", "idp"] as const).map((key) => (
              <FormField key={key} label={key === "idp" ? "Internally displaced persons" : key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1")}>
                <input type="number" min={0} value={s.beneficiaryStats[key]} onChange={(e) => updateStat(key, e.target.value)} className={inputClass} />
              </FormField>
            ))}
          </div>
          <div className="mt-4 rounded-xl border border-black/10 bg-[#007050]/5 px-4 py-4 text-[#001539]">
            <p className="text-base">
              Your organization serves <strong>{active}</strong> active beneficiaries across{" "}
              <strong>{woredas}</strong> woredas in <strong>{regions}</strong> regions.
            </p>
          </div>
        </section>

        <section>
          <RadioGroup name="selectionMethod" label="How does your organization identify and select who receives aid? *"
            value={s.selectionMethod} onChange={(v) => updateStep2("selectionMethod", v)} error={errors.selectionMethod}
            options={[
              { value: "community_referral", label: "Community referral" },
              { value: "field_assessment", label: "Field assessment / home visits" },
              { value: "application", label: "Application-based (self-registration)" },
              { value: "mosque_partnership", label: "Partnership with local mosques" },
              { value: "government_referral", label: "Referral from government offices" },
              { value: "other", label: "Other" },
            ]}
          />
          {s.selectionMethod === "other" ? (
            <FormField label="Please specify" htmlFor="selectionMethodOther" error={errors.selectionMethodOther} className="mt-3">
              <input id="selectionMethodOther" type="text" value={s.selectionMethodOther} onChange={(e) => updateStep2("selectionMethodOther", e.target.value)} className={inputClass} />
            </FormField>
          ) : null}
        </section>
      </div>
    </StepWrapper>
  );
}
