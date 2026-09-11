import { expect, test } from "vitest";
import {
  markCount,
  stepsToward,
  toneStyleOf,
  withToneStyle,
} from "../../src/ts/beartype/vietnamese";

test("chữ không dấu chỉ khớp với chính nó", () => {
  expect(stepsToward("n", "n")).toBe(0);
  expect(stepsToward("n", "m")).toBe(-1);
  expect(markCount("n")).toBe(0);
});

test("chữ một dấu nhận chữ cái gốc là bước dở dang", () => {
  expect(stepsToward("ạ", "a")).toBe(1);
  expect(stepsToward("ạ", "ạ")).toBe(0);
  expect(stepsToward("ă", "a")).toBe(1);
  expect(stepsToward("ơ", "o")).toBe(1);
  expect(stepsToward("đ", "d")).toBe(1);
  expect(markCount("ạ")).toBe(1);
  expect(markCount("đ")).toBe(1);
});

test("chữ hai dấu nhận cả hai thứ tự gõ của bộ gõ", () => {
  // Telex cho gõ `ee`+`s` (ê → ế) hay `es`+`e` (é → ế).
  expect(stepsToward("ế", "ế")).toBe(0);
  expect(stepsToward("ế", "ê")).toBe(1);
  expect(stepsToward("ế", "é")).toBe(1);
  expect(stepsToward("ế", "e")).toBe(2);
  expect(markCount("ế")).toBe(2);

  expect(stepsToward("ợ", "ơ")).toBe(1);
  expect(stepsToward("ợ", "ọ")).toBe(1);
  expect(stepsToward("ợ", "o")).toBe(2);

  // Dấu nặng của `ộ` đứng *trước* dấu mũ trong NFD, và cả hai cha vẫn phải ra.
  expect(stepsToward("ộ", "ô")).toBe(1);
  expect(stepsToward("ộ", "ọ")).toBe(1);
  expect(stepsToward("ộ", "o")).toBe(2);
});

test("gõ sang chữ khác không phải là dở dang", () => {
  expect(stepsToward("ế", "a")).toBe(-1);
  expect(stepsToward("ế", "ề")).toBe(-1);
  expect(stepsToward("ạ", "")).toBe(-1);
});

test("chữ hoa đi cùng đường với chữ thường", () => {
  expect(stepsToward("Ế", "Ê")).toBe(1);
  expect(stepsToward("Ế", "E")).toBe(2);
  expect(stepsToward("Đ", "D")).toBe(1);
  // Hoa và thường là hai chữ khác nhau, không phải hai bước của một chữ.
  expect(stepsToward("Ế", "e")).toBe(-1);
});

test("nhận ra lối bỏ dấu ở âm tiết mở", () => {
  expect(toneStyleOf("hoà")).toBe("new");
  expect(toneStyleOf("hòa")).toBe("old");
  expect(toneStyleOf("khoá")).toBe("new");
  expect(toneStyleOf("khóa")).toBe("old");
  expect(toneStyleOf("thuỷ")).toBe("new");
  expect(toneStyleOf("thủy")).toBe("old");
  expect(toneStyleOf("uỷ")).toBe("new");
  expect(toneStyleOf("nguỵ")).toBe("new");
});

test("từ hai lối viết như nhau không mang lối nào", () => {
  // `qu` nuốt mất chữ `u`, nên `quy` chỉ còn một nguyên âm để đặt dấu.
  expect(toneStyleOf("quý")).toBeNull();
  expect(toneStyleOf("quỷ")).toBeNull();
  expect(toneStyleOf("quá")).toBeNull();
  // Có âm cuối, hay có sẵn nguyên âm đội mũ: cũng chỉ còn một chỗ đặt dấu.
  expect(toneStyleOf("toàn")).toBeNull();
  expect(toneStyleOf("chuyện")).toBeNull();
  // Không có dấu thanh thì không có gì để tranh chấp.
  expect(toneStyleOf("con")).toBeNull();
  expect(toneStyleOf("hoa")).toBeNull();
  expect(toneStyleOf("đã")).toBeNull();
});

test("đổi lối rồi đổi lại ra đúng chính nó", () => {
  for (const word of ["hoà", "khoá", "thuỷ", "uỷ", "nguỵ", "khoẻ"]) {
    const old = withToneStyle(word, "old");
    expect(toneStyleOf(old)).toBe("old");
    expect(old === word).toBe(false);
    expect(withToneStyle(old, "new")).toBe(word);
  }
});

test("đổi lối không đụng tới từ hai lối viết như nhau", () => {
  for (const word of ["quý", "quá", "toàn", "chuyện", "con", "đã"]) {
    expect(withToneStyle(word, "old")).toBe(word);
    expect(withToneStyle(word, "new")).toBe(word);
  }
});
