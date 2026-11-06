/** The choices of a Yes / No field; "auto" lets the backend derive the value. */
export type YesNoChoice = "auto" | "yes" | "no";

/** The selected choice for a value: null is "Auto" when offered, otherwise nothing picked yet. */
export function yesNoChoice(value: boolean | null, hasAuto: boolean): YesNoChoice | null {
  if (value === true) return "yes";
  if (value === false) return "no";
  return hasAuto ? "auto" : null;
}

/** The value a choice stands for. */
export function yesNoValue(choice: YesNoChoice): boolean | null {
  return choice === "yes" ? true : choice === "no" ? false : null;
}
