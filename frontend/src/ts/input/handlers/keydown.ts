import { Config } from "../../config/store";
import * as TestLogic from "../../test/test-logic";
import { getCharFromEvent } from "../../test/layout-emulator";
import { emulateInsertText } from "./insert-text";
import {
  showNoticeNotification,
  showErrorNotification,
} from "../../states/notifications";
import * as KeyConverter from "../../utils/key-converter";
import * as ShiftTracker from "../../test/shift-tracker";
import { canQuickRestart } from "../../utils/quick-restart";
import * as CustomText from "../../test/custom-text";
import {
  getLastBailoutAttempt,
  setCorrectShiftUsed,
  setLastBailoutAttempt,
} from "../state";
import { Keycode } from "../../constants/keys";
import { __nonReactive, setBailedOut, wordsHaveTab } from "../../states/test";

import { logTestEvent } from "../../test/events/data";
import { getTestEventCode } from "../../test/events/helpers";

export async function handleTab(e: KeyboardEvent, now: number): Promise<void> {
  if (wordsHaveTab() && !e.shiftKey) {
    await emulateInsertText({ data: "\t", now });
    e.preventDefault();
    return;
  }
}

export async function handleEnter(
  e: KeyboardEvent,
  _now: number,
): Promise<void> {
  if (e.shiftKey) {
    if (
      !canQuickRestart(
        Config.mode,
        Config.words,
        Config.time,
        CustomText.getData(),
      )
    ) {
      const delay = Date.now() - getLastBailoutAttempt();
      if (getLastBailoutAttempt() === -1 || delay > 200) {
        setLastBailoutAttempt(Date.now());
        if (delay >= 5000) {
          showNoticeNotification(
            "Please double tap shift+enter to confirm bail out",
            {
              important: true,
              durationMs: 5000,
            },
          );
        }
        e.preventDefault();
        return;
      } else {
        setBailedOut(true);
        void TestLogic.finish();
        return;
      }
    }
  }
}

export async function handleOppositeShift(event: KeyboardEvent): Promise<void> {
  if (
    Config.oppositeShiftMode === "keymap" &&
    Config.keymapLayout !== "overrideSync"
  ) {
    let keymapLayout = await __nonReactive
      .getKeymapLayout()
      .catch(() => undefined);
    if (keymapLayout === undefined) {
      showErrorNotification("Failed to load keymap layout");

      return;
    }

    const keycode = KeyConverter.layoutKeyToKeycode(event.key, keymapLayout);
    setCorrectShiftUsed(
      keycode === undefined ? true : ShiftTracker.isUsingOppositeShift(keycode),
    );
  } else {
    setCorrectShiftUsed(
      ShiftTracker.isUsingOppositeShift(event.code as Keycode),
    );
  }
}

export async function onKeydown(event: KeyboardEvent): Promise<void> {
  if (event.repeat) {
    // just ignore all repeats
    return;
  }

  const now = performance.now();

  logTestEvent("keydown", now, {
    code: getTestEventCode(event),
    ctrl: event.ctrlKey ? true : undefined,
    shift: event.shiftKey ? true : undefined,
    alt: event.altKey ? true : undefined,
    meta: event.metaKey ? true : undefined,
  });

  if (
    event.key === "Home" ||
    event.key === "End" ||
    event.key === "PageUp" ||
    event.key === "PageDown" ||
    event.key.startsWith("Arrow")
  ) {
    event.preventDefault();
    return;
  }

  if (Config.oppositeShiftMode !== "off") {
    await handleOppositeShift(event);
  }

  if (Config.layout !== "default") {
    const emulatedChar = await getCharFromEvent(event);
    if (emulatedChar !== null) {
      await emulateInsertText({ data: emulatedChar, now });
      event.preventDefault();
      return;
    }
  }

  if (event.key === "Tab") {
    await handleTab(event, now);
    return;
  }

  if (event.key === "Enter") {
    await handleEnter(event, now);
    return;
  }
}
