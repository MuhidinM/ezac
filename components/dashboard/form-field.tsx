"use client";

import { type ReactNode, useId } from "react";

import { Label } from "@/components/ui/label";
import { FieldContext, type FieldContextValue, type FieldControlProps } from "@/components/ui/field-context";
import { cn } from "@/lib/utils";

/** What a render-function child receives: spread it on a custom control. */
export type FormFieldControl = Required<Pick<FieldControlProps, "id">> &
  Pick<FieldControlProps, "aria-describedby" | "aria-invalid" | "aria-required"> & {
    /** Id of the label, for a control that needs aria-labelledby (radio group, combobox). */
    labelId: string;
  };

/**
 * Label + control + hint/error, used by every dashboard form.
 *
 * Input, Textarea and NativeSelect inside it are wired automatically: they
 * get the label's id (unless they have their own id or aria-label), the
 * hint/error in aria-describedby, aria-invalid when there is an error and
 * aria-required when the field is required. For any other control, pass a
 * function as children and spread what it receives:
 *
 *   <FormField label="Evidence" error={errors.files}>
 *     {(control) => <input type="file" {...control} />}
 *   </FormField>
 */
export function FormField({
  label,
  htmlFor,
  required,
  hint,
  error,
  children,
  className,
}: {
  label: ReactNode;
  /** The control's own id, when the form sets one; otherwise one is generated. */
  htmlFor?: string;
  required?: boolean;
  hint?: ReactNode;
  error?: ReactNode;
  children: ReactNode | ((control: FormFieldControl) => ReactNode);
  className?: string;
}) {
  const generated = useId();
  const controlId = htmlFor ?? `${generated}-control`;
  const labelId = `${generated}-label`;
  const messageId = `${generated}-message`;
  const hasError = error !== undefined && error !== null && error !== false && error !== "";
  const hasHint = !hasError && hint !== undefined && hint !== null && hint !== false && hint !== "";

  const field: FieldContextValue = {
    controlId,
    callerOwnsId: htmlFor !== undefined,
    labelId,
    describedBy: hasError || hasHint ? messageId : undefined,
    invalid: hasError,
    required: Boolean(required),
  };

  const content =
    typeof children === "function"
      ? children({
          id: controlId,
          labelId,
          "aria-describedby": field.describedBy,
          "aria-invalid": hasError ? true : undefined,
          "aria-required": required ? true : undefined,
        })
      : children;

  return (
    <div className={cn("space-y-1.5", className)}>
      <Label id={labelId} htmlFor={controlId} className="text-[13px] text-navy">
        {label}
        {/* The control carries aria-required; the star is for sighted users. */}
        {required ? <span aria-hidden="true" className="text-rose-600">*</span> : null}
      </Label>
      <FieldContext.Provider value={field}>{content}</FieldContext.Provider>
      {hasError ? (
        <p id={messageId} className="text-xs text-rose-700">
          {error}
        </p>
      ) : hasHint ? (
        <p id={messageId} className="text-xs text-black/60">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
