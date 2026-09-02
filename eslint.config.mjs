import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * Import patterns, declared once.
 *
 * Flat config replaces a rule outright rather than merging it, so any block
 * that sets `no-restricted-imports` must restate every pattern that should
 * still apply there. Compose them from these constants — a block that spells
 * its patterns out inline switches off whatever an earlier block set.
 */
const NO_PARENT_RELATIVE = {
  regex: "^\\.\\./",
  message: "No parent-relative imports — use the @/* alias.",
};

const NO_APP_IMPORTS = {
  group: ["@/app/*", "@/app/**"],
  message:
    "App Router files are entry points only — logic must not import back into them.",
};

const NO_MARKETING_IMPORTS = {
  group: ["@/domains/marketing/*"],
  message:
    "marketing/ is a leaf surface — nothing imports out of it. Shared chrome belongs in lib/brand.",
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Only src/lib/logger.ts may touch console (single sanctioned disable there).
      "no-console": "error",
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              regex: "^\\.\\./",
              message: "No parent-relative imports — use the @/* alias.",
            },
          ],
        },
      ],
    },
  },
  // ── Boundaries ─────────────────────────────────────────────────────────
  // Infrastructure carries no feature knowledge, the public page is a leaf,
  // and route files are entry points. Sideways imports between domains are
  // invisible in review, so they are checked here instead.
  {
    files: ["src/domains/**/*.{ts,tsx}", "src/lib/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        { patterns: [NO_PARENT_RELATIVE, NO_APP_IMPORTS] },
      ],
    },
  },
  {
    // The public landing page is a leaf: nothing behind a session reaches into
    // it. Restates the two above because this block replaces them.
    files: ["src/domains/**/*.{ts,tsx}"],
    ignores: ["src/domains/marketing/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [NO_PARENT_RELATIVE, NO_APP_IMPORTS, NO_MARKETING_IMPORTS],
        },
      ],
    },
  },
  {
    // A different rule name, so this composes with the blocks above rather
    // than replacing them.
    files: ["src/lib/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/domains/*", "@/domains/**"],
              // Type-only is deliberate: the registry client returns domain
              // shapes and those imports vanish at compile time. A value
              // import would make infrastructure depend on a feature.
              allowTypeImports: true,
              message:
                "lib/ is infrastructure — domains depend on it, never the reverse. Type-only imports are allowed.",
            },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generated output that must not be linted:
    "coverage/**",
    "node_modules/**",
  ]),
]);

export default eslintConfig;
