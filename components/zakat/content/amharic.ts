/** Amharic text fields on causes, stories and regions: optional, with English shown where they are empty. */

export const AMHARIC_TITLE = "Amharic (optional)";
export const AMHARIC_HINT = "Shown when the app or website is in Amharic. Leave a field empty to show the English text.";

/** Props for an Amharic input: the browser picks the text direction and fonts know the language. */
export const AMHARIC_INPUT = { lang: "am", dir: "auto" } as const;
