import {
  defineConfig,
  loadEnv,
  UserConfig,
  BuildEnvironmentOptions,
  PluginOption,
  CSSOptions,
} from "vite";
import path from "node:path";
import injectHTML from "vite-plugin-html-inject";
import childProcess from "child_process";
import autoprefixer from "autoprefixer";
import { Fonts } from "./src/ts/constants/fonts";
import { fontawesomeSubset } from "./vite-plugins/fontawesome-subset";
import { envConfig } from "./vite-plugins/env-config";
import { languageHashes } from "./vite-plugins/language-hashes";
import { minifyJson } from "./vite-plugins/minify-json";
import { versionFile } from "./vite-plugins/version-file";
import { oxlintChecker } from "./vite-plugins/oxlint-checker";
import { injectPreload } from "./vite-plugins/inject-preload";
import { ViteMinifyPlugin } from "vite-plugin-minify";
import { KnownFontName } from "./src/ts/schemas/fonts";
import solidPlugin from "vite-plugin-solid";
import tailwindcss from "@tailwindcss/vite";

function getFontsConfig(): string {
  return `\n${Object.keys(Fonts)
    .sort()
    .map((name: string) => {
      const config = Fonts[name as KnownFontName];
      return `"${name.replaceAll("_", " ")}": (
        "src": "${config.fileName}",
        ),`;
    })
    .join("\n")}\n`;
}

function pad(
  numbers: number[],
  maxLength: number,
  fillString: string,
): string[] {
  return numbers.map((number) =>
    number.toString().padStart(maxLength, fillString),
  );
}

function getClientVersion(isDevelopment: boolean): string {
  if (isDevelopment) {
    return "DEVELOPMENT_CLIENT";
  }
  const date = new Date();
  const versionPrefix = pad(
    [date.getFullYear(), date.getMonth() + 1, date.getDate()],
    2,
    "0",
  ).join(".");
  const versionSuffix = pad([date.getHours(), date.getMinutes()], 2, "0").join(
    ".",
  );
  const version = [versionPrefix, versionSuffix].join("_");

  try {
    const commitHash = childProcess
      .execSync("git rev-parse --short HEAD")
      .toString();

    return `${version}_${commitHash}`.replace(/\n/g, "");
  } catch (e) {
    return `${version}_unknown-hash`;
  }
}

/** Enable for font awesome v6 */
/*
function sassList(values) {
  return values.map((it) => `"${it}"`).join(",");
}
*/

function getPlugins({
  isDevelopment,
  env,
}: {
  isDevelopment: boolean;
  env: Record<string, string>;
}): PluginOption[] {
  const clientVersion = getClientVersion(isDevelopment);

  const plugins: PluginOption[] = [
    envConfig({ isDevelopment, clientVersion, env }),
    languageHashes({ skip: isDevelopment }),
    injectHTML() as PluginOption,
    tailwindcss(),

    solidPlugin(),
  ];

  const devPlugins: PluginOption[] = [
    oxlintChecker({
      debounceDelay: 125,
      typeAware: true,
      overlay: isDevelopment,
    }),
  ];

  const prodPlugins: PluginOption[] = [
    fontawesomeSubset(),
    versionFile({ clientVersion }),
    ViteMinifyPlugin(),
    injectPreload(),
    minifyJson(),
  ];

  return [...plugins, ...(isDevelopment ? devPlugins : prodPlugins)].filter(
    (it) => it !== null,
  );
}

function getBuildOptions({
  enableSourceMaps,
}: {
  enableSourceMaps: boolean;
}): BuildEnvironmentOptions {
  return {
    sourcemap: enableSourceMaps,
    emptyOutDir: true,
    outDir: "../dist",
    assetsInlineLimit: 0, //dont inline small files as data
    rolldownOptions: {
      input: {
        monkeytype: path.resolve(__dirname, "src/index.html"),
      },
      output: {
        assetFileNames: (assetInfo) => {
          let extType = (assetInfo.names[0] as string).split(".").at(1);

          if (extType === undefined) {
            throw new Error(
              `Could not determine asset type for asset: ${assetInfo.names[0]}`,
            );
          }

          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            extType = "images";
          }
          if (
            /\.(woff|woff2|eot|ttf|otf)$/.test(assetInfo.names[0] as string)
          ) {
            return `webfonts/[name]-[hash].${extType}`;
          }
          // oxlint-disable-next-line no-deprecated
          if (assetInfo.name === "misc.css") {
            return `${extType}/vendor.[hash][extname]`;
          }

          return `${extType}/[name].[hash][extname]`;
        },
        chunkFileNames: "js/[name].[hash].js",
        entryFileNames: "js/[name].[hash].js",
        codeSplitting: {
          groups: [
            {
              name: "vendor-tanstack",
              test: /node_modules\/@tanstack\//,
            },
            {
              name: "monkeytype-packages",
              test: /monkeytype\/packages\//,
            },
            {
              name: "monkeytype-utils",
              test: /src\/ts\/utils\//,
            },
            {
              // loaded by sound-controller only once a sound is switched on
              name: "vendor-howler",
              test: /node_modules\/howler\//,
            },
            {
              name: "vendor",
              test: /node_modules\//,
            },
          ],
        },
      },
    },
  };
}

function getCssOptions({
  isDevelopment,
}: {
  isDevelopment: boolean;
}): CSSOptions {
  return {
    devSourcemap: true,
    postcss: {
      plugins: [autoprefixer({})],
    },
    preprocessorOptions: {
      scss: {
        additionalData(source: string, fp: string) {
          if (isDevelopment || fp.endsWith("index.scss")) {
            /** Enable for font awesome v6 */
            /*
                const fontawesomeClasses = getFontawesomeConfig();

                //inject variables into sass context
                $fontawesomeBrands: ${sassList(
                  fontawesomeClasses.brands
                )};             
                $fontawesomeSolid: ${sassList(fontawesomeClasses.solid)};
              */

            const bypassFonts = isDevelopment
              ? `
                $fontAwesomeOverride:"@fortawesome/fontawesome-free/webfonts";`
              : "";
            const fonts = `
              ${bypassFonts}
              $fonts: (${getFontsConfig()});
              `;
            return `
              //inject variables into sass context
              ${fonts}
            
              ${source}`;
          } else {
            return source;
          }
        },
      },
    },
  };
}

export default defineConfig(({ mode }): UserConfig => {
  const env = loadEnv(mode, process.cwd(), "");
  const isDevelopment = mode !== "production";

  return {
    plugins: getPlugins({ isDevelopment, env }),
    build: getBuildOptions({ enableSourceMaps: false }),
    css: getCssOptions({ isDevelopment }),
    server: {
      open: env["SERVER_OPEN"] === "true",
      // 3000 on this machine still has a service worker from another app
      // answering out of its cache; a port that never moves is the fix.
      port: 3200,
      strictPort: true,
      host: env["BACKEND_URL"] !== undefined,
      watch: {
        //we rebuild the whole contracts package when a file changes
        //so we only want to watch one file
        ignored: [/.*\/packages\/contracts\/dist\/(?!configs).*/],
      },
    },
    clearScreen: false,
    root: "src",
    publicDir: "../static",
    optimizeDeps: {
      exclude: ["@fortawesome/fontawesome-free"],
    },
  };
});
