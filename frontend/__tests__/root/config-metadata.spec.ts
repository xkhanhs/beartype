import { describe, it, expect, afterAll, vi } from "vitest";
import { configMetadata } from "../../src/ts/config/metadata";
import { __testing } from "../../src/ts/config/testing";
import { setConfig } from "../../src/ts/config/setters";
import { ConfigKey, Config as ConfigType } from "@monkeytype/schemas/configs";

const { replaceConfig, getConfig } = __testing;

type TestsByConfig<T> = Partial<{
  [K in keyof ConfigType]: (T & { value: ConfigType[K] })[];
}>;

describe("ConfigMeta", () => {
  afterAll(() => {
    replaceConfig({});
    vi.resetModules();
  });
  it("should have changeRequiresRestart defined", () => {
    const configsRequiringRestarts = Object.entries(configMetadata)
      .filter(([_key, value]) => value.changeRequiresRestart)
      .map(([key]) => key)
      .sort();

    expect(configsRequiringRestarts).toEqual(
      ["words", "time", "mode", "language"].sort(),
    );
  });

  it("should have triggerResize defined", () => {
    const configsWithTriggeResize = Object.entries(configMetadata)
      .filter(([_key, value]) => value.triggerResize === true)
      .map(([key]) => key)
      .sort();

    expect(configsWithTriggeResize).toEqual(["fontSize"].sort());
  });
  describe("overrideValue", () => {
    const testCases: TestsByConfig<{
      given?: Partial<ConfigType>;
      expected: Partial<ConfigType>;
    }> = {
      customBackground: [
        {
          value: " https://example.com/test.jpg ",
          expected: { customBackground: "https://example.com/test.jpg" },
        },
      ],
    };

    it.for(
      Object.entries(testCases).flatMap(([key, value]) =>
        value.flatMap((it) => ({ key: key as ConfigKey, ...it })),
      ),
    )(
      `$key value=$value given=$given expect=$expected`,
      ({ key, value, given, expected }) => {
        //GIVEN
        replaceConfig(given ?? {});

        //WHEN
        setConfig(key, value as any);

        //THEN
        expect(getConfig()).toMatchObject(expected);
      },
    );
  });
  describe("isBlocked", () => {
    const testCases: TestsByConfig<{
      given?: Partial<ConfigType>;
      fail?: true;
    }> = {
      randomTheme: [{ value: "off" }, { value: "custom", fail: true }],
    };

    it.for(
      Object.entries(testCases).flatMap(([key, value]) =>
        value.flatMap((it) => ({ key: key as ConfigKey, ...it })),
      ),
    )(
      `$key value=$value given=$given fail=$fail`,
      ({ key, value, given, fail }) => {
        //GIVEN
        replaceConfig(given ?? {});

        //WHEN
        const applied = setConfig(key, value as any);

        //THEN
        expect(applied).toEqual(!fail);
      },
    );
  });

  describe("overrideConfig", () => {
    const testCases: TestsByConfig<{
      given: Partial<ConfigType>;
      expected?: Partial<ConfigType>;
    }> = {
      theme: [
        {
          value: "8008",
          given: { customTheme: true },
          expected: { customTheme: false },
        },
      ],
    };

    it.for(
      Object.entries(testCases).flatMap(([key, value]) =>
        value.flatMap((it) => ({ key: key as ConfigKey, ...it })),
      ),
    )(
      `$key value=$value given=$given expected=$expected`,
      ({ key, value, given, expected }) => {
        //GIVEN
        replaceConfig(given);

        //WHEN
        setConfig(key, value as any);

        //THEN
        expect(getConfig()).toMatchObject(expected ?? {});
      },
    );
  });
});
