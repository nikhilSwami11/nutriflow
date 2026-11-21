import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import boundaries from "eslint-plugin-boundaries";

// Layers: presentation -> view-models -> domain <- data. `app` and `composition`
// are the only places allowed to wire data into the rest.
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "supabase/**", "playwright-report/**", "test-results/**"]),
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { boundaries },
    settings: {
      "boundaries/elements": [
        { type: "app", pattern: "src/app" },
        { type: "composition", pattern: "src/composition" },
        { type: "presentation", pattern: "src/presentation" },
        { type: "view-models", pattern: "src/view-models" },
        { type: "domain", pattern: "src/domain" },
        { type: "data", pattern: "src/data" },
      ],
    },
    rules: {
      "boundaries/dependencies": [
        2,
        {
          default: "disallow",
          policies: [
            { from: { element: { type: "app" } }, allow: { to: { element: { types: ["app", "composition", "presentation"] } } } },
            { from: { element: { type: "composition" } }, allow: { to: { element: { types: ["composition", "data", "domain", "view-models"] } } } },
            { from: { element: { type: "presentation" } }, allow: { to: { element: { types: ["presentation", "view-models"] } } } },
            { from: { element: { type: "view-models" } }, allow: { to: { element: { types: ["view-models", "domain"] } } } },
            { from: { element: { type: "domain" } }, allow: { to: { element: { type: "domain" } } } },
            { from: { element: { type: "data" } }, allow: { to: { element: { types: ["data", "domain"] } } } },
          ],
        },
      ],
    },
  },
  {
    // Domain is pure TypeScript: no framework or SDK imports.
    files: ["src/domain/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        { patterns: ["react", "react-dom", "react/*", "next", "next/*", "@supabase/*", "@tanstack/*", "zustand", "zustand/*"] },
      ],
    },
  },
]);

export default eslintConfig;
