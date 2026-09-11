import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import { checkIfFinished } from "../../../src/ts/input/helpers/fail-or-finish";
import { __testing } from "../../../src/ts/config/testing";
import * as Strings from "../../../src/ts/utils/strings";

const { replaceConfig } = __testing;

vi.mock("../../../src/ts/utils/strings", () => ({
  isSpace: vi.fn(),
}));

describe("checkIfFinished", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    replaceConfig({});
    // oxlint-disable-next-line typescript/no-unsafe-call
    (Strings.isSpace as any).mockReturnValue(false);
  });

  afterAll(() => {
    replaceConfig({});
  });

  it.each([
    {
      desc: "false if not all words typed",
      allWordsTyped: false,
      testInputWithData: "word",
      currentWord: "word",
      expected: false,
    },
    {
      desc: "false if not all words generated, but on the last word",
      allWordsGenerated: false,
      allWordsTyped: true,
      testInputWithData: "word",
      currentWord: "word",
      expected: false,
    },
    {
      desc: "true if last word is correct",
      allWordsTyped: true,
      testInputWithData: "word",
      currentWord: "word",
      expected: true,
    },
    {
      desc: "true if space on the last word",
      allWordsTyped: true,
      testInputWithData: "wo ",
      currentWord: "word",
      goingToNextWord: true,
      expected: true,
    },
    {
      desc: "false if still typing, quickend disabled",
      allWordsTyped: true,
      testInputWithData: "wordwordword",
      currentWord: "word",
      expected: false,
    },
  ] as {
    desc: string;
    allWordsTyped: boolean;
    allWordsGenerated?: boolean;
    goingToNextWord: boolean;
    testInputWithData: string;
    currentWord: string;
    isSpace?: boolean;
    expected: boolean;
  }[])(
    "$desc",
    ({
      allWordsTyped,
      allWordsGenerated,
      goingToNextWord,
      testInputWithData,
      currentWord,
      expected,
    }) => {
      const result = checkIfFinished({
        goingToNextWord,
        testInputWithData,
        currentWord,
        allWordsTyped,
        allWordsGenerated: allWordsGenerated ?? true,
      });

      expect(result).toBe(expected);
    },
  );
});
