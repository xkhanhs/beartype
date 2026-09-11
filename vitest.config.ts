import { defineConfig, UserWorkspaceConfig } from "vitest/config";
import { envConfig } from "./vite-plugins/env-config";
import solidPlugin from "vite-plugin-solid";

const plugins = [
  envConfig({ isDevelopment: true, clientVersion: "TESTING" }),
  solidPlugin({ hot: false }),
];

const ssr = (): { noExternal: string[] } => ({ noExternal: ["@solidjs/meta"] });

export const projects: UserWorkspaceConfig[] = [
  {
    ssr: ssr(),
    test: {
      name: { label: "unit", color: "blue" },
      include: ["__tests__/**/*.spec.ts"],
      exclude: ["__tests__/**/*.jsdom-spec.ts"],
      environment: "happy-dom",
      globalSetup: "__tests__/global-setup.ts",
      setupFiles: [
        "__tests__/__harness__/mock-dom.ts",
        "__tests__/__harness__/mock-static.ts",
      ],
    },
    plugins,
  },
  {
    ssr: ssr(),
    test: {
      name: { label: "jsdom", color: "yellow" },
      include: ["__tests__/**/*.jsdom-spec.ts"],
      environment: "jsdom",
      globalSetup: "__tests__/global-setup.ts",
    },
    plugins,
  },
  {
    ssr: ssr(),
    test: {
      name: { label: "jsx", color: "green" },
      include: ["__tests__/**/*.spec.tsx"],
      environment: "jsdom",
      globalSetup: "__tests__/global-setup.ts",
      setupFiles: [
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
