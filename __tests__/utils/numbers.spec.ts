import { describe, it, expect } from "vitest";
import * as Numbers from "../../src/ts/utils/numbers";

describe("numbers", () => {
  describe("isSafeNumber", () => {
    describe("should correctly identify safe numbers", () => {
      const testCases = [
        //safe
        { input: 0, expected: true },
        { input: 1, expected: true },
        { input: -1, expected: true },
        { input: 0.5, expected: true },
        { input: -0.5, expected: true },
        //not safe
        { input: NaN, expected: false },
        { input: Infinity, expected: false },
        { input: -Infinity, expected: false },
        { input: "string", expected: false },
        { input: null, expected: false },
        { input: undefined, expected: false },
        { input: true, expected: false },
        { input: false, expected: false },
      ];

      it.for(testCases)(
        "should return $expected for $input",
        ({ input, expected }) => {
          expect(Numbers.isSafeNumber(input)).toEqual(expected);
        },
      );
    });
  });
});
