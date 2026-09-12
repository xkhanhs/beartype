import { describe, it, expect } from "vitest";
import * as Strings from "../../src/ts/utils/strings";

describe("string utils", () => {
  describe("splitIntoCharacters", () => {
    it("splits regular characters", () => {
      expect(Strings.splitIntoCharacters("abc")).toEqual(["a", "b", "c"]);
    });
    it("splits characters outside of the bmp", () => {
      expect(Strings.splitIntoCharacters("t𐑩e")).toEqual(["t", "𐑩", "e"]);
    });
  });
  describe("isSpace", () => {
    it.each([
      // Should return true for directly typable spaces
      [" ", 0x0020, "regular space", true],
      ["\u2002", 0x2002, "en space", true],
      ["\u2003", 0x2003, "em space", true],
      ["\u2009", 0x2009, "thin space", true],
      ["　", 0x3000, "ideographic space", true],
      ["\u00A0", 0x00a0, "non-breaking space", true],
      ["\u2007", 0x2007, "figure space", true],
      ["\u2008", 0x2008, "punctuation space", true],
      ["\u200A", 0x200a, "hair space", true],
      ["​", 0x200b, "zero-width space", true],

      // Should return false for other characters
      ["\t", 0x0009, "tab", false],
      ["a", 0x0061, "letter a", false],
      ["A", 0x0041, "letter A", false],
      ["1", 0x0031, "digit 1", false],
      ["!", 0x0021, "exclamation mark", false],
      ["\n", 0x000a, "newline", false],
      ["\r", 0x000d, "carriage return", false],

      // Edge cases
      ["", null, "empty string", false],
      ["  ", null, "two spaces", false],
      ["ab", null, "two letters", false],
    ])(
      "should return %s for %s (U+%s - %s)",
      (
        char: string,
        expectedCodePoint: number | null,
        description: string,
        expected: boolean,
      ) => {
        if (expectedCodePoint !== null && char.length === 1) {
          expect(char.codePointAt(0)).toBe(expectedCodePoint);
        }
        expect(Strings.isSpace(char)).toBe(expected);
      },
    );
  });

  describe("areCharactersVisuallyEqual", () => {
    it("should return true for identical characters", () => {
      expect(Strings.areCharactersVisuallyEqual("a", "a")).toBe(true);
      expect(Strings.areCharactersVisuallyEqual("!", "!")).toBe(true);
    });

    it("should return false for different characters", () => {
      expect(Strings.areCharactersVisuallyEqual("a", "b")).toBe(false);
      expect(Strings.areCharactersVisuallyEqual("!", "?")).toBe(false);
    });

    it("should return true for equivalent apostrophe variants", () => {
      expect(Strings.areCharactersVisuallyEqual("'", "'")).toBe(true);
      expect(Strings.areCharactersVisuallyEqual("'", "'")).toBe(true);
      expect(Strings.areCharactersVisuallyEqual("'", "ʼ")).toBe(true);
    });

    it("should return true for equivalent quote variants", () => {
      expect(Strings.areCharactersVisuallyEqual('"', '"')).toBe(true);
      expect(Strings.areCharactersVisuallyEqual('"', '"')).toBe(true);
      expect(Strings.areCharactersVisuallyEqual('"', "„")).toBe(true);
    });

    it("should return true for equivalent dash variants", () => {
      expect(Strings.areCharactersVisuallyEqual("-", "–")).toBe(true);
      expect(Strings.areCharactersVisuallyEqual("-", "—")).toBe(true);
      expect(Strings.areCharactersVisuallyEqual("–", "—")).toBe(true);
    });

    it("should return true for equivalent comma variants", () => {
      expect(Strings.areCharactersVisuallyEqual(",", "‚")).toBe(true);
    });

    it("should return false for characters from different equivalence groups", () => {
      expect(Strings.areCharactersVisuallyEqual("'", '"')).toBe(false);
      expect(Strings.areCharactersVisuallyEqual("-", "'")).toBe(false);
      expect(Strings.areCharactersVisuallyEqual(",", '"')).toBe(false);
    });

    it("should treat any Unicode space as equivalent to a regular space", () => {
      // IME-produced spaces must match the U+0020 stored as the word separator
      expect(Strings.areCharactersVisuallyEqual("　", " ")).toBe(true); // ideographic
      expect(Strings.areCharactersVisuallyEqual(" ", " ")).toBe(true); // nbsp
      expect(Strings.areCharactersVisuallyEqual(" ", " ")).toBe(true); // en space
      expect(Strings.areCharactersVisuallyEqual(" ", "a")).toBe(false);
      expect(Strings.areCharactersVisuallyEqual(" ", "\n")).toBe(false);
    });
  });
});
