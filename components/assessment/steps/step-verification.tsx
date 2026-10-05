"use client";

import { useState } from "react";
import { LocateFixed } from "lucide-react";

import { DocumentUploader, DocumentsList } from "@/components/assessment/documents-panel";
import {
  ChipGroup,
  FieldSection,
  NumberField,
  TextAreaField,
  YesNoField,
} from "@/components/assessment/fields";
import type { StepProps } from "@/components/assessment/step-props";
import { InlineAlert } from "@/components/dashboard/inline-alert";
import { Button } from "@/components/ui/button";
import type { AssessmentDocument } from "@/lib/api/backoffice-types";
import { VERIFIED_DOCUMENTS } from "@/lib/backoffice/options";

export function StepVerification({
  draft,
  patch,
  errors,
  assessment,
  documents,
  onDocumentUploaded,
}: StepProps & {
  documents: AssessmentDocument[];
  onDocumentUploaded: (document: AssessmentDocument) => void;
}) {
  const observation = draft.observation;
  const verification = draft.verification;
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const photoCount = documents.filter((document) => document.documentType === "photo").length;

  function captureLocation() {
    setGpsError(null);
    if (!("geolocation" in navigator)) {
      setGpsError("This browser can't share its location. Enter the coordinates manually.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        patch("verification", {
          gpsRecorded: true,
          gpsLat: Number(position.coords.latitude.toFixed(6)),
          gpsLng: Number(position.coords.longitude.toFixed(6)),
        });
      },
      (positionError) => {
        setIsLocating(false);
        setGpsError(
          positionError.code === positionError.PERMISSION_DENIED
            ? "Location permission was denied. Allow it in the browser or enter the coordinates manually."
            : "Couldn't get the location. Try again or enter the coordinates manually.",
        );
      },
      { enableHighAccuracy: true, timeout: 15_000 },
    );
  }

  return (
    <div className="space-y-6">
      <FieldSection letter="O" title="Officer observation" description="What you saw during the visit.">
        <div className="grid gap-4 md:grid-cols-2">
          <TextAreaField
            id="obs-housing"
            label="Housing condition"
            value={observation.housingCondition}
            onChange={(value) => patch("observation", { housingCondition: value })}
            error={errors["observation.housingCondition"]}
          />
          <TextAreaField
            id="obs-cleanliness"
            label="Cleanliness"
            value={observation.cleanliness}
            onChange={(value) => patch("observation", { cleanliness: value })}
            error={errors["observation.cleanliness"]}
          />
          <TextAreaField
            id="obs-assets"
            label="Visible assets"
            value={observation.visibleAssets}
            onChange={(value) => patch("observation", { visibleAssets: value })}
            error={errors["observation.visibleAssets"]}
          />
          <TextAreaField
            id="obs-general"
            label="General remarks"
            value={observation.general}
            onChange={(value) => patch("observation", { general: value })}
            error={errors["observation.general"]}
          />
        </div>
      </FieldSection>

      <FieldSection letter="P" title="Verification">
        <div className="space-y-6">
          <ChipGroup
            id="docs-verified"
            label="Documents verified"
            options={VERIFIED_DOCUMENTS}
            value={verification.documentsVerified}
            onChange={(value) => patch("verification", { documentsVerified: value })}
            error={errors["verification.documentsVerified"]}
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <YesNoField
              id="home-visit"
              label="Home visit done"
              hint="Required unless the emergency procedure is used"
              value={verification.homeVisitDone}
              onChange={(value) => patch("verification", { homeVisitDone: value })}
              error={errors["verification.homeVisitDone"]}
              required
            />
            <YesNoField
              id="community"
              label="Community verification done"
              value={verification.communityVerificationDone}
              onChange={(value) => patch("verification", { communityVerificationDone: value })}
              error={errors["verification.communityVerificationDone"]}
              required
            />
            <YesNoField
              id="emergency"
              label="Emergency procedure"
              value={verification.emergencyProcedure}
              onChange={(value) =>
                patch("verification", {
                  emergencyProcedure: value,
                  emergencyReason: value ? verification.emergencyReason : null,
                })
              }
              error={errors["verification.emergencyProcedure"]}
            />
          </div>
          {verification.emergencyProcedure ? (
            <TextAreaField
              id="emergency-reason"
              label="Emergency reason"
              value={verification.emergencyReason}
              onChange={(value) => patch("verification", { emergencyReason: value })}
              error={errors["verification.emergencyReason"]}
              required
            />
          ) : null}

          <div className="space-y-3 rounded-lg border border-black/[0.06] p-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <YesNoField
                id="gps"
                label="GPS location recorded"
                value={verification.gpsRecorded}
                onChange={(value) =>
                  patch("verification", {
                    gpsRecorded: value,
                    ...(value ? {} : { gpsLat: null, gpsLng: null }),
                  })
                }
                error={errors["verification.gpsRecorded"]}
                required
              />
              <Button type="button" variant="outline" onClick={captureLocation} disabled={isLocating}>
                <LocateFixed />
                {isLocating ? "Locating…" : "Use current location"}
              </Button>
            </div>
            {gpsError ? <InlineAlert tone="warning">{gpsError}</InlineAlert> : null}
            {verification.gpsRecorded ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <NumberField
                  id="gps-lat"
                  label="Latitude"
                  min={-90}
                  max={90}
                  step={0.000001}
                  value={verification.gpsLat}
                  onChange={(value) => patch("verification", { gpsLat: value })}
                  error={errors["verification.gpsLat"]}
                  required
                />
                <NumberField
                  id="gps-lng"
                  label="Longitude"
                  min={-180}
                  max={180}
                  step={0.000001}
                  value={verification.gpsLng}
                  onChange={(value) => patch("verification", { gpsLng: value })}
                  error={errors["verification.gpsLng"]}
                  required
                />
              </div>
            ) : null}
          </div>

          <div className="space-y-3 rounded-lg border border-black/[0.06] p-4">
            <div className="grid gap-5 sm:grid-cols-2">
              <YesNoField
                id="photos"
                label="Photos taken"
                value={verification.photosTaken}
                onChange={(value) =>
                  patch("verification", {
                    photosTaken: value,
                    photoConsent: value ? verification.photoConsent : null,
                  })
                }
                error={errors["verification.photosTaken"]}
                required
              />
              {verification.photosTaken ? (
                <YesNoField
                  id="photo-consent"
                  label="Household consented to photos"
                  value={verification.photoConsent}
                  onChange={(value) => patch("verification", { photoConsent: value })}
                  error={errors["verification.photoConsent"]}
                  required
                />
              ) : null}
            </div>
            {verification.photosTaken && photoCount === 0 ? (
              <InlineAlert tone="warning">Upload at least one photo below before submitting.</InlineAlert>
            ) : null}
          </div>
        </div>
      </FieldSection>

      <FieldSection
        title="Documents and photos"
        description="Supporting documents, home-visit reports and household photos."
      >
        <div className="space-y-4">
          <DocumentsList assessmentId={assessment.id} documents={documents} />
          <DocumentUploader assessmentId={assessment.id} onUploaded={onDocumentUploaded} />
        </div>
      </FieldSection>
    </div>
  );
}
