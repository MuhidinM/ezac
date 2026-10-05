import type { ReactNode } from "react";

import { HouseholdSummaryGrid } from "@/components/assessment/household-summary";
import { DetailList } from "@/components/dashboard/panel";
import { Badge } from "@/components/ui/badge";
import type { Assessment } from "@/lib/api/backoffice-types";
import { draftFromAssessment } from "@/lib/backoffice/assessment-steps";
import { formatDate, formatEtb } from "@/lib/backoffice/format";
import {
  ASNAF,
  ASSETS,
  COOKING_FUEL,
  DEBT_PURPOSES,
  ELECTRICITY_SOURCE,
  FLOOR_TYPE,
  MEALS_PER_DAY,
  NON_ATTENDANCE_REASONS,
  RELATIONSHIP,
  ROOF_TYPE,
  SCHOOL_ATTENDANCE,
  SEX,
  TENURE,
  TOILET_TYPE,
  VERIFIED_DOCUMENTS,
  VULNERABILITIES,
  WALL_TYPE,
  WATER_SOURCE,
  labelFor,
  type Option,
} from "@/lib/backoffice/options";

function yesNo(value: boolean | null | undefined) {
  if (value === null || value === undefined) return null;
  return value ? "Yes" : "No";
}

function list(options: Option[], values: string[] | null | undefined) {
  if (!values || values.length === 0) return null;
  return (
    <span className="flex flex-wrap gap-1">
      {values.map((value) => (
        <Badge key={value} tone="neutral">
          {labelFor(options, value)}
        </Badge>
      ))}
    </span>
  );
}

function withOther(options: Option[], value: string | null, other: string | null) {
  if (!value) return null;
  return value === "other" && other ? `Other: ${other}` : labelFor(options, value);
}

function Block({ letter, title, children }: { letter: string; title: string; children: ReactNode }) {
  return (
    <section className="border-b border-black/[0.06] px-5 py-5 last:border-0">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[#001539]">
        <span className="flex size-6 items-center justify-center rounded bg-black/[0.05] text-xs text-black/60">
          {letter}
        </span>
        {title}
      </h3>
      {children}
    </section>
  );
}

/** Every section of an assessment, read-only. */
export function AssessmentSummary({ assessment }: { assessment: Assessment }) {
  const d = draftFromAssessment(assessment);
  const totals = assessment.totals ?? {};

  return (
    <div>
      <Block letter="A" title="Assessment information">
        <DetailList
          columns={4}
          items={[
            { label: "Assessment date", value: formatDate(d.assessmentInfo.assessmentDate) },
            { label: "Branch", value: assessment.assessmentInfo?.branchName },
            { label: "Officer", value: assessment.assessmentInfo?.officerName },
            { label: "Supervisor", value: assessment.assessmentInfo?.supervisorName },
          ]}
        />
      </Block>

      <Block letter="C" title="Asnaf">
        <DetailList
          columns={2}
          items={[
            { label: "Categories", value: list(ASNAF, d.asnaf.categories) },
            ...(d.asnaf.otherText ? [{ label: "Other", value: d.asnaf.otherText }] : []),
          ]}
        />
      </Block>

      <Block letter="D" title="Household">
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-lg border border-black/[0.06]">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-black/[0.015] text-left text-xs text-black/50">
                <tr>
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Relationship</th>
                  <th className="px-3 py-2 font-medium">Sex</th>
                  <th className="px-3 py-2 font-medium">Age</th>
                  <th className="px-3 py-2 font-medium">Occupation</th>
                  <th className="px-3 py-2 text-right font-medium">Income</th>
                  <th className="px-3 py-2 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {d.household.members.map((member, index) => (
                  <tr key={index} className="border-t border-black/[0.04]">
                    <td className="px-3 py-2 font-medium text-[#001539]">{member.name || "—"}</td>
                    <td className="px-3 py-2">{labelFor(RELATIONSHIP, member.relationship)}</td>
                    <td className="px-3 py-2">{labelFor(SEX, member.sex)}</td>
                    <td className="px-3 py-2 tabular-nums">{member.age ?? "—"}</td>
                    <td className="px-3 py-2">{member.occupation || "—"}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{formatEtb(member.monthlyIncome)}</td>
                    <td className="px-3 py-2 text-xs text-black/55">
                      {[
                        member.hasDisability && "Disability",
                        member.chronicallyIll && "Chronically ill",
                        member.pregnantOrLactating && "Pregnant/lactating",
                        member.attendsSchool && "In school",
                      ]
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <HouseholdSummaryGrid summary={assessment.household?.summary} />
          <DetailList
            columns={2}
            items={[{ label: "Female-headed household", value: yesNo(d.household.femaleHeadedHousehold) ?? "Auto" }]}
          />
        </div>
      </Block>

      <Block letter="E–G" title="Income, expenditure and assets">
        <DetailList
          columns={4}
          items={[
            { label: "Total monthly income", value: formatEtb(totals.totalMonthlyIncome) },
            { label: "Total monthly expenditure", value: formatEtb(totals.totalMonthlyExpenditure) },
            { label: "Members' income", value: formatEtb(totals.membersMonthlyIncome) },
            { label: "Asset value", value: formatEtb(d.assets.estimatedTotalValue) },
            { label: "Assets owned", value: list(ASSETS, d.assets.owned) },
            ...(d.income.otherText ? [{ label: "Other income", value: d.income.otherText }] : []),
            ...(d.expenditure.otherText ? [{ label: "Other spending", value: d.expenditure.otherText }] : []),
            ...(d.assets.otherText ? [{ label: "Other assets", value: d.assets.otherText }] : []),
          ]}
        />
      </Block>

      <Block letter="H" title="Housing">
        <DetailList
          columns={4}
          items={[
            { label: "Tenure", value: d.housing.tenure ? labelFor(TENURE, d.housing.tenure) : null },
            { label: "Rooms", value: d.housing.rooms },
            { label: "Roof", value: withOther(ROOF_TYPE, d.housing.roofType, d.housing.roofOtherText) },
            { label: "Walls", value: withOther(WALL_TYPE, d.housing.wallType, d.housing.wallOtherText) },
            { label: "Floor", value: d.housing.floorType ? labelFor(FLOOR_TYPE, d.housing.floorType) : null },
            { label: "Water", value: withOther(WATER_SOURCE, d.housing.waterSource, d.housing.waterOtherText) },
            { label: "Toilet", value: d.housing.toiletType ? labelFor(TOILET_TYPE, d.housing.toiletType) : null },
            {
              label: "Electricity",
              value: d.housing.electricitySource ? labelFor(ELECTRICITY_SOURCE, d.housing.electricitySource) : null,
            },
            {
              label: "Cooking fuel",
              value: withOther(COOKING_FUEL, d.housing.cookingFuel, d.housing.cookingFuelOtherText),
            },
          ]}
        />
      </Block>

      <Block letter="I–K" title="Food, health and education">
        <DetailList
          columns={4}
          items={[
            {
              label: "Meals per day",
              value: d.foodSecurity.mealsPerDay ? labelFor(MEALS_PER_DAY, d.foodSecurity.mealsPerDay) : null,
            },
            { label: "Food shortage last month", value: yesNo(d.foodSecurity.foodShortageLastMonth) },
            { label: "Skipped meals", value: yesNo(d.foodSecurity.skippedMeals) },
            { label: "Food assistance", value: yesNo(d.foodSecurity.receivedFoodAssistance) },
            { label: "Chronic illness", value: yesNo(d.health.chronicIllness) ?? "Auto" },
            { label: "Disability", value: yesNo(d.health.disability) ?? "Auto" },
            { label: "Medical costs unaffordable", value: yesNo(d.health.medicalExpensesUnaffordable) },
            { label: "Health insurance", value: yesNo(d.health.hasHealthInsurance) },
            {
              label: "School attendance",
              value: d.education.childrenSchoolAttendance
                ? labelFor(SCHOOL_ATTENDANCE, d.education.childrenSchoolAttendance)
                : null,
            },
            { label: "Non-attendance reasons", value: list(NON_ATTENDANCE_REASONS, d.education.nonAttendanceReasons) },
          ]}
        />
      </Block>

      <Block letter="L–N" title="Debt, vulnerability and support">
        <DetailList
          columns={4}
          items={[
            { label: "Outstanding debt", value: formatEtb(d.debt.outstandingDebt) },
            { label: "Debt purposes", value: list(DEBT_PURPOSES, d.debt.purposes) },
            { label: "Vulnerabilities", value: list(VULNERABILITIES, d.vulnerability.vulnerabilities) },
            {
              label: "Support received",
              value:
                [
                  d.socialSupport.government && "Government",
                  d.socialSupport.ngo && "NGO",
                  d.socialSupport.family && "Family",
                  d.socialSupport.mosqueCommunity && "Mosque / community",
                ]
                  .filter(Boolean)
                  .join(", ") || "None",
            },
          ]}
        />
      </Block>

      <Block letter="O–P" title="Observation and verification">
        <DetailList
          columns={2}
          items={[
            { label: "Housing condition", value: d.observation.housingCondition },
            { label: "Cleanliness", value: d.observation.cleanliness },
            { label: "Visible assets", value: d.observation.visibleAssets },
            { label: "General remarks", value: d.observation.general },
            { label: "Documents verified", value: list(VERIFIED_DOCUMENTS, d.verification.documentsVerified) },
            {
              label: "Visit",
              value: d.verification.emergencyProcedure
                ? `Emergency procedure: ${d.verification.emergencyReason ?? "—"}`
                : `Home visit ${yesNo(d.verification.homeVisitDone) === "Yes" ? "done" : "not done"} · community verification ${yesNo(d.verification.communityVerificationDone) === "Yes" ? "done" : "not done"}`,
            },
            {
              label: "GPS",
              value: d.verification.gpsRecorded && d.verification.gpsLat != null
                ? (
                    <a
                      className="text-[#007050] hover:underline"
                      href={`https://www.openstreetmap.org/?mlat=${d.verification.gpsLat}&mlon=${d.verification.gpsLng}#map=17/${d.verification.gpsLat}/${d.verification.gpsLng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {d.verification.gpsLat}, {d.verification.gpsLng}
                    </a>
                  )
                : "Not recorded",
            },
            {
              label: "Photos",
              value: d.verification.photosTaken
                ? `Taken${d.verification.photoConsent ? " with consent" : ""}`
                : "Not taken",
            },
          ]}
        />
      </Block>
    </div>
  );
}
