import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import * as Config from "../../src/ts/config/setters";
import * as Lifecycle from "../../src/ts/config/lifecycle";
import { __testing } from "../../src/ts/config/testing";
import * as Misc from "../../src/ts/utils/misc";
import * as Env from "../../src/ts/utils/env";
import {
  ConfigKey,
  Config as ConfigType,
  SmoothCaretSchema,
} from "../../src/ts/schemas/configs";
import * as ConfigValidation from "../../src/ts/config/validation";
import { configEvent } from "../../src/ts/events/config";
import { configLS } from "../../src/ts/config/persistence";
import * as Notifications from "../../src/ts/states/notifications";
import * as TestState from "../../src/ts/states/test";

const { replaceConfig, getConfig } = __testing;

describe("Config", () => {
  const isDevEnvironmentMock = vi.spyOn(Env, "isDevEnvironment");
  beforeEach(() => {
    isDevEnvironmentMock.mockClear();
    replaceConfig({});
  });

  describe("test with mocks", () => {
    const isConfigValueValidMock = vi.spyOn(
      ConfigValidation,
      "isConfigValueValid",
    );
    const dispatchConfigEventMock = vi.spyOn(configEvent, "dispatch");
    const saveConfigMock = vi.spyOn(configLS, "set");
    const notificationAddMock = vi.spyOn(
      Notifications,
      "showNoticeNotification",
    );
    const miscTriggerResizeMock = vi.spyOn(Misc, "triggerResize");
    const stateIsTestActiveMock = vi.spyOn(TestState, "isTestActive");

    const mocks = [
      isConfigValueValidMock,
      dispatchConfigEventMock,
      saveConfigMock,
      notificationAddMock,
      miscTriggerResizeMock,
      stateIsTestActiveMock,
    ];

    beforeEach(async () => {
      vi.useFakeTimers();
      mocks.forEach((it) => it.mockClear());

      isConfigValueValidMock.mockReturnValue(true);
      saveConfigMock.mockReturnValue(true);
      stateIsTestActiveMock.mockReturnValue(true);

      replaceConfig({});
    });

    afterAll(() => {
      mocks.forEach((it) => it.mockRestore());
      vi.useRealTimers();
    });

    beforeEach(() => isDevEnvironmentMock.mockClear());

    it("should throw if config key in not found in metadata", () => {
      expect(() => {
        Config.setConfig("nonExistentKey" as ConfigKey, true);
      }).toThrow(`Config metadata for key "nonExistentKey" is not defined.`);
    });

    it("fails if config is invalid", () => {
      //GIVEN
      isConfigValueValidMock.mockReturnValue(false);

      //WHEN / THEN
      expect(Config.setConfig("smoothCaret", "banana" as any)).toBe(false);
      expect(isConfigValueValidMock).toHaveBeenCalledWith(
        "smooth caret",
        "banana",
        SmoothCaretSchema,
      );
    });

    it("sets overrideConfigs", () => {
      //GIVEN
      replaceConfig({ mode: "time" });

      //WHEN
      Config.setConfig("words", 25);

      //THEN
      expect(dispatchConfigEventMock).toHaveBeenCalledWith({
        key: "mode",
        newValue: "words",
        nosave: false,
        previousValue: "time",
      });

      expect(dispatchConfigEventMock).toHaveBeenCalledWith({
        key: "words",
        newValue: 25,
        nosave: false,
        previousValue: 50,
      });
    });

    it("saves to localstorage if nosave=false", async () => {
      //GIVEN
      replaceConfig({ resultSaving: false });

      //WHEN
      Config.setConfig("resultSaving", true);

      //THEN
      //wait for debounce
      await vi.advanceTimersByTimeAsync(2500);

      //save
      expect(saveConfigMock).toHaveBeenCalledWith(
        expect.objectContaining({ resultSaving: true }),
      );
    });

    it("saves configOverride values to localstorage if nosave=false", async () => {
      //GIVEN
      replaceConfig({ mode: "time" });

      //WHEN
      Config.setConfig("words", 25);

      //THEN
      //wait for debounce
      await vi.advanceTimersByTimeAsync(2500);

      //save
      expect(saveConfigMock).toHaveBeenLastCalledWith(
        expect.objectContaining({
          words: 25,
          mode: "words",
        }),
      );
    });

    it("does not save to localstorage if nosave=true", async () => {
      //GIVEN

      replaceConfig({ resultSaving: false });

      //WHEN
      Config.setConfig("resultSaving", true, {
        nosave: true,
      });

      //THEN
      //wait for debounce
      await vi.advanceTimersByTimeAsync(2500);

      expect(saveConfigMock).not.toHaveBeenCalled();
    });

    it("dispatches event on set", () => {
      //GIVEN
      replaceConfig({ resultSaving: false });

      //WHEN
      Config.setConfig("resultSaving", true, {
        nosave: true,
      });

      //THEN

      expect(dispatchConfigEventMock).toHaveBeenCalledWith({
        key: "resultSaving",
        newValue: true,
        nosave: true,
        previousValue: false,
      });
    });

    it("triggers resize if property is set", () => {
      ///WHEN
      Config.setConfig("fontSize", 2.5);

      expect(miscTriggerResizeMock).toHaveBeenCalled();
    });

    it("does not triggers resize if property is not set", () => {
      ///WHEN
      Config.setConfig("resultSaving", true);

      expect(miscTriggerResizeMock).not.toHaveBeenCalled();
    });

    it("does not triggers resize if property on nosave", () => {
      ///WHEN
      Config.setConfig("fontSize", 2.5, { nosave: true });

      expect(miscTriggerResizeMock).not.toHaveBeenCalled();
    });
  });

  describe("apply", () => {
    it("should fill missing values with defaults", async () => {
      //GIVEN
      replaceConfig({
        mode: "words",
      });
      await Lifecycle.applyConfig({
        resultSaving: false,
        capsLockWarning: false,
      });
      const config = getConfig();
      expect(config.mode).toBe("time");
      expect(config.resultSaving).toBe(false);
      expect(config.capsLockWarning).toBe(false);
    });

    describe("should reset to default if setting failed", () => {
      const testCases: {
        display: string;
        value: Partial<ConfigType>;
        expected: Partial<ConfigType>;
      }[] = [
        {
          display: "sanitizes config, remove extra keys",
          value: {
            mode: "time",
            unknownKey: true,
            unknownArray: [1, 2],
          } as any,
          expected: { mode: "time" },
        },
        {
          display: "applies config migration",
          value: { mode: "time", smoothCaret: true } as any,
          expected: { mode: "time", smoothCaret: "medium" },
        },
      ];

      it.each(testCases)("$display", async ({ value, expected }) => {
        await Lifecycle.applyConfig(value);

        const config = getConfig();
        const applied = Object.fromEntries(
          Object.entries(config).filter(([key]) =>
            Object.keys(expected).includes(key),
          ),
        );
        expect(applied).toEqual(expected);
      });
    });

    it("should apply a partial config but keep the rest unchanged", async () => {
      replaceConfig({
        resultSaving: false,
      });
      await Lifecycle.applyConfig({
        resultSaving: false,
        capsLockWarning: false,
      });
      const config = getConfig();
      expect(config.resultSaving).toBe(false);
    });
  });
});
