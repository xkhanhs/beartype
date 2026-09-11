import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import {
  isCharCorrect,
  shouldGoToNextWord,
} from "../../../src/ts/input/helpers/validation";
import { __testing } from "../../../src/ts/config/testing";
import * as Strings from "../../../src/ts/utils/strings";

const { replaceConfig } = __testing;

// Mock dependencies
vi.mock("../../../src/ts/utils/strings", async () => {
  const actual = await vi.importActual<typeof Strings>(
    "../../../src/ts/utils/strings",
  );
  return {
    ...actual,
    areCharactersVisuallyEqual: vi.fn(),
  };
});

describe("isCharCorrect", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset Config defaults
    replaceConfig({
      mode: "words",
      language: "english",
    });
    // oxlint-disable-next-line typescript/no-unsafe-call
    (Strings.areCharactersVisuallyEqual as any).mockReturnValue(false);
  });

  afterAll(() => {
    replaceConfig({});
  });

  describe("Space Handling", () => {
    it.each([
      ["returns false in the middle of a word", " ", "wor", "word", false],
      ["returns false at the start of a word", " ", "", "word", false],
      [
        "returns false when longer than a word",
        " ",
        "wordwordword",
        "word",
        false,
      ],
    ])("%s", (_desc, char, input, word, expected) => {
      expect(
        isCharCorrect({
          data: char,
          inputValue: input,
          targetWord: word,
        }),
      ).toBe(expected);
    });
  });

  describe("Separator at the end of a word", () => {
    // target words store their separator as a trailing space/newline; typing
    // that separator at the separator position is a correct char regardless of
    // whether the preceding letters were correct (word-level correctness is
    // derived from the per-letter events elsewhere)
    it.each([
      ["space separator at the correct position", " ", "word", "word ", true],
      [
        "space separator is correct even after a wrong letter",
        " ",
        "worx",
        "word ",
        true,
      ],
      [
        "newline separator at the correct position",
        "\n",
        "word",
        "word\n",
        true,
      ],
      [
        "newline separator is correct even after a wrong letter",
        "\n",
        "xord",
        "word\n",
        true,
      ],
    ])("%s", (_desc, char, input, word, expected) => {
      expect(
        isCharCorrect({
          data: char,
          inputValue: input,
          targetWord: word,
        }),
      ).toBe(expected);
    });
  });

  describe("Standard Matching", () => {
    it.each([
      ["a", "te", "tea", true],
      ["b", "te", "tea", false],
      ["x", "tea", "tea", false],
    ])(
      "char '%s' for input '%s' (current word '%s') -> %s",
      (char, input, word, expected) => {
        expect(
          isCharCorrect({
            data: char,
            inputValue: input,
            targetWord: word,
          }),
        ).toBe(expected);
      },
    );
  });
});

describe("shouldGoToNextWord", () => {
  it("returns false when the input is not a commit character", () => {
    expect(
      shouldGoToNextWord({
        data: "a",
        inputValue: "test",
        targetWord: "test ",
        commitCharacterType: false,
      }),
    ).toBe(false);
  });

  it("returns true when committing a word with a newline", () => {
    expect(
      shouldGoToNextWord({
        data: "\n",
        inputValue: "word",
        targetWord: "word\n",
        commitCharacterType: "separator",
      }),
    ).toBe(true);
  });

  it("commits a nospace 1-letter word on empty input", () => {
    expect(
      shouldGoToNextWord({
        data: "a",
        inputValue: "",
        targetWord: "a",
        commitCharacterType: "nospace",
      }),
    ).toBe(true);
  });

  it("commits a word on a separator regardless of correctness", () => {
    expect(
      shouldGoToNextWord({
        data: " ",
        inputValue: "hel",
        targetWord: "hello ",
        commitCharacterType: "separator",
      }),
    ).toBe(true);
  });
});
