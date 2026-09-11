import { Config } from "../config/store";
import { setConfig } from "../config/setters";
import * as CustomText from "./custom-text";
import { configEvent } from "../events/config";
import { Mode } from "@monkeytype/schemas/shared";

type Before = {
  mode: Mode | null;
};

export const before: Before = {
  mode: null,
};

/**
 * beartype: a drill built from a given list of words -- the miss book's.
 * Runs the words as a custom test that `restart` reverts from afterwards, as
 * long as the test it replaces, shuffled on every pass so the hands learn the
 * words, not the order.
 */
export function initFromWords(words: readonly string[]): boolean {
  if (words.length === 0) return false;

  const mode = before.mode ?? Config.mode;
  const byTime = mode === "time";
  const length = byTime ? Config.time : Config.words;

  setConfig("mode", "custom", {
    nosave: true,
  });
  CustomText.setPipeDelimiter(false);
  CustomText.setText([...words]);
  CustomText.setMode("shuffle");
  CustomText.setLimitMode(byTime ? "time" : "word");
  CustomText.setLimitValue(length);

  before.mode = mode;

  return true;
}

export function resetBefore(): void {
  before.mode = null;
}

configEvent.subscribe(({ key }) => {
  if (key === "mode") resetBefore();
});
