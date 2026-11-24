"use client";

import { CROP_PRICE_MAX } from "@/app/(portal)/dashboard/zakat/prices/price-update";
import { UnitPricesPanel, type UnitPricesSpec } from "@/components/zakat/unit-prices-panel";
import { COMMON_CROPS, CROP_GROUPS, CROPS, type CropGroup } from "@/lib/zakat/crops";

const GROUP_TITLE: Record<CropGroup, string> = {
  cereals: "Cereals",
  pulses: "Pulses (beans and peas)",
  oilseeds: "Oilseeds",
  cash: "Coffee, khat and other cash crops",
  roots: "Roots and tubers",
  vegetables: "Vegetables",
  fruits: "Fruits",
  spices: "Spices",
  other: "Other",
};

const label = (key: string) => CROPS.find((crop) => crop.key === key)?.name.en ?? key;

const SPEC: UnitPricesSpec = {
  title: "Crop prices",
  description:
    "Average price per kilogram. Crop Zakat is due in the harvest; the public calculator shows what it is worth in cash at these prices, and visitors can change them to their local price. A crop with no price is shown without a cash value.",
  base: "/bff/zakat-admin/crop-prices",
  historyParam: "crop",
  readRow: (row) =>
    typeof row.crop === "string" && typeof row.enteredAt === "string"
      ? {
          key: row.crop,
          price: typeof row.unitPriceEtbPerKg === "number" ? row.unitPriceEtbPerKg : null,
          enteredBy: typeof row.enteredBy === "string" ? row.enteredBy : null,
          enteredByName: typeof row.enteredByName === "string" ? row.enteredByName : null,
          enteredAt: row.enteredAt,
        }
      : null,
  groups: [
    {
      title: "Most common",
      description: "The crops most farmers grow. Every other crop is in the groups below.",
      items: COMMON_CROPS.map((key) => ({ key, label: label(key) })),
    },
    ...CROP_GROUPS.map((group) => ({
      title: GROUP_TITLE[group],
      collapsible: true,
      items: CROPS.filter((crop) => crop.group === group && !COMMON_CROPS.includes(crop.key)).map((crop) => ({
        key: crop.key,
        label: crop.name.en,
      })),
    })).filter((group) => group.items.length > 0),
  ],
  unit: "per kg",
  max: CROP_PRICE_MAX,
  withdraw: true,
  keepHint: "Change only what you need; the other crops keep their price.",
  allLabel: "All crops",
  filterLabel: "Crop",
};

/** Crop prices (A1), in ETB per kg, for the 71 crops the calculator lists. */
export function CropPricesPanel() {
  return <UnitPricesPanel spec={SPEC} />;
}
