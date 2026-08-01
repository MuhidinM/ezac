"use client";

import { Star } from "lucide-react";

import { StepWrapper } from "@/components/questionnaire/step-wrapper";
import { CheckboxGroup } from "@/components/questionnaire/ui/checkbox-group";
import { FormField } from "@/components/questionnaire/ui/form-field";

import {
  SHARIAH_DECLARATION_LABELS,
  SHARIAH_DECLARATIONS,
} from "../initial-state";
import {
  calculateTotalScore,
  getAutoDecision,
  SCORE_DIMENSIONS,
  useAnimatedNumber,
} from "../scoring";
import type { EligibilityDecision, NgoStepProps, ReviewerScores } from "../types";
import { DecisionBadge, DecisionOverride } from "../ui/decision-badge";
import { ScoreSlider } from "../ui/score-slider";

const inputClass =
  "min-h-[48px] w-full rounded-xl border border-[#1a3d2b]/20 bg-white px-4 py-3 text-base text-[#1a3d2b] outline-none transition focus:border-[#1a3d2b] focus:ring-2 focus:ring-[#1a3d2b]/20";

export function Step5Shariah({ state, setState, errors }: NgoStepProps) {
  const s = state.step5;
  const totalScore = calculateTotalScore(s.reviewerScores);
  const animatedScore = useAnimatedNumber(totalScore);
  const autoDecision = getAutoDecision(totalScore);
  const effectiveDecision: EligibilityDecision = s.decisionOverride || autoDecision;

  function update(field: keyof typeof s, value: string | boolean) {
    setState((prev) => ({ ...prev, step5: { ...prev.step5, [field]: value } }));
  }

  function updateScore(field: keyof ReviewerScores, value: string) {
    setState((prev) => ({
      ...prev,
      step5: {
        ...prev.step5,
        reviewerScores: { ...prev.step5.reviewerScores, [field]: value },
      },
    }));
  }

  return (
    <StepWrapper
      title="Islamic alignment & final evaluation"
      description="Shariah compliance declaration and internal reviewer scoring"
      icon={Star}
    >
      <div className="space-y-8">
        <section>
          <h3 className="mb-4 text-lg font-semibold text-[#1a3d2b]">
            Part A — Shariah Compliance Declaration
          </h3>
          <CheckboxGroup
            label="Your organization confirms the following (tick all that apply):"
            options={SHARIAH_DECLARATIONS.map((k) => ({
              value: k,
              label: SHARIAH_DECLARATION_LABELS[k],
            }))}
            values={s.shariahDeclarations}
            onChange={(value, checked) =>
              setState((prev) => ({
                ...prev,
                step5: {
                  ...prev.step5,
                  shariahDeclarations: {
                    ...prev.step5.shariahDeclarations,
                    [value]: checked,
                  },
                },
              }))
            }
          />
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <FormField label="Shariah Advisor / Committee name" htmlFor="shariahAdvisorName">
              <input id="shariahAdvisorName" type="text" value={s.shariahAdvisorName} onChange={(e) => update("shariahAdvisorName", e.target.value)} className={inputClass} />
            </FormField>
            <FormField label="Contact for Shariah oversight" htmlFor="shariahContact">
              <input id="shariahContact" type="text" value={s.shariahContact} onChange={(e) => update("shariahContact", e.target.value)} className={inputClass} />
            </FormField>
          </div>

          <div className="mt-6 rounded-xl border border-[#1a3d2b]/15 bg-[#f7f3ec]/50 p-4">
            <p className="text-sm text-[#5a6e62]">
              I hereby declare that all information provided in this application is true,
              complete, and accurate to the best of my knowledge. I understand that
              providing false information may result in rejection or disqualification.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <FormField label="Applicant Full Name" htmlFor="applicantName" required error={errors.applicantName}>
                <input id="applicantName" type="text" value={s.applicantName} onChange={(e) => update("applicantName", e.target.value)} className={inputClass} />
              </FormField>
              <FormField label="Job Title" htmlFor="applicantTitle" required error={errors.applicantTitle}>
                <input id="applicantTitle" type="text" value={s.applicantTitle} onChange={(e) => update("applicantTitle", e.target.value)} className={inputClass} />
              </FormField>
              <FormField label="Date" htmlFor="applicantDate" required error={errors.applicantDate}>
                <input id="applicantDate" type="date" value={s.applicantDate} onChange={(e) => update("applicantDate", e.target.value)} className={inputClass} />
              </FormField>
            </div>
            <label className="mt-4 flex min-h-[48px] cursor-pointer items-start gap-3 rounded-xl border border-[#1a3d2b]/15 px-4 py-3">
              <input
                type="checkbox"
                checked={s.declarationAgreed}
                onChange={(e) => update("declarationAgreed", e.target.checked)}
                className="mt-1 h-5 w-5 accent-[#1a3d2b]"
              />
              <span className="text-base text-[#1a3d2b]">
                I agree to the above declaration *
              </span>
            </label>
            {errors.declarationAgreed ? (
              <p className="mt-1 text-sm text-[#c0392b]" role="alert">{errors.declarationAgreed}</p>
            ) : null}
          </div>
        </section>

        <section className="reviewer-section">
          <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#1a3d2b]">
            For Reviewer Use Only — Assessment Officer Section
          </p>
          <div className="space-y-6">
            {SCORE_DIMENSIONS.map((dim) => (
              <ScoreSlider
                key={dim.key}
                label={dim.label}
                guide={dim.guide}
                max={dim.max}
                value={s.reviewerScores[dim.key]}
                onChange={(v) => updateScore(dim.key, v)}
              />
            ))}
          </div>

          <div className="mt-6">
            <DecisionBadge score={totalScore} decision={effectiveDecision} animatedScore={animatedScore} />
          </div>

          <DecisionOverride
            autoDecision={autoDecision}
            override={s.decisionOverride}
            overrideReason={s.overrideReason}
            onOverrideChange={(v) => update("decisionOverride", v)}
            onReasonChange={(v) => update("overrideReason", v)}
            error={errors.overrideReason}
          />

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <FormField label="Reviewer Name" htmlFor="reviewerName"><input id="reviewerName" type="text" value={s.reviewerName} onChange={(e) => update("reviewerName", e.target.value)} className={inputClass} /></FormField>
            <FormField label="Reviewer Title" htmlFor="reviewerTitle"><input id="reviewerTitle" type="text" value={s.reviewerTitle} onChange={(e) => update("reviewerTitle", e.target.value)} className={inputClass} /></FormField>
            <FormField label="Review Date" htmlFor="reviewerDate"><input id="reviewerDate" type="date" value={s.reviewerDate} onChange={(e) => update("reviewerDate", e.target.value)} className={inputClass} /></FormField>
            <FormField label="Supervisor Name" htmlFor="supervisorName"><input id="supervisorName" type="text" value={s.supervisorName} onChange={(e) => update("supervisorName", e.target.value)} className={inputClass} /></FormField>
            <FormField label="Supervisor Date" htmlFor="supervisorDate"><input id="supervisorDate" type="date" value={s.supervisorDate} onChange={(e) => update("supervisorDate", e.target.value)} className={inputClass} /></FormField>
          </div>
        </section>
      </div>
    </StepWrapper>
  );
}
