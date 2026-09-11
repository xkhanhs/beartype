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
  it("should have triggerResize defined", () => {
    const configsWithTriggeResize = Object.entries(configMetadata)
      .filter(([_key, value]) => value.triggerResize === true)
      .map(([key]) => key)
      .sort();

    expect(configsWithTriggeResize).toEqual(["fontSize"].sort());
  });

  describe("overrideConfig", () => {
    const testCases: TestsByConfig<{
      given: Partial<ConfigType>;
      expected?: Partial<ConfigType>;
    }> = {
      words: [
        {
          value: 25,
          given: { mode: "time" },
          expected: { mode: "words" },
        },
        {
          value: 25,
          given: { mode: "words" },
          expected: { mode: "words" },
        },
      ],
      time: [
        {
          value: 60,
          given: { mode: "words" },
          expected: { mode: "time" },
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
