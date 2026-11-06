/**
 * Chart colours for the staff portal. Validated with the data-viz palette
 * checks (lightness band, chroma floor, colour-blind separation of adjacent
 * slots, normal-vision floor) on a white surface:
 *
 * - CATEGORICAL: identity (one colour per series), always assigned in this
 *   order and never by rank, so a series keeps its colour when others are
 *   filtered out. Worst adjacent CVD ΔE 10.0. Slots 4 and 5 are under 3:1
 *   on white, so charts that use them must also print labels or offer the
 *   table view ("Show the numbers").
 * - ORDINAL_GREEN: ordered stages (pipeline, tiers), light to dark brand
 *   green; the lightest step clears 2:1 on white.
 * - NEED: the need-level status colours, the same red / amber / green as the
 *   badges, always shown with a text label.
 */
export const CATEGORICAL = ["#007050", "#eb6834", "#2a78d6", "#eda100", "#6250d6", "#e87ba4"] as const;

export const ORDINAL_GREEN = ["#6cbf9c", "#3fa37c", "#168761", "#007050", "#005840"] as const;

export const NEED = { HIGH: "#e11d48", MEDIUM: "#d97706", LOW: "#059669" } as const;

/** Light washes of the need colours, for bands drawn behind other marks. */
export const NEED_WASH = { HIGH: "#fde4e9", MEDIUM: "#fdeccf", LOW: "#d9f3e8" } as const;

/** A recessive grey for context marks (the rest, when one thing is emphasised). */
export const MUTED_MARK = "#c4c9cf";

/** Status colours for states that mean good / waiting / bad, with labels. */
export const STATUS = { good: "#059669", waiting: "#d97706", bad: "#e11d48", neutral: "#94a3b8" } as const;
