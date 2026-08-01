"use client";

import { Home } from "lucide-react";

import { StepWrapper } from "../step-wrapper";
import type { StepProps } from "../types";
import { FormField } from "../ui/form-field";
import { RadioGroup } from "../ui/radio-group";

const inputClass =
  "form-input";

function CardSection({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-black/10 bg-black/[0.02] p-4">
      {children}
    </div>
  );
}

export function Step4Housing({ state, setState }: StepProps) {
  const { housing } = state;

  function update(field: keyof typeof housing, value: string) {
    setState((prev) => ({
      ...prev,
      housing: { ...prev.housing, [field]: value },
    }));
  }

  return (
    <StepWrapper
      title="Where and how do they live?"
      description="Describe housing type and living conditions."
      icon={Home}
    >
      <div className="space-y-4">
        <CardSection>
          <RadioGroup
            name="housingType"
            label="Housing Type"
            value={housing.housingType}
            onChange={(v) => update("housingType", v)}
            options={[
              { value: "owned", label: "Owned" },
              { value: "rented", label: "Rented" },
              { value: "borrowed", label: "Borrowed" },
              { value: "temporary_shelter", label: "Temporary Shelter" },
            ]}
          />
        </CardSection>

        <CardSection>
          <RadioGroup
            name="roofMaterial"
            label="Roof Material"
            value={housing.roofMaterial}
            onChange={(v) => update("roofMaterial", v)}
            options={[
              { value: "iron_sheet", label: "Iron Sheet" },
              { value: "thatch", label: "Thatch" },
              { value: "plastic", label: "Plastic" },
              { value: "other", label: "Other" },
            ]}
          />
        </CardSection>

        <CardSection>
          <RadioGroup
            name="wallMaterial"
            label="Wall Material"
            value={housing.wallMaterial}
            onChange={(v) => update("wallMaterial", v)}
            options={[
              { value: "concrete", label: "Concrete" },
              { value: "wood", label: "Wood" },
              { value: "mud", label: "Mud" },
              { value: "other", label: "Other" },
            ]}
          />
        </CardSection>

        <CardSection>
          <RadioGroup
            name="floorMaterial"
            label="Floor Material"
            value={housing.floorMaterial}
            onChange={(v) => update("floorMaterial", v)}
            options={[
              { value: "cement", label: "Cement" },
              { value: "earth", label: "Earth" },
              { value: "tile", label: "Tile" },
            ]}
          />
        </CardSection>

        <CardSection>
          <FormField label="Number of Rooms" htmlFor="numberOfRooms">
            <input
              id="numberOfRooms"
              type="number"
              min={0}
              value={housing.numberOfRooms}
              onChange={(e) => update("numberOfRooms", e.target.value)}
              className={inputClass}
            />
          </FormField>
        </CardSection>

        <CardSection>
          <RadioGroup
            name="waterSource"
            label="Water Source"
            value={housing.waterSource}
            onChange={(v) => update("waterSource", v)}
            options={[
              { value: "piped", label: "Piped" },
              { value: "protected_well", label: "Protected Well" },
              { value: "unprotected_well", label: "Unprotected Well" },
              { value: "river", label: "River" },
              { value: "other", label: "Other" },
            ]}
          />
        </CardSection>

        <CardSection>
          <RadioGroup
            name="toiletFacility"
            label="Toilet Facility"
            value={housing.toiletFacility}
            onChange={(v) => update("toiletFacility", v)}
            options={[
              { value: "flush", label: "Flush" },
              { value: "pit_latrine", label: "Pit Latrine" },
              { value: "none", label: "None" },
            ]}
          />
        </CardSection>

        <CardSection>
          <RadioGroup
            name="electricity"
            label="Electricity"
            value={housing.electricity}
            onChange={(v) => update("electricity", v)}
            options={[
              { value: "grid", label: "Grid" },
              { value: "solar", label: "Solar" },
              { value: "generator", label: "Generator" },
              { value: "none", label: "None" },
            ]}
          />
        </CardSection>

        <CardSection>
          <RadioGroup
            name="cookingFuel"
            label="Cooking Fuel"
            value={housing.cookingFuel}
            onChange={(v) => update("cookingFuel", v)}
            options={[
              { value: "electricity", label: "Electricity" },
              { value: "gas", label: "Gas" },
              { value: "charcoal", label: "Charcoal" },
              { value: "firewood", label: "Firewood" },
              { value: "other", label: "Other" },
            ]}
          />
        </CardSection>
      </div>
    </StepWrapper>
  );
}
