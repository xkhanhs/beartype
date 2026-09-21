import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { __testing } from "../../src/ts/config/testing";
import {
  before,
  drillKind,
  initFromWords,
  resetBefore,
} from "../../src/ts/test/practise-words";
import * as CustomText from "../../src/ts/test/custom-text";

const { replaceConfig, getConfig } = __testing;

describe("initFromWords", () => {
  beforeEach(() => {
    replaceConfig({ mode: "time", time: 30, words: 50 });
    resetBefore();
  });

  afterAll(() => {
    replaceConfig({});
  });

  it("does nothing with an empty word list", () => {
    expect(initFromWords([], "miss")).toBe(false);
    expect(getConfig().mode).toBe("time");
  });

  it("switches to a shuffled custom test built from the given words", () => {
    const started = initFromWords(["mot", "hai", "ba"], "miss");

    expect(started).toBe(true);
    expect(getConfig().mode).toBe("custom");
    expect(CustomText.getText()).toEqual(["mot", "hai", "ba"]);
    expect(CustomText.getMode()).toBe("shuffle");
    expect(CustomText.getPipeDelimiter()).toBe(false);
  });

  it("sizes the drill by the previous mode's time or word count", () => {
    replaceConfig({ mode: "time", time: 45 });
    initFromWords(["mot"], "miss");
    expect(CustomText.getLimitMode()).toBe("time");
    expect(CustomText.getLimitValue()).toBe(45);

    replaceConfig({ mode: "words", words: 20 });
    resetBefore();
    initFromWords(["mot"], "miss");
    expect(CustomText.getLimitMode()).toBe("word");
    expect(CustomText.getLimitValue()).toBe(20);
  });

  it("remembers which book the drill came from, until it is over", () => {
    initFromWords(["mot"], "slow");
    expect(drillKind()).toBe("slow");
    initFromWords(["hai"], "miss");
    expect(drillKind()).toBe("miss");
    resetBefore();
    expect(drillKind()).toBeNull();
  });

  it("remembers the mode to restore once the drill is over", () => {
    replaceConfig({ mode: "words", words: 25 });
    initFromWords(["mot", "hai"], "miss");

    expect(before.mode).toBe("words");
  });
});
