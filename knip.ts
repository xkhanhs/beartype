import type { KnipConfig } from "knip";

// The packages a stylesheet loads.
const STYLE_PACKAGES = /^(normalize\.css|balloon-css|tailwindcss)/;

// Sass and CSS reach those packages through `@import`, which knip does not
// read; hand it the package names. Partials (`"buttons"`, `"./media.scss"`)
// and `sass:` modules are not packages and are left out.
function stylesheetImports(text: string): string {
  return [...text.matchAll(/@(?:import|use|forward)\s+["']([^"']+)["']/g)]
    .map((match) => STYLE_PACKAGES.exec(match[1])?.[1])
    .filter((name) => name !== undefined)
    .map((name) => `import "${name}";`)
    .join("\n");
}

const config: KnipConfig = {
  entry: [
    "scripts/build-vietnamese.ts",
    // loaded by .oxlintrc.json, which knip does not follow
    "oxlint-config/plugins/*.js",
    // the stylesheets, so their package imports are read
    "src/styles/*.{scss,css}",
    "__tests__/**/*.{ts,tsx}",
    "__tests__/__harness__/*.ts",
  ],
  project: [
    "src/**/*.{ts,tsx}",
    "src/styles/*.{scss,css}",
    "scripts/**/*.ts",
    "vite-plugins/**/*.ts",
    "oxlint-config/**/*.js",
  ],
  compilers: {
    scss: stylesheetImports,
    css: stylesheetImports,
  },
};

export default config;
