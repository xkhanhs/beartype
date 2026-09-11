import * as Numbers from "./numbers";

export type FormatOptions = {
  showDecimalPlaces?: boolean;
  suffix?: string;
  rounding?: (val: number) => number;
} & FallbackOptions;

const FORMAT_DEFAULT_OPTIONS: FormatOptions = {
  suffix: "",
  fallback: "-",
  showDecimalPlaces: undefined,
  rounding: Math.round,
};

type FallbackOptions = {
  fallback?: string;
};

export class Formatting {
  typingSpeed(
    wpm: number | null | undefined,
    formatOptions: FormatOptions = {},
  ): string {
    const options = { ...FORMAT_DEFAULT_OPTIONS, ...formatOptions };
    if (wpm === undefined || wpm === null) return options.fallback ?? "";

    return this.number(wpm, options);
  }

  percentage(
    percentage: number | null | undefined,
    formatOptions: FormatOptions = {},
  ): string {
    const options = { ...FORMAT_DEFAULT_OPTIONS, ...formatOptions };
    options.suffix = `%${options.suffix ?? ""}`;

    return this.number(percentage, options);
  }

  accuracy(
    accuracy: number | null | undefined,
    formatOptions: FormatOptions = {},
  ): string {
    return this.percentage(accuracy, {
      rounding: Math.floor,
      ...formatOptions,
    });
  }

  decimals(
    value: number | null | undefined,
    formatOptions: FormatOptions = {},
  ): string {
    const options = { ...FORMAT_DEFAULT_OPTIONS, ...formatOptions };
    return this.number(value, options);
  }

  private number(
    value: number | null | undefined,
    formatOptions: FormatOptions,
  ): string {
    if (value === undefined || value === null) {
      return formatOptions.fallback ?? "";
    }
    const suffix = formatOptions.suffix ?? "";

    if (formatOptions.showDecimalPlaces ?? false) {
      return Numbers.roundTo2(value).toFixed(2) + suffix;
    }
    return (formatOptions.rounding ?? Math.round)(value).toString() + suffix;
  }
}
