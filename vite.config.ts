import { paraglideVitePlugin } from "@inlang/paraglide-js";
import { defineConfig, lazyPlugins } from "vite-plus";
import react from "@vitejs/plugin-react";
import stylex from "@stylexjs/unplugin";
import path from "node:path";
import unfonts from "unplugin-fonts/vite";
import { PARAGLIDE_OUTDIR_PATH, PARAGLIDE_PROJECT_PATH } from "./scripts/build-translations";
import { prerender } from "./scripts/prerender";

const isDev = process.env.NODE_ENV === "development";

export default defineConfig({
  run: {
    tasks: {
      "build:translations": {
        command: "node ./scripts/build-translations.ts",
        input: [
          "package.json",
          "./project.inlang/settings.json",
          "./messages/*.json",
          "./src/paraglide",
          "./scripts/build-translations.ts",
        ],
      },
    },
  },
  plugins: lazyPlugins(() => [
    isDev
      ? paraglideVitePlugin({ project: PARAGLIDE_PROJECT_PATH, outdir: PARAGLIDE_OUTDIR_PATH })
      : undefined,
    react(),
    stylex.vite({
      useCSSLayers: true,
    }),
    unfonts({
      inlineFontFace: true,
      fontsource: {
        families: ["Figtree"],
      },
    }),
    prerender(),
  ]),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  fmt: {},
  lint: {
    plugins: ["react", "typescript", "oxc"],
    jsPlugins: [
      { name: "vite-plus", specifier: "vite-plus/oxlint-plugin" },
      { name: "anti-slop", specifier: "./oxlint/anti-slop/index.ts" },
    ],
    ignorePatterns: ["/node_modules/**/*", "oxlint/**/*"],
    rules: {
      "vite-plus/prefer-vite-plus-imports": "error",
      "react/rules-of-hooks": "error",
      "react/only-export-components": ["warn", { allowConstantExport: true }],
      "anti-slop/no-chained-type-assertions": "error",
      "anti-slop/no-conditional-empty-object-spread": "error",
      "anti-slop/no-known-value-widening": "error",
      "anti-slop/no-module-mocking": "error",
      "anti-slop/no-object-parameters": "error",
      "anti-slop/no-reflect-apply": "error",
      "anti-slop/no-reflect-get": "error",
      "anti-slop/no-runtime-typeof": "error",
      "anti-slop/no-shape-in-symbol-names": "error",
      "anti-slop/no-unknown-parameters": "error",
      "anti-slop/no-unknown-returns": "error",
      "anti-slop/no-unknown-type-aliases": "error",
      "anti-slop/no-unsafe-dictionary-type": "error",
      "anti-slop/no-widen-then-assert": "error",
      "anti-slop/require-safety-comment-for-type-assertion": "error",
    },
    options: { typeAware: true, typeCheck: true },
  },
});
