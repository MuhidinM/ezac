import { parseCurrency, sumCurrency } from "./utils";
import type { QuestionnaireState } from "./types";

export type HouseholdAssessmentResult = {
  compositePovertyScore: number;
  recommendedRiskCategory: "high" | "medium" | "low";
  recommendation: "approve" | "conditional" | "defer" | "reject";
  reasonForDecision: string;
  contributingFactors: string[];
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function countTrue(record: Record<string, boolean>): number {
  return Object.values(record).filter(Boolean).length;
}

function yesNoScore(value: string, points: number): number {
  return value === "yes" ? points : 0;
}

function scoreFinancial(state: QuestionnaireState): { score: number; factors: string[] } {
  const factors: string[] = [];
  let score = 0;

  const totalIncome = sumCurrency(state.finance.income);
  const totalExpenditure = sumCurrency(state.finance.expenditure);
  const deficit = totalExpenditure - totalIncome;

  if (deficit > 0) {
    const ratio = totalIncome > 0 ? deficit / totalIncome : 1;
    score += clamp(Math.round(ratio * 25), 5, 25);
    factors.push("Monthly expenditure exceeds income");
  }

  if (totalIncome <= 0) {
    score += 15;
    factors.push("No reported monthly income");
  } else if (totalIncome < 5000) {
    score += 10;
    factors.push("Very low monthly household income");
  }

  const debt = parseCurrency(state.debtVulnerability.outstandingDebtAmount);
  if (debt > 0) {
    score += clamp(Math.round(debt / 10000) * 3, 3, 15);
    factors.push("Outstanding household debt reported");
  }

  const assetCount = countTrue(state.finance.assets);
  if (assetCount <= 1) {
    score += 10;
    factors.push("Very few household assets reported");
  }

  const assetValue = parseCurrency(state.finance.estimatedTotalAssetValue);
  if (assetValue > 0 && assetValue < 10000) {
    score += 5;
    factors.push("Low estimated total asset value");
  }

  return { score: clamp(score, 0, 60), factors };
}

function scoreHousing(state: QuestionnaireState): { score: number; factors: string[] } {
  const factors: string[] = [];
  let score = 0;
  const h = state.housing;

  if (h.housingType === "temporary_shelter") {
    score += 15;
    factors.push("Living in temporary shelter");
  } else if (h.housingType === "borrowed") {
    score += 10;
    factors.push("Borrowed housing arrangement");
  } else if (h.housingType === "rented") {
    score += 5;
  }

  if (h.toiletFacility === "none") {
    score += 10;
    factors.push("No toilet facility");
  }

  if (h.electricity === "none") {
    score += 8;
    factors.push("No electricity access");
  }

  if (h.waterSource === "unprotected_well" || h.waterSource === "river") {
    score += 7;
    factors.push("Unsafe or unprotected water source");
  }

  return { score: clamp(score, 0, 40), factors };
}

function scoreFoodSecurity(state: QuestionnaireState): { score: number; factors: string[] } {
  const factors: string[] = [];
  let score = 0;
  const hf = state.healthFood;

  if (hf.mealsPerDay === "one") {
    score += 15;
    factors.push("Household typically eats one meal per day");
  } else if (hf.mealsPerDay === "two") {
    score += 8;
  }

  if (hf.foodShortagePreviousMonth === "yes") {
    score += 12;
    factors.push("Food shortage in previous month");
  }

  if (hf.skippedMealsDueToLack === "yes") {
    score += 13;
    factors.push("Skipped meals due to lack of food");
  }

  return { score: clamp(score, 0, 40), factors };
}

function scoreHealthEducation(state: QuestionnaireState): { score: number; factors: string[] } {
  const factors: string[] = [];
  let score = 0;
  const hf = state.healthFood;

  score += yesNoScore(hf.chronicIllnessInHousehold, 8);
  if (hf.chronicIllnessInHousehold === "yes") factors.push("Chronic illness in household");

  score += yesNoScore(hf.disabilityInHousehold, 7);
  if (hf.disabilityInHousehold === "yes") factors.push("Disability in household");

  score += yesNoScore(hf.medicalExpensesDifficult, 8);
  if (hf.medicalExpensesDifficult === "yes") factors.push("Medical expenses difficult to afford");

  score += yesNoScore(hf.hasHealthInsurance, 4);
  if (hf.hasHealthInsurance === "no") factors.push("No health insurance");

  if (hf.childrenAttendingSchool === "none") {
    score += 8;
    factors.push("No children attending school");
  } else if (hf.childrenAttendingSchool === "some") {
    score += 4;
    factors.push("Only some children attending school");
  }

  return { score: clamp(score, 0, 30), factors };
}

function scoreVulnerability(state: QuestionnaireState): { score: number; factors: string[] } {
  const factors: string[] = [];
  let score = 0;

  const flagCount = countTrue(state.debtVulnerability.vulnerabilityFlags);
  score += clamp(flagCount * 4, 0, 25);
  if (flagCount > 0) {
    factors.push(`${flagCount} vulnerability flag(s) reported`);
  }

  if (state.household.femaleHeadedHousehold === "yes") {
    score += 5;
    factors.push("Female-headed household");
  }

  const children = Number(state.household.childrenUnder18 || 0);
  const elderly = Number(state.household.olderPersons60Plus || 0);
  const orphans = Number(state.debtVulnerability.vulnerabilityFlags.orphan ? 1 : 0);

  if (children >= 3) {
    score += 5;
    factors.push("Multiple dependent children under 18");
  }

  if (elderly >= 1) {
    score += 5;
    factors.push("Elderly household members (60+)");
  }

  if (orphans) {
    score += 5;
  }

  const disabilityCount = Number(state.household.personsWithDisabilities || 0);
  if (disabilityCount > 0) {
    score += clamp(disabilityCount * 2, 2, 10);
  }

  return { score: clamp(score, 0, 50), factors };
}

function scoreSocialSupport(state: QuestionnaireState): { score: number; factors: string[] } {
  const factors: string[] = [];
  const support = state.debtVulnerability.socialSupport;
  const supportCount = Object.values(support).filter((v) => v === "yes").length;

  let score = 0;
  if (supportCount === 0) {
    score = 20;
    factors.push("No reported social support");
  } else if (supportCount === 1) {
    score = 12;
    factors.push("Limited social support (one source only)");
  } else if (supportCount === 2) {
    score = 6;
  }

  return { score, factors };
}

function scoreAsnaf(state: QuestionnaireState): { score: number; factors: string[] } {
  const factors: string[] = [];
  const asnafCount =
    countTrue({
      poor: state.asnaf.poor,
      needy: state.asnaf.needy,
      debtor: state.asnaf.debtor,
      wayfarer: state.asnaf.wayfarer,
      zakatAdministrator: state.asnaf.zakatAdministrator,
      reconciliationOfHearts: state.asnaf.reconciliationOfHearts,
      fiSabilillah: state.asnaf.fiSabilillah,
      other: state.asnaf.other,
    });

  const score = clamp(asnafCount * 5, 0, 30);
  if (asnafCount > 0) {
    factors.push(`${asnafCount} Zakat eligibility (Asnaf) category(ies) identified`);
  }

  return { score, factors };
}

function getRiskCategory(score: number): "high" | "medium" | "low" {
  if (score >= 180) return "high";
  if (score >= 100) return "medium";
  return "low";
}

function getRecommendation(
  score: number,
): "approve" | "conditional" | "defer" | "reject" {
  if (score >= 200) return "approve";
  if (score >= 150) return "conditional";
  if (score >= 100) return "defer";
  return "reject";
}

function formatRecommendation(label: string): string {
  switch (label) {
    case "approve":
      return "Approve";
    case "conditional":
      return "Conditional Approval";
    case "defer":
      return "Defer";
    case "reject":
      return "Reject";
    default:
      return label;
  }
}

function formatRisk(label: string): string {
  switch (label) {
    case "high":
      return "High Risk";
    case "medium":
      return "Medium Risk";
    case "low":
      return "Low Risk";
    default:
      return label;
  }
}

export function computeHouseholdAssessment(
  state: QuestionnaireState,
): HouseholdAssessmentResult {
  const domains = [
    scoreFinancial(state),
    scoreHousing(state),
    scoreFoodSecurity(state),
    scoreHealthEducation(state),
    scoreVulnerability(state),
    scoreSocialSupport(state),
    scoreAsnaf(state),
  ];

  const compositePovertyScore = clamp(
    domains.reduce((sum, d) => sum + d.score, 0),
    0,
    270,
  );

  const contributingFactors = domains.flatMap((d) => d.factors).slice(0, 8);
  const recommendedRiskCategory = getRiskCategory(compositePovertyScore);
  const recommendation = getRecommendation(compositePovertyScore);

  const reasonForDecision =
    contributingFactors.length > 0
      ? `Automated assessment based on household data: ${contributingFactors.join("; ")}. Composite poverty score ${compositePovertyScore}/270 indicates ${formatRisk(recommendedRiskCategory).toLowerCase()} with recommendation to ${formatRecommendation(recommendation).toLowerCase()}.`
      : `Automated assessment: composite poverty score ${compositePovertyScore}/270 indicates ${formatRisk(recommendedRiskCategory).toLowerCase()} with recommendation to ${formatRecommendation(recommendation).toLowerCase()}.`;

  return {
    compositePovertyScore,
    recommendedRiskCategory,
    recommendation,
    reasonForDecision,
    contributingFactors,
  };
}

export function applyHouseholdAssessment(
  state: QuestionnaireState,
): QuestionnaireState {
  const result = computeHouseholdAssessment(state);
  return {
    ...state,
    officerAssessment: {
      ...state.officerAssessment,
      compositePovertyScore: String(result.compositePovertyScore),
      recommendedRiskCategory: result.recommendedRiskCategory,
      recommendation: result.recommendation,
      reasonForDecision: result.reasonForDecision,
    },
  };
}
