/**
 * GET /api/zakat/v1/calculator/config exactly as the UAT zakat-engine served
 * it on 6 Nov 2026 (configVersion 2, gold basis). Raw, so tests pass it
 * through readCalculatorConfig like the site does.
 */
export const UAT_CALCULATOR_CONFIG = {
  configVersion: 2,
  pricesAsOf: "2026-11-06T03:00:01Z",
  priceSource: "GoldAPI.io + fxapi.app",
  usdEtbRate: 163.377237,
  goldPricePerGramEtb: { "24k": 21332.77, "22k": 19555.03, "21k": 18666.18, "18k": 15999.57, "14k": 12444.12 },
  silverPricePerGramEtb: 272.12,
  nisab: {
    basis: "gold",
    goldGrams: 85,
    silverGrams: 595,
    valueEtb: 1813285.45,
    goldValueEtb: 1813285.45,
    silverValueEtb: 161911.4,
  },
  wealth: { rate: 0.025, hawlLunarDays: 354 },
  crops: { nisabKg: 653, rainFedRate: 0.1, irrigatedRate: 0.05 },
  livestock: {
    sheepGoats: [
      { min: 40, max: 120, due: "1 sheep", dueItems: [{ kind: "sheep", count: 1 }] },
      { min: 121, max: 200, due: "2 sheep", dueItems: [{ kind: "sheep", count: 2 }] },
      { min: 201, max: 300, due: "3 sheep", dueItems: [{ kind: "sheep", count: 3 }] },
      { min: 301, due: "1 sheep per 100", perHundred: 1 },
    ],
    cattle: { minimum: 30, tabiPer: 30, musinnahPer: 40 },
    camels: [
      { min: 5, max: 9, due: "1 sheep", dueItems: [{ kind: "sheep", count: 1 }] },
      { min: 10, max: 14, due: "2 sheep", dueItems: [{ kind: "sheep", count: 2 }] },
      { min: 15, max: 19, due: "3 sheep", dueItems: [{ kind: "sheep", count: 3 }] },
      { min: 20, max: 24, due: "4 sheep", dueItems: [{ kind: "sheep", count: 4 }] },
      { min: 25, max: 35, due: "1 bint makhad", dueItems: [{ kind: "bint_makhad", count: 1 }] },
      { min: 36, max: 45, due: "1 bint labun", dueItems: [{ kind: "bint_labun", count: 1 }] },
      { min: 46, max: 60, due: "1 hiqqah", dueItems: [{ kind: "hiqqah", count: 1 }] },
      { min: 61, max: 75, due: "1 jadha'ah", dueItems: [{ kind: "jadhaah", count: 1 }] },
      { min: 76, max: 90, due: "2 bint labun", dueItems: [{ kind: "bint_labun", count: 2 }] },
      { min: 91, max: 120, due: "2 hiqqah", dueItems: [{ kind: "hiqqah", count: 2 }] },
      { min: 121, due: "1 bint labun per 40 and 1 hiqqah per 50", bintLabunPer: 40, hiqqahPer: 50 },
    ],
  },
  livestockAverageUnitPriceEtb: { goat: 7000, camel: 180000, sheep: 9000, cattle: 60000 },
};
