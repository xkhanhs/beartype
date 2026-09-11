import { defineConfig, UserWorkspaceConfig } from "vitest/config";
import { languageHashes } from "./vite-plugins/language-hashes";
import { envConfig } from "./vite-plugins/env-config";
import solidPlugin from "vite-plugin-solid";
import { fileURLToPath } from "node:url";

// vite-plugin-solid adds jest-dom's setup file by its bare name, and vitest
// resolves that from the directory above the root. In a worktree nested in
// the main checkout that is the checkout's copy, which vite will not serve.
// A resolved path here stops the plugin from adding its own.
const jestDom = fileURLToPath(
  import.meta.resolve("@testing-library/jest-dom/vitest"),
);

const plugins = [
  languageHashes({ skip: true }),
  envConfig({ isDevelopment: true, clientVersion: "TESTING", env: {} }),
  solidPlugin({ hot: false }),
];

const tanstackSolidNoExternal: (string | RegExp)[] = [
  "@solidjs/meta",
  /@tanstack\/solid-.*/,
];

export const projects: UserWorkspaceConfig[] = [
  {
    ssr: {
      noExternal: tanstackSolidNoExternal,
    },
    test: {
      name: { label: "unit", color: "blue" },
      include: ["__tests__/**/*.spec.ts"],
      exclude: ["__tests__/**/*.jsdom-spec.ts"],
      environment: "happy-dom",
      globalSetup: "__tests__/global-setup.ts",
      setupFiles: [
        jestDom,
        "__tests__/__harness__/mock-dom.ts",
        "__tests__/__harness__/mock-env-config.ts",
        "__tests__/__harness__/mock-static.ts",
      ],
    },
    plugins,
  },
  {
    ssr: {
      noExternal: tanstackSolidNoExternal,
    },
    test: {
      name: { label: "jsdom", color: "yellow" },
      include: ["__tests__/**/*.jsdom-spec.ts"],
      environment: "jsdom",
      globalSetup: "__tests__/global-setup.ts",
      setupFiles: [jestDom],
    },
    plugins,
  },
  {
    ssr: {
      noExternal: tanstackSolidNoExternal,
    },
    test: {
      name: { label: "jsx", color: "green" },
      include: ["__tests__/**/*.spec.tsx"],
      environment: "jsdom",
      globalSetup: "__tests__/global-setup.ts",
      setupFiles: [
        jestDom,
        "__tests__/__harness__/setup-jsx.ts",
        "__tests__/__harness__/mock-dom.ts",
      ],
      globals: true,
    },
    plugins,
  },
];
export default defineConfig({
  test: {
    projects: projects,
    coverage: {
      include: ["**/*.ts", "**/*.tsx"],
    },
  },
  plugins,
});
