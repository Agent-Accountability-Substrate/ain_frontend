import mdx from "@mdx-js/rollup";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    // Ahead of `react()`, so `.mdx` is compiled to JSX before the React plugin
    // is asked to transform it. Vitest does not go through the Next loader, so
    // without this every post import fails to resolve.
    //
    // This compiles the same files the build does, but it does not inject
    // `src/mdx-components.tsx` the way `@next/mdx` does: a post rendered in a
    // test emits bare `<h2>` and `<p>`. Tests assert the semantics; the class
    // map has its own test.
    { enforce: "pre", ...mdx() },
    react(),
    tsconfigPaths(),
  ],
  resolve: {
    alias: {
      // See test/stubs/server-only.ts — Next resolves this internally and
      // discards the package body; only Vitest needs something to import.
      "server-only": fileURLToPath(
        new URL("./test/stubs/server-only.ts", import.meta.url),
      ),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/app/layout.tsx",
        // Renders to a PNG through next/og, so there is nothing jsdom can
        // assert. Verified by `next build`, which prerenders it.
        "src/app/opengraph-image.tsx",
        "src/instrumentation.ts",
        "src/instrumentation-client.ts",
        // Auth.js framework glue — verified by the manual "invited user logs
        // in" exit test, not unit tests (the tested logic lives in the
        // dashboard / sign-in / sign-out components).
        "src/auth.ts",
        "src/proxy.ts",
        "src/domains/auth/auth-actions.ts",
        "src/app/api/**",
        "src/app/dashboard/**",
        // Vendored shadcn primitives, written by the CLI rather than by us —
        // `components.json` points it at this path. Third-party source has no
        // business failing our own coverage gate.
        "src/lib/ui/**",
        "src/**/*.test.{ts,tsx}",
      ],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 90,
        statements: 90,
      },
    },
  },
});
