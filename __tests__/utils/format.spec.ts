import { describe, it, expect } from "vitest";
import { Formatting } from "../../src/ts/utils/format";

describe("format.ts", () => {
  describe("typingsSpeed", () => {
    it("should format wpm with no decimals by default", () => {
      const format = getInstance();
      expect(format.typingSpeed(12.5)).toEqual("13");
      expect(format.typingSpeed(0)).toEqual("0");
    });

    it("should format with fallback", () => {
      //default fallback
      const format = getInstance();
      expect(format.typingSpeed(null)).toEqual("-");
      expect(format.typingSpeed(undefined)).toEqual("-");

      //provided fallback
      expect(format.typingSpeed(null, { fallback: "none" })).toEqual("none");
      expect(format.typingSpeed(null, { fallback: "" })).toEqual("");
      expect(format.typingSpeed(undefined, { fallback: "none" })).toEqual(
        "none",
      );

      expect(format.typingSpeed(undefined, { fallback: "" })).toEqual("");
      expect(format.typingSpeed(undefined, { fallback: undefined })).toEqual(
        "",
      );
    });

    it("should format with decimals", () => {
      const format = getInstance();
      //force with decimals
      expect(format.typingSpeed(100, { showDecimalPlaces: true })).toEqual(
        "100.00",
      );
      //stays without decimals unless asked
      expect(format.typingSpeed(100, { showDecimalPlaces: false })).toEqual(
        "100",
      );
    });

    it("should format with suffix", () => {
      const format = getInstance();
      expect(format.typingSpeed(100, { suffix: " raw" })).toEqual("100 raw");
      expect(format.typingSpeed(100, { suffix: undefined })).toEqual("100");
      expect(format.typingSpeed(0, { suffix: " raw" })).toEqual("0 raw");
      expect(format.typingSpeed(null, { suffix: " raw" })).toEqual("-");
      expect(format.typingSpeed(undefined, { suffix: " raw" })).toEqual("-");
    });

    it("should format with rounding", () => {
      const format = getInstance();
      expect(format.typingSpeed(80.25)).toEqual("80");
      expect(format.typingSpeed(80.25, { rounding: Math.ceil })).toEqual("81");
      expect(format.typingSpeed(80.75, { rounding: Math.floor })).toEqual("80");
    });
  });

  describe("percentage", () => {
    it("should format with no decimals by default", () => {
      const format = getInstance();
      expect(format.percentage(12.5)).toEqual("13%");
      expect(format.percentage(0)).toEqual("0%");
    });

    it("should format with fallback", () => {
      //default fallback
      const format = getInstance();
      expect(format.percentage(null)).toEqual("-");
      expect(format.percentage(undefined)).toEqual("-");

      //provided fallback
      expect(format.percentage(null, { fallback: "none" })).toEqual("none");
      expect(format.percentage(null, { fallback: "" })).toEqual("");
      expect(format.percentage(undefined, { fallback: "none" })).toEqual(
        "none",
      );

      expect(format.percentage(undefined, { fallback: "" })).toEqual("");
      expect(format.percentage(undefined, { fallback: undefined })).toEqual("");
    });

    it("should format with decimals", () => {
      const format = getInstance();
      //force with decimals
      expect(format.percentage(100, { showDecimalPlaces: true })).toEqual(
        "100.00%",
      );
      //stays without decimals unless asked
      expect(format.percentage(100, { showDecimalPlaces: false })).toEqual(
        "100%",
      );
    });

    it("should format with suffix", () => {
      const format = getInstance();
      expect(format.percentage(100, { suffix: " raw" })).toEqual("100% raw");
      expect(format.percentage(100, { suffix: undefined })).toEqual("100%");
      expect(format.percentage(0, { suffix: " raw" })).toEqual("0% raw");
      expect(format.percentage(null, { suffix: " raw" })).toEqual("-");
      expect(format.percentage(undefined, { suffix: " raw" })).toEqual("-");
    });

    it("should format with rounding", () => {
      const format = getInstance();
      expect(format.percentage(80.25)).toEqual("80%");
      expect(format.percentage(80.25, { rounding: Math.ceil })).toEqual("81%");
      expect(format.percentage(80.75, { rounding: Math.floor })).toEqual("80%");
    });
  });

  describe("accuracy", () => {
    it("should floor decimals by default", () => {
      const format = getInstance();
      expect(format.accuracy(12.75)).toEqual("12%");
      expect(format.accuracy(12.75, { showDecimalPlaces: true })).toEqual(
        "12.75%",
      );
    });

    it("should format with rounding", () => {
      const format = getInstance();
      expect(format.accuracy(80.5)).toEqual("80%");
      expect(format.accuracy(80.25, { rounding: Math.ceil })).toEqual("81%");
      expect(format.accuracy(80.75, { rounding: Math.floor })).toEqual("80%");
    });
  });

  describe("decimals", () => {
    it("should format with no decimals by default", () => {
      const format = getInstance();
      expect(format.decimals(12.5)).toEqual("13");
      expect(format.decimals(0)).toEqual("0");
    });

    it("should format with fallback", () => {
      //default fallback
      const format = getInstance();
      expect(format.decimals(null)).toEqual("-");
      expect(format.decimals(undefined)).toEqual("-");

      //provided fallback
      expect(format.decimals(null, { fallback: "none" })).toEqual("none");
      expect(format.decimals(null, { fallback: "" })).toEqual("");
      expect(format.decimals(undefined, { fallback: "none" })).toEqual("none");

      expect(format.decimals(undefined, { fallback: "" })).toEqual("");
      expect(format.decimals(undefined, { fallback: undefined })).toEqual("");
    });

    it("should format with decimals", () => {
      const format = getInstance();
      //force with decimals
      expect(format.decimals(100, { showDecimalPlaces: true })).toEqual(
        "100.00",
      );
      //stays without decimals unless asked
      expect(format.decimals(100, { showDecimalPlaces: false })).toEqual("100");
    });

    it("should format with suffix", () => {
      const format = getInstance();
      expect(format.decimals(100, { suffix: " raw" })).toEqual("100 raw");
      expect(format.decimals(100, { suffix: undefined })).toEqual("100");
      expect(format.decimals(0, { suffix: " raw" })).toEqual("0 raw");
      expect(format.decimals(null, { suffix: " raw" })).toEqual("-");
      expect(format.decimals(undefined, { suffix: " raw" })).toEqual("-");
    });

    it("should format with rounding", () => {
      const format = getInstance();
      expect(format.decimals(80.25)).toEqual("80");
      expect(format.decimals(80.25, { rounding: Math.ceil })).toEqual("81");
      expect(format.decimals(80.75, { rounding: Math.floor })).toEqual("80");
    });
  });
});

function getInstance(): Formatting {
  return new Formatting();
}
