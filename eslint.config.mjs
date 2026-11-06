import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * eslint-plugin-jsx-a11y comes with eslint-config-next, which registers it but
 * turns on only six of its rules (as warnings). Its own recommended set is
 * applied here, taken from that same plugin instance (pnpm doesn't let this
 * file import the plugin directly, and a second copy would clash).
 */
const nextConfig = nextVitals.find((config) => config.plugins?.["jsx-a11y"]);
const jsxA11yRecommended = nextConfig?.plugins["jsx-a11y"].configs.recommended.rules ?? {};

/**
 * Recommended rules the code broke when they were turned on (6 Nov 2026), as
 * warnings until those places are fixed; then delete the line so the rule is
 * an error. The count is how many findings there were.
 */
const jsxA11yNotYetClean = {
  // 5: chart SVGs (line-chart, score-histogram), navbar, document gallery.
  "jsx-a11y/no-noninteractive-element-interactions": "warn",
  // 3: focusable chart SVGs and the transparency ticker.
  "jsx-a11y/no-noninteractive-tabindex": "warn",
  // 2: document gallery.
  "jsx-a11y/click-events-have-key-events": "warn",
  // 1: document gallery.
  "jsx-a11y/no-static-element-interactions": "warn",
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    name: "ezac/jsx-a11y-recommended",
    files: nextConfig?.files ?? ["**/*.{js,jsx,mjs,ts,tsx,mts,cts}"],
    rules: {
      ...jsxA11yRecommended,
      // Keep Next's option that also checks next/image's <Image>.
      "jsx-a11y/alt-text": ["error", { elements: ["img", "object", "area", 'input[type="image"]'], img: ["Image"] }],
      ...jsxA11yNotYetClean,
    },
  },
  // CommonJS files (the pm2 config) can only load modules with require().
  {
    files: ["**/*.cjs"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generated or not ours: test coverage, and Claude Code's worktrees (full
    // copies of the repo that would double every finding).
    "coverage/**",
    ".claude/**",
  ]),
]);

export default eslintConfig;
