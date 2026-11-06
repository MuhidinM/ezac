import type { CalculatorConfig } from "@/lib/zakat/calculator-config";

/**
 * The livestock tables exactly as the UAT zakat-engine served them on
 * 6 Nov 2026 (GET /api/zakat/v1/calculator/config, configVersion 2). They
 * follow "docs/Detailed Zakat Rules Guide.md" section 6 and, above its brief
 * camel rows, the Abu Bakr letter (Sahih al-Bukhari 1454) it cites.
 */
export const UAT_LIVESTOCK: CalculatorConfig["livestock"] = {
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
};
