import { fileURLToPath } from "node:url";
import { defineConfig, UserWorkspaceConfig } from "vitest/config";
import { envConfig } from "./vite-plugins/env-config";
import solidPlugin from "vite-plugin-solid";

// vite-plugin-solid adds jest-dom's setup file by its bare name, and vitest
// resolves that from the directory above the root. In a worktree nested in
// the main checkout that is the checkout's copy, which vite will not serve.
// A resolved path here stops the plugin from adding its own.
const jestDom = fileURLToPath(
  import.meta.resolve("@testing-library/jest-dom/vitest"),
);

const plugins = [
  envConfig({ isDevelopment: true, clientVersion: "TESTING" }),
  solidPlugin({ hot: false }),
];

const ssr = { noExternal: ["@solidjs/meta"] };

export const projects: UserWorkspaceConfig[] = [
  {
    ssr,
    test: {
      name: { label: "unit", color: "blue" },
      include: ["__tests__/**/*.spec.ts"],
      exclude: ["__tests__/**/*.dom-spec.ts"],
      environment: "happy-dom",
      globalSetup: "__tests__/global-setup.ts",
      setupFiles: [
        jestDom,
        "__tests__/__harness__/mock-dom.ts",
        "__tests__/__harness__/mock-static.ts",
      ],
    },
    plugins,
  },
  {
    ssr,
    test: {
      name: { label: "dom", color: "yellow" },
      include: ["__tests__/**/*.dom-spec.ts"],
      environment: "happy-dom",
      globalSetup: "__tests__/global-setup.ts",
      setupFiles: [jestDom],
    },
    plugins,
  },
  {
    ssr,
    test: {
      name: { label: "jsx", color: "green" },
      include: ["__tests__/**/*.spec.tsx"],
      environment: "happy-dom",
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
