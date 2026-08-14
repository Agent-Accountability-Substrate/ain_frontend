import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
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
        "src/components/ui/**",
        "src/instrumentation.ts",
        "src/instrumentation-client.ts",
        // Auth.js framework glue — verified by the manual "invited user logs
        // in" exit test, not unit tests (the tested logic lives in the
        // dashboard / sign-in / sign-out components).
        "src/auth.ts",
        "src/proxy.ts",
        "src/lib/auth-actions.ts",
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
