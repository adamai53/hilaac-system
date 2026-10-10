import path from "node:path";
import js from "@eslint/js";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import prettier from "eslint-config-prettier/flat";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

const WEB_FILES = ["apps/web/**/*.{ts,tsx}"];
const APP_FILES = ["apps/**/*.{ts,tsx}"];

export default defineConfig(
  globalIgnores([
    "**/node_modules/",
    "**/.next/",
    "**/.turbo/",
    "**/dist/",
    "**/next-env.d.ts",
    "**/playwright-report/",
    "**/test-results/",
    "packages/db/migrations/",
  ]),

  js.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      globals: globals.node,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": "error",
    },
  },
  {
    files: ["**/*.mjs"],
    extends: [tseslint.configs.disableTypeChecked],
  },
  // Composants copiés par la CLI shadcn : non modifiés, pour rester mis à jour par `shadcn add`.
  {
    files: ["apps/web/src/components/ui/**"],
    extends: [tseslint.configs.disableTypeChecked],
  },

  ...nextCoreWebVitals.map((config) => ({ ...config, files: WEB_FILES })),
  {
    files: WEB_FILES,
    settings: { next: { rootDir: path.join(import.meta.dirname, "apps/web") } },
  },

  // Frontière : aucun accès direct à la base dans apps/* — tout passe par @hilaac/db.
  {
    files: APP_FILES,
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["drizzle-orm", "drizzle-orm/*", "postgres", "pg"],
              message:
                "Accès base interdit dans apps/* : passer par @hilaac/db.",
            },
          ],
        },
      ],
    },
  },

  // Frontière : apps/web ne sort jamais vers l'extérieur — il écrit en base et met en file.
  {
    files: ["apps/web/src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-globals": [
        "error",
        {
          name: "fetch",
          message:
            "apps/web n'appelle aucune API externe : déposer un job pour apps/worker.",
        },
      ],
    },
  },

  prettier,
);
