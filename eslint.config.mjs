import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";

/**
 * Flat ESLint config for the EduKanban monorepo (apps/api + apps/web).
 * Static analysis runs via `npm run lint`. Type checking lives in
 * `npm run typecheck` (tsc --noEmit) so the two concerns stay separate.
 */
export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "**/*.tsbuildinfo",
      "**/*.config.js",
      "**/*.config.ts",
      "**/*.config.mjs",
      "apps/api/prisma/migrations/**",
      "Study_Board/**"
    ]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser
      }
    },
    rules: {
      // Keep stylistic / non-blocking findings as warnings so the static
      // analysis stays informative without breaking the green build.
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }
      ],
      "no-empty": ["warn", { allowEmptyCatch: true }],
      "prefer-const": "warn"
    }
  }
);
