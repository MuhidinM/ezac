"use client";

import { FieldSection, NumberField, SelectField, TextField } from "@/components/assessment/fields";
import type { StepProps } from "@/components/assessment/step-props";
import {
  COOKING_FUEL,
  ELECTRICITY_SOURCE,
  FLOOR_TYPE,
  ROOF_TYPE,
  TENURE,
  TOILET_TYPE,
  WALL_TYPE,
  WATER_SOURCE,
} from "@/lib/backoffice/options";

export function StepHousing({ draft, patch, errors }: StepProps) {
  const housing = draft.housing;
  const err = (key: string) => errors[`housing.${key}`];

  return (
    <FieldSection letter="H" title="Housing conditions">
      <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
        <SelectField
          id="tenure"
          label="Tenure"
          options={TENURE}
          value={housing.tenure}
          onChange={(value) => patch("housing", { tenure: value })}
          error={err("tenure")}
          required
        />
        <NumberField
          id="rooms"
          label="Number of rooms"
          step={1}
          min={0}
          value={housing.rooms}
          onChange={(value) => patch("housing", { rooms: value })}
          error={err("rooms")}
          required
        />
        <SelectField
          id="floor"
          label="Floor"
          options={FLOOR_TYPE}
          value={housing.floorType}
          onChange={(value) => patch("housing", { floorType: value })}
          error={err("floorType")}
          required
        />

        <WithOther
          selectId="roof"
          label="Roof"
          options={ROOF_TYPE}
          value={housing.roofType}
          otherValue={housing.roofOtherText}
          onChange={(value) =>
            patch("housing", { roofType: value, roofOtherText: value === "other" ? housing.roofOtherText : null })
          }
          onOtherChange={(value) => patch("housing", { roofOtherText: value })}
          error={err("roofType")}
          otherError={err("roofOtherText")}
        />
        <WithOther
          selectId="wall"
          label="Walls"
          options={WALL_TYPE}
          value={housing.wallType}
          otherValue={housing.wallOtherText}
          onChange={(value) =>
            patch("housing", { wallType: value, wallOtherText: value === "other" ? housing.wallOtherText : null })
          }
          onOtherChange={(value) => patch("housing", { wallOtherText: value })}
          error={err("wallType")}
          otherError={err("wallOtherText")}
        />
        <WithOther
          selectId="water"
          label="Water source"
          options={WATER_SOURCE}
          value={housing.waterSource}
          otherValue={housing.waterOtherText}
          onChange={(value) =>
            patch("housing", { waterSource: value, waterOtherText: value === "other" ? housing.waterOtherText : null })
          }
          onOtherChange={(value) => patch("housing", { waterOtherText: value })}
          error={err("waterSource")}
          otherError={err("waterOtherText")}
        />

        <SelectField
          id="toilet"
          label="Toilet"
          options={TOILET_TYPE}
          value={housing.toiletType}
          onChange={(value) => patch("housing", { toiletType: value })}
          error={err("toiletType")}
          required
        />
        <SelectField
          id="electricity"
          label="Electricity"
          options={ELECTRICITY_SOURCE}
          value={housing.electricitySource}
          onChange={(value) => patch("housing", { electricitySource: value })}
          error={err("electricitySource")}
          required
        />
        <WithOther
          selectId="fuel"
          label="Cooking fuel"
          options={COOKING_FUEL}
          value={housing.cookingFuel}
          otherValue={housing.cookingFuelOtherText}
          onChange={(value) =>
            patch("housing", {
              cookingFuel: value,
              cookingFuelOtherText: value === "other" ? housing.cookingFuelOtherText : null,
            })
          }
          onOtherChange={(value) => patch("housing", { cookingFuelOtherText: value })}
          error={err("cookingFuel")}
          otherError={err("cookingFuelOtherText")}
        />
      </div>
    </FieldSection>
  );
}

function WithOther({
  selectId,
  label,
  options,
  value,
  otherValue,
  onChange,
  onOtherChange,
  error,
  otherError,
}: {
  selectId: string;
  label: string;
  options: Parameters<typeof SelectField>[0]["options"];
  value: string | null;
  otherValue: string | null;
  onChange: (value: string | null) => void;
  onOtherChange: (value: string | null) => void;
  error?: string;
  otherError?: string;
}) {
  return (
    <div className="space-y-2">
      <SelectField
        id={selectId}
        label={label}
        options={options}
        value={value}
        onChange={onChange}
        error={error}
        required
      />
      {value === "other" ? (
        <TextField
          id={`${selectId}-other`}
          label={<span className="text-black/60">Specify</span>}
          value={otherValue}
          onChange={onOtherChange}
          error={otherError}
          required
        />
      ) : null}
    </div>
  );
}
