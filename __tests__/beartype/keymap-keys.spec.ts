import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { lastTelexKey } from "../../src/ts/beartype/telex-keys";
import {
  codeOfTypedChar,
  keyCodeToLight,
} from "../../src/ts/components/pages/test/keymapLayouts";
import { LayoutObject } from "../../src/ts/schemas/layouts";

const qwerty = JSON.parse(
  readFileSync("static/layouts/qwerty.json", "utf8"),
) as LayoutObject;

// VTX in tap mode posts every character with virtual keycode 0: `KeyA`
const vtx = (key: string): string | undefined =>
  keyCodeToLight({ key, code: "KeyA" }, qwerty);

describe("lastTelexKey", () => {
  it("is the key that just turned the letter into what it is", () => {
    expect(lastTelexKey("o")).toBe("o");
    expect(lastTelexKey("ô")).toBe("o");
    expect(lastTelexKey("ơ")).toBe("w");
    expect(lastTelexKey("ế")).toBe("s");
    expect(lastTelexKey("đ")).toBe("d");
    expect(lastTelexKey("Ư")).toBe("w");
    expect(lastTelexKey(" ")).toBe(" ");
  });
});

describe("keyCodeToLight", () => {
  it("lights the key the system typed, not the one it reported", () => {
    // `o` then `w`: O, then W as the o turns into ơ
    expect(vtx("o")).toBe("KeyO");
    expect(vtx("ơ")).toBe("KeyW");
    expect(vtx("ế")).toBe("KeyS");
    expect(vtx("Đ")).toBe("KeyD");
    expect(vtx(";")).toBe("Semicolon");
    expect(vtx(" ")).toBe("Space");
  });

  it("lights nothing for a character no drawn key carries", () => {
    expect(vtx("1")).toBeUndefined();
    expect(vtx("\\")).toBeUndefined();
  });

  it("falls back to the physical key when there is no character", () => {
    expect(keyCodeToLight({ key: "Process", code: "KeyS" }, qwerty)).toBe(
      "KeyS",
    );
  });
});

describe("codeOfTypedChar", () => {
  it("finds the key a wrong character was typed with", () => {
    expect(codeOfTypedChar(qwerty, "x")).toBe("KeyX");
    expect(codeOfTypedChar(qwerty, "ổ")).toBe("KeyR");
  });
});
