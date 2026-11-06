// Arabic-Indic (٠-٩) and Extended Arabic-Indic (۰-۹) digits, the Arabic decimal
// separator (٫), the Arabic thousands separator (٬) and the Arabic comma (،),
// which Arabic and Persian phone keypads type in place of 0-9, "." and ",".
const ARABIC_NUMBER_CHARS = /[٠-٩۰-۹٫٬،]/g;

/**
 * The same text with ASCII digits, "." and ",", so "١٢٫٥" reads as 12.5 and a
 * certificate number typed as "ZC-٢٠٢٦-…" matches. Other characters are kept.
 */
export function toAsciiNumber(raw: string): string {
  return raw.replace(ARABIC_NUMBER_CHARS, (char) => {
    const code = char.charCodeAt(0);
    if (code === 0x066b) return ".";
    if (code === 0x066c || code === 0x060c) return ",";
    return String(code - (code >= 0x06f0 ? 0x06f0 : 0x0660));
  });
}
