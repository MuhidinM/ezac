"use client";

import { type AriaAttributes, createContext, useContext } from "react";

/**
 * What a FormField (components/dashboard/form-field.tsx) tells the control
 * inside it, so the label, hint, error and required state reach assistive
 * technology without each form wiring ids by hand.
 */
export type FieldContextValue = {
  /** The id the field's <label htmlFor> points at. */
  controlId: string;
  /** True when the caller passed htmlFor, i.e. it puts that id on the control itself. */
  callerOwnsId: boolean;
  /** Id of the visible label, for controls that are not <input>/<select>/<textarea> (aria-labelledby). */
  labelId: string;
  /** Id of the hint or error shown under the control, if any. */
  describedBy: string | undefined;
  invalid: boolean;
  required: boolean;
};

export const FieldContext = createContext<FieldContextValue | null>(null);

/** The a11y props a field hands to its control. */
export type FieldControlProps = {
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: AriaAttributes["aria-invalid"];
  "aria-required"?: AriaAttributes["aria-required"];
  "aria-label"?: string;
  "aria-labelledby"?: string;
  required?: boolean;
};

function join(...ids: (string | undefined)[]) {
  const list = ids.flatMap((id) => (id ? id.split(/\s+/) : [])).filter(Boolean);
  return list.length > 0 ? Array.from(new Set(list)).join(" ") : undefined;
}

/**
 * Merge the surrounding FormField's wiring into a control's own props: its
 * hint/error id goes into aria-describedby, an error sets aria-invalid and a
 * required field sets aria-required. Props the control already sets win.
 *
 * The field's id goes only to a control that has no id and no aria-label of
 * its own, so in a field with several controls (date from/to) the extra ones
 * keep their own aria-label and ids never repeat. Outside a FormField the
 * props come back unchanged.
 */
export function useFieldControl<P extends FieldControlProps>(props: P): P {
  const field = useContext(FieldContext);
  if (!field) return props;

  const ownsName = Boolean(props.id || props["aria-label"] || props["aria-labelledby"]);
  return {
    ...props,
    id: props.id || (!field.callerOwnsId && !ownsName ? field.controlId : undefined),
    "aria-describedby": join(props["aria-describedby"], field.describedBy),
    "aria-invalid": props["aria-invalid"] ?? (field.invalid ? true : undefined),
    "aria-required": props["aria-required"] ?? (field.required && !props.required ? true : undefined),
  };
}

/** The surrounding field, for custom controls (radio groups, pickers) that wire themselves. */
export function useField(): FieldContextValue | null {
  return useContext(FieldContext);
}
