import { defineConfig } from "vitest/config";

/**
 * Unit tests for the app's own logic (`pnpm test`). They run in Node: nothing
 * here needs a browser, the gateway or a running Next server.
 */
export default defineConfig({
  resolve: {
    // "@/lib/..." imports resolve through "paths" in tsconfig.json, as in Next.
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    // Only tests/: the default glob would also pick up the copies of the repo
    // in Claude Code's worktrees under .claude/.
    include: ["tests/**/*.test.ts"],
  },
});
