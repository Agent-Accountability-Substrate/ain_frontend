import mdx from "@mdx-js/rollup";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    // Ahead of `react()`, so `.mdx` is compiled to JSX before the React plugin
    // transforms it. Vitest does not go through the Next loader.
    //
    // `providerImportSource` is what `@next/mdx` sets for the build; without it
    // a post renders bare tags in tests and the class map could be
    // disconnected, or deleted, with the suite still green.
    //
    // `format` pins which extensions count as MDX. Left unset the plugin also
    // claims `.md` and five more, while the build matches `/\.mdx$/` alone.
    {
      enforce: "pre",
      ...mdx({
        format: "mdx",
        providerImportSource: fileURLToPath(
          new URL("./src/mdx-components.tsx", import.meta.url),
        ),
      }),
    },
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
