import { describe, it, expect } from "vitest";
import { getDefaultConfig } from "../../src/ts/constants/default-config";
import { migrateConfig } from "../../src/ts/config/utils";
import { PartialConfig } from "../../src/ts/schemas/configs";

const defaultConfig = getDefaultConfig();

describe("config.ts", () => {
  describe("migrateConfig", () => {
    it("should carry over properties from the default config", () => {
      const partialConfig = {} as PartialConfig;

      const result = migrateConfig(partialConfig);
      expect(result).toEqual(expect.objectContaining(getDefaultConfig()));
      for (const [key, value] of Object.entries(getDefaultConfig())) {
        expect(result).toHaveProperty(key, value);
      }
    });
    it("should not merge properties which are not in the default config (legacy properties)", () => {
      const partialConfig = {
        legacy: true,
      } as PartialConfig;

      const result = migrateConfig(partialConfig);
      expect(result).toEqual(expect.objectContaining(getDefaultConfig()));
      expect(result).not.toHaveProperty("legacy");
    });
    it("should correctly merge properties of various types", () => {
      const partialConfig = {
        mode: "time",
        theme: "keybear_ocean",
        time: 120,
        autoSwitchTheme: true,
      } as PartialConfig;

      const result = migrateConfig(partialConfig);
      expect(result.mode).toEqual("time");
      expect(result.theme).toEqual("keybear_ocean");
      expect(result.time).toEqual(120);
      expect(result.autoSwitchTheme).toEqual(true);
    });
    describe("should replace value with default config if invalid", () => {
      it.for([
        {
          given: { theme: "invalid" },
          expected: { theme: defaultConfig.theme },
        },
        {
          given: { keymapMode: "invalid" },
          expected: { keymapMode: defaultConfig.keymapMode },
        },
      ])(`$given`, ({ given, expected }) => {
        const description = `given: ${JSON.stringify(
          given,
        )}, expected: ${JSON.stringify(expected)} `;
        const result = migrateConfig(given);
        expect(result, description).toEqual(expect.objectContaining(expected));
      });
    });
    describe("should convert legacy values", () => {
      it.for([
        { given: { smoothCaret: true }, expected: { smoothCaret: "medium" } },
        { given: { smoothCaret: false }, expected: { smoothCaret: "off" } },
        {
          given: { playSoundOnError: true },
          expected: { playSoundOnError: "1" },
        },
        {
          given: { playSoundOnError: false },
          expected: { playSoundOnError: "off" },
        },
        { given: { soundVolume: "0.5" }, expected: { soundVolume: 0.5 } },
        { given: { indicateTypos: false }, expected: { indicateTypos: "off" } },
        {
          given: { indicateTypos: true },
          expected: { indicateTypos: "below" },
        },
        {
          given: { fontSize: "2" },
          expected: { fontSize: 2 },
        },
        {
          given: { fontSize: "15" },
          expected: { fontSize: 1.5 },
        },
        {
          given: { fontSize: "125" },
          expected: { fontSize: 1.25 },
        },
        {
          given: { fontSize: 15 },
          expected: { fontSize: 15 },
        },
        {
          given: { fontSize: -0.5 },
          expected: { fontSize: 1 },
        },
      ])(`$given`, ({ given, expected }) => {
        const description = `given: ${JSON.stringify(
          given,
        )}, expected: ${JSON.stringify(expected)} `;

        const result = migrateConfig(given);
        expect(result, description).toEqual(expect.objectContaining(expected));
      });
    });
  });
});
