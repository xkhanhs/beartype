import { describe, it, expect } from "vitest";
import * as Numbers from "../../src/ts/utils/numbers";

describe("numbers", () => {
  describe("abbreviateNumber", () => {
    it("should round to one decimal by default", () => {
      expect(Numbers.abbreviateNumber(1)).toEqual("1.0");
      expect(Numbers.abbreviateNumber(1.5)).toEqual("1.5");
      expect(Numbers.abbreviateNumber(1.55)).toEqual("1.6");

      expect(Numbers.abbreviateNumber(1000)).toEqual("1.0k");
      expect(Numbers.abbreviateNumber(1010)).toEqual("1.0k");
      expect(Numbers.abbreviateNumber(1099)).toEqual("1.1k");
    });
    it("should round to full numbers", () => {
      expect(Numbers.abbreviateNumber(1, 0)).toEqual("1");
      expect(Numbers.abbreviateNumber(1.5, 0)).toEqual("2");
      expect(Numbers.abbreviateNumber(1.55, 0)).toEqual("2");

      expect(Numbers.abbreviateNumber(1000, 0)).toEqual("1k");
      expect(Numbers.abbreviateNumber(1010, 0)).toEqual("1k");
      expect(Numbers.abbreviateNumber(1099, 0)).toEqual("1k");
    });

    it("should round to two decimals", () => {
      expect(Numbers.abbreviateNumber(1, 2)).toEqual("1.00");
      expect(Numbers.abbreviateNumber(1.5, 2)).toEqual("1.50");
      expect(Numbers.abbreviateNumber(1.55, 2)).toEqual("1.55");

      expect(Numbers.abbreviateNumber(1000, 2)).toEqual("1.00k");
      expect(Numbers.abbreviateNumber(1010, 2)).toEqual("1.01k");
      expect(Numbers.abbreviateNumber(1099, 2)).toEqual("1.10k");
    });
    it("should use suffixes", () => {
      let number = 1;
      expect(Numbers.abbreviateNumber(number)).toEqual("1.0");
      expect(Numbers.abbreviateNumber((number *= 1000))).toEqual("1.0k");
      expect(Numbers.abbreviateNumber((number *= 1000))).toEqual("1.0m");
      expect(Numbers.abbreviateNumber((number *= 1000))).toEqual("1.0b");
      expect(Numbers.abbreviateNumber((number *= 1000))).toEqual("1.0t");
      expect(Numbers.abbreviateNumber((number *= 1000))).toEqual("1.0q");
      expect(Numbers.abbreviateNumber((number *= 1000))).toEqual("1.0Q");
      expect(Numbers.abbreviateNumber((number *= 1000))).toEqual("1.0s");
      expect(Numbers.abbreviateNumber((number *= 1000))).toEqual("1.0S");
      expect(Numbers.abbreviateNumber((number *= 1000))).toEqual("1.0o");
      expect(Numbers.abbreviateNumber((number *= 1000))).toEqual("1.0n");
      expect(Numbers.abbreviateNumber((number *= 1000))).toEqual("1.0d");
    });
  });
  describe("parseIntOptional", () => {
    it("should return a number when given a valid string", () => {
      expect(Numbers.parseIntOptional("123")).toBe(123);
      expect(Numbers.parseIntOptional("42")).toBe(42);
      expect(Numbers.parseIntOptional("0")).toBe(0);
    });

    it("should return undefined when given null", () => {
      expect(Numbers.parseIntOptional(null as any)).toBeUndefined();
    });

    it("should return undefined when given undefined", () => {
      expect(Numbers.parseIntOptional(undefined as any)).toBeUndefined();
    });

    it("should handle non-numeric strings", () => {
      expect(Numbers.parseIntOptional("abc")).toBeNaN();
      expect(Numbers.parseIntOptional("12abc")).toBe(12); // parseInt stops at non-numeric chars
    });

    it("should handle leading and trailing spaces", () => {
      expect(Numbers.parseIntOptional(" 42 ")).toBe(42);
    });
    it("should return a number when given a valid string and radix", () => {
      expect(Numbers.parseIntOptional("1010", 2)).toBe(10);
      expect(Numbers.parseIntOptional("CF", 16)).toBe(207);
      expect(Numbers.parseIntOptional("C", 26)).toBe(12);
    });
  });
  describe("roundTo1", () => {
    it("should correctly round", () => {
      const tests = [
        {
          in: 0.0,
          out: 0,
        },
        {
          in: 0.01,
          out: 0.0,
        },
        {
          in: 0.09,
          out: 0.1,
        },
        {
          in: 0.123,
          out: 0.1,
        },
        {
          in: 0.456,
          out: 0.5,
        },
        {
          in: 0.789,
          out: 0.8,
        },
      ];

      tests.forEach((test) => {
        expect(Numbers.roundTo1(test.in)).toBe(test.out);
      });
    });

    it("mapRange", () => {
      const testCases = [
        {
          input: {
            value: 123,
            inMin: 0,
            inMax: 200,
            outMin: 0,
            outMax: 1000,
            clamp: false,
          },
          expected: 615,
        },
        {
          input: {
            value: 123,
            inMin: 0,
            inMax: 200,
            outMin: 1000,
            outMax: 0,
            clamp: false,
          },
          expected: 385,
        },
        {
          input: {
            value: 10001,
            inMin: 0,
            inMax: 10000,
            outMin: 0,
            outMax: 1000,
            clamp: false,
          },
          expected: 1000.1,
        },
        {
          input: {
            value: 10001,
            inMin: 0,
            inMax: 10000,
            outMin: 0,
            outMax: 1000,
            clamp: true,
          },
          expected: 1000,
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(
          Numbers.mapRange(
            input.value,
            input.inMin,
            input.inMax,
            input.outMin,
            input.outMax,
            input.clamp,
          ),
        ).toEqual(expected);
      });
    });
  });
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
  describe("safeNumber", () => {
    describe("should correctly identify safe numbers", () => {
      const testCases = [
        //safe
        { input: 0, expected: 0 },
        { input: 1, expected: 1 },
        { input: -1, expected: -1 },
        { input: 0.5, expected: 0.5 },
        { input: -0.5, expected: -0.5 },
        //not safe
        { input: NaN, expected: undefined },
        { input: Infinity, expected: undefined },
        { input: -Infinity, expected: undefined },
        { input: "string", expected: undefined },
        { input: null, expected: undefined },
        { input: undefined, expected: undefined },
        { input: true, expected: undefined },
        { input: false, expected: undefined },
      ];

      it.for(testCases)(
        "should return $expected for $input",
        ({ input, expected }) => {
          expect(Numbers.safeNumber(input as number)).toEqual(expected);
        },
      );
    });
  });
});
