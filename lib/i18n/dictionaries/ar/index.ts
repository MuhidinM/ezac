import type { Dictionary } from "../en";
import about from "./about";
import calculator from "./calculator";
import common from "./common";
import giving from "./giving";
import home from "./home";
import transparency from "./transparency";

/**
 * The Arabic dictionary. Each namespace is typed against the English source
 * (Messages<typeof en>), so a missing or extra key fails the type-check.
 * These are machine-assisted drafts: native review notes are in
 * docs/translation-review/ar-*.md (git-ignored).
 */
const ar: Dictionary = { common, home, calculator, about, giving, transparency };

export default ar;
