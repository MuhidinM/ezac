"use client";

import { ANIMALS } from "@/app/(portal)/dashboard/zakat/prices/price-update";
import { UnitPricesPanel, type UnitPricesSpec } from "@/components/zakat/unit-prices-panel";

const items = (group: (typeof ANIMALS)[number]["group"]) =>
  ANIMALS.filter((animal) => animal.group === group).map(({ key, label }) => ({ key, label }));

const SPEC: UnitPricesSpec = {
  title: "Livestock prices",
  description:
    "Livestock Zakat is due in animals. The public calculator shows what the animals due are worth in cash at these prices (visitors can change them to their local price), and the How it works page lists them. Calculator rules versions don't change them.",
  base: "/bff/zakat-admin/livestock-prices",
  historyParam: "animal",
  readRow: (row) =>
    typeof row.animal === "string" && typeof row.enteredAt === "string"
      ? {
          key: row.animal,
          price: typeof row.unitPriceEtb === "number" ? row.unitPriceEtb : null,
          enteredBy: typeof row.enteredBy === "string" ? row.enteredBy : null,
          enteredByName: typeof row.enteredByName === "string" ? row.enteredByName : null,
          enteredAt: row.enteredAt,
        }
      : null,
  groups: [
    {
      title: "Average per animal",
      description: "Used for any animal due that has no price of its own below.",
      items: items("average"),
    },
    {
      title: "Cattle due",
      description: "The calves and cows a cattle herd pays. Empty means the cattle average applies.",
      items: items("cattleDue"),
    },
    {
      title: "Camels due",
      description: "The female camels a camel herd pays, youngest first. Empty means the camel average applies.",
      items: items("camelDue"),
    },
  ],
  ageOrder: [
    ["tabi", "musinnah"],
    ["bint_makhad", "bint_labun", "hiqqah", "jadhaah"],
  ],
  unit: "per animal",
  keepHint: "Change only what you need; the other animals keep their price.",
  allLabel: "All animals",
  filterLabel: "Animal",
};

/** Livestock prices (A2): species averages and each animal that can be due. */
export function LivestockPricesPanel() {
  return <UnitPricesPanel spec={SPEC} />;
}
