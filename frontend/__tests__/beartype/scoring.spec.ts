// Ported verbatim from keybear (packages/page-practice/lib/typetest/
// scoring.test.ts); only the assertion helpers are vitest's.
import { expect, test } from "vitest";
import {
  caretIndex,
  commitScore,
  compareWord,
  cutoffScore,
  keyCost,
  offTrack,
  partialScore,
  wordCost,
  wordProgress,
} from "../../src/ts/beartype/scoring";

function equal(actual: unknown, expected: unknown, message?: string): void {
  expect(actual, message).toBe(expected);
}

function deepEqual(actual: unknown, expected: unknown): void {
  expect(actual).toEqual(expected);
}

test("chữ có dấu đáng nhiều phím hơn chữ không dấu", () => {
  equal(keyCost("a"), 1);
  equal(keyCost("ạ"), 2);
  equal(keyCost("ế"), 3);
  // "điểm" = đ(2) + i(1) + ể(3) + m(1) + dấu cách(1).
  equal(wordCost("điểm"), 8);
  equal(wordCost("cat"), 4);
});

test("gõ đủ dấu ăn trọn số phím của từ", () => {
  equal(wordProgress("điểm", "điểm"), wordCost("điểm") - 1);
  equal(wordProgress("cat", "cat"), 3);
});

test("bỏ dấu chỉ mất phím của cái dấu bỏ đi", () => {
  // Bỏ hết dấu: mất nét của `đ` và hai dấu của `ể`, còn lại 4 chữ cái.
  equal(wordProgress("điểm", "diem"), 4);
  // Gõ được mũ, chưa gõ dấu hỏi: thêm một phím nữa.
  equal(wordProgress("điểm", "diêm"), 5);
});

test("gõ nhầm sang chữ khác mất cả phím của chữ ấy", () => {
  equal(wordProgress("cat", "cot"), 2);
  equal(wordProgress("điểm", "dsểm"), 5); // đ→d ăn 1, s ăn 0, ểm ăn 4
});

test("gõ dở dang chỉ ăn phần đã gõ", () => {
  equal(wordProgress("điểm", "di"), 2);
  equal(wordProgress("điểm", ""), 0);
});

test("chữ thừa ở đuôi làm phồng mẫu số chứ không ăn điểm", () => {
  equal(wordProgress("cat", "catt"), 3);
  deepEqual(commitScore("cat", "catt"), { correct: 4, total: 5 });
  deepEqual(partialScore("cat", "catt"), { correct: 3, total: 4 });
});

test("chốt từ phải trả đủ phím của cả từ", () => {
  deepEqual(commitScore("cat", "cat"), { correct: 4, total: 4 });
  // Bỏ dở nửa từ rồi nhấn cách: vẫn nợ đủ phím của phần bỏ qua.
  deepEqual(commitScore("cat", "ca"), { correct: 3, total: 4 });
  // "điểm" gõ trần: 4 phím đúng + dấu cách, trên tổng 8.
  deepEqual(commitScore("điểm", "diem"), { correct: 5, total: 8 });
});

test("từ đang gõ dở chỉ tính phần đã chạm tới", () => {
  deepEqual(partialScore("cat", ""), { correct: 0, total: 0 });
  deepEqual(partialScore("cat", "ca"), { correct: 2, total: 2 });
  deepEqual(partialScore("điểm", "di"), { correct: 2, total: 3 });
});

test("tình trạng từng chữ để vẽ ra màn hình", () => {
  deepEqual(compareWord("điểm", "diê"), [
    { char: "đ", state: "partial" },
    { char: "i", state: "correct" },
    { char: "ể", state: "partial" },
    { char: "m", state: "pending" },
  ]);
  deepEqual(compareWord("ba", "bo"), [
    { char: "b", state: "correct" },
    // Ô gõ nhầm mang theo chữ đã gõ ra, thứ hiện bên dưới khi bật
    // `textDisplay.showTypedChars`.
    { char: "a", state: "wrong", typed: "o" },
  ]);
  deepEqual(compareWord("ba", "bax"), [
    { char: "b", state: "correct" },
    { char: "a", state: "correct" },
    { char: "x", state: "extra" },
  ]);
});

test("ô gõ nhầm nhớ chữ đã gõ ra", () => {
  // Chỉ chữ **đầu tiên** rơi vào ô: những phím gõ tiếp sau đã sang ô khác.
  deepEqual(
    compareWord("cạn", "cxy").map(({ char, typed }) => [char, typed]),
    [
      ["c", undefined],
      ["ạ", "x"],
      ["n", "y"],
    ],
  );
  // Chữ có dấu gõ nhầm sang chữ có dấu khác thì hiện nguyên chữ ấy, không phải
  // phím Telex đã bấm. Phím dấu của chữ gõ nhầm không còn chữ nào nhận, nên nó
  // đọng lại thành một ô thừa -- ô thừa vốn đã mang chữ đã gõ, không cần
  // `typed`.
  deepEqual(
    compareWord("hoà", "hoé").map(({ char, typed }) => [char, typed]),
    [
      ["h", undefined],
      ["o", undefined],
      ["à", "é"],
      ["é", undefined],
    ],
  );
});

test("chữ gõ dở chưa phải là chệch đường", () => {
  // Cả chuỗi dựng dấu đều là "chưa xong", không phải "sai" -- đây là chỗ khác
  // hẳn `TextInput`, và là lý do màn này không dùng nó.
  equal(offTrack("ế", ""), false);
  equal(offTrack("ế", "e"), false);
  equal(offTrack("ế", "ê"), false);
  equal(offTrack("ế", "ế"), false);
  equal(offTrack("bán", "ba"), false);
  equal(offTrack("bán", "bán"), false);
});

test("gõ sang chữ khác, hay gõ thừa, mới là chệch đường", () => {
  equal(offTrack("bán", "bo"), true);
  equal(offTrack("ba", "bax"), true);
  // Sai ở chữ đầu thì sửa chữ sau cũng không cứu được: vẫn đang chệch.
  equal(offTrack("bán", "bo"), true);
});

test("bộ gõ chưa gộp dấu hình thì chưa phải là gõ sai", () => {
  // `oo` chưa thành `ô` ngay được: `xoong` `boong` là từ thật, nên bộ gõ phải
  // chờ xem chữ sau là gì. Trong quãng chờ ấy chuỗi dài hơn từ đích, và so
  // theo vị trí thì chữ `c` cuối bị gọi là sai giữa một từ không hụt phím nào.
  equal(offTrack("cuộc", "cuoo"), false);
  equal(offTrack("cuộc", "cuooc"), false);
  equal(offTrack("cuộc", "cuộc"), false);
  deepEqual(compareWord("cuộc", "cuooc"), [
    { char: "c", state: "correct" },
    { char: "u", state: "correct" },
    { char: "ộ", state: "partial" },
    { char: "c", state: "correct" },
  ]);
  // Năm phím đã bấm được trả đủ năm, chỉ còn nợ phím `j` của dấu nặng.
  deepEqual(partialScore("cuộc", "cuooc"), { correct: 5, total: 6 });
});

test("bỏ dấu ở cuối âm tiết ăn trọn điểm", () => {
  // Lối gõ tự do: gõ hết chữ cái rồi mới bấm phím dấu. Phím dấu ấy rơi về sau
  // cả những chữ đứng trước nó, nên nó phải được quét ngược lại đúng chữ.
  equal(offTrack("súng", "sung"), false);
  equal(wordProgress("súng", "sung"), 4); // s u n g, còn nợ phím `s` của dấu sắc
  equal(wordProgress("súng", "súng"), 5);
  deepEqual(commitScore("súng", "súng"), { correct: 6, total: 6 });
  // Cả dấu hình lẫn dấu thanh để cuối: `dieemr` cũng ra `điểm`.
  equal(offTrack("điểm", "dieemr"), false);
  equal(wordProgress("điểm", "dieemr"), 6); // chỉ còn nợ nét gạch của `đ`
});

test("gõ nhầm thật vẫn là chệch đường", () => {
  equal(offTrack("cuộc", "cx"), true);
  equal(offTrack("cuộc", "cuox"), true);
  equal(offTrack("cuộc", "cuộcx"), true);
  deepEqual(compareWord("cuộc", "cuox"), [
    { char: "c", state: "correct" },
    { char: "u", state: "correct" },
    { char: "ộ", state: "partial" },
    { char: "c", state: "wrong", typed: "x" },
  ]);
});

test("con trỏ đứng yên suốt lúc dựng một chữ có dấu", () => {
  // Bộ gõ viết đi viết lại ô nhập, nên cùng một chữ `ầ` đang dựng dở đi qua ba
  // độ dài. Cả ba phải cho ra cùng một chỗ đứng, nếu không con trỏ giật.
  equal(caretIndex("thần", "tha"), 3);
  equal(caretIndex("thần", "thaa"), 3);
  equal(caretIndex("thần", "thâ"), 3);
  // Phím dấu bấm ở cuối âm tiết: trước đây số ký tự vượt ra ngoài mảng ô và
  // con trỏ biến mất.
  equal(caretIndex("thần", "thân"), 4);
  equal(caretIndex("thần", "thânf"), 4);
  equal(caretIndex("thần", "thần"), 4);
});

test("con trỏ đi qua cả chữ gõ nhầm", () => {
  equal(caretIndex("thần", ""), 0);
  equal(caretIndex("thần", "t"), 1);
  // `x` ăn mất ô của `ầ` -- ô ấy đỏ lên, và tay đã đi qua đó rồi.
  equal(caretIndex("thần", "thx"), 3);
  // Cả từ gõ sai thì con trỏ ở cuối từ, không phải ở mép trái. Trước đây gõ
  // hai phím sai vào `kẻ` cho ra hai ô đỏ mà con trỏ vẫn đứng nguyên ở 0.
  equal(caretIndex("kẻ", "x"), 1);
  equal(caretIndex("kẻ", "xy"), 2);
});

test("mỗi chữ thừa một ô, kể cả khi hai chữ giống hệt nhau", () => {
  // Gom theo mặt chữ thì ba phím `x` nhập lại thành một ô và hai chữ vừa gõ
  // biến mất. Đo được trên màn: ô nhập `nhaxxx` mà trên màn chỉ ra `nhằmx`.
  deepEqual(
    compareWord("nhằm", "nhaxxx").map(({ char, state }) => `${char}:${state}`),
    ["n:correct", "h:correct", "ằ:partial", "m:wrong", "x:extra", "x:extra"],
  );
  // Còn một chữ có dấu đáng ba phím thì vẫn chỉ đáng **một** ô -- đó mới là
  // việc phép gom sinh ra để làm.
  deepEqual(
    compareWord("hoà", "hoàờ").map(({ char, state }) => `${char}:${state}`),
    ["h:correct", "o:correct", "à:correct", "ờ:extra"],
  );
  // Gom kiểu nào thì tổng số phím thừa vẫn thế, nên điểm không đổi: `nha` trả
  // 3 phím trên 5, ba phím `x` cộng thẳng vào mẫu số.
  deepEqual(partialScore("nhằm", "nha"), { correct: 3, total: 5 });
  deepEqual(partialScore("nhằm", "nhaxxx"), { correct: 3, total: 8 });
});

test("con trỏ ra sau chữ thừa, vì chữ thừa hiện lên màn hình", () => {
  // Gõ hẳn ra ngoài từ: `x` không có ô đích nào để rơi vào nên nó tự thành một
  // ô, vẽ ra bên phải. Con trỏ đứng lại ở ô 4 thì chữ chạy quá con trỏ, mà
  // phím xoá kế tiếp ăn đúng vào `x` chứ không phải chỗ con trỏ chỉ.
  equal(caretIndex("thần", "thầnx"), 5);
  // Gõ nhầm rồi gõ tiếp: một ô đỏ cộng ba ô thừa, con trỏ ra sau cả bốn.
  equal(caretIndex("hoà", "hờng"), 6);
  // Xoá đi thì con trỏ về đúng chỗ tiến độ, không giữ lại vết gì.
  equal(caretIndex("hoà", "h"), 1);
});

test("đường dựng dấu không sinh ô sai lẫn ô thừa, nên luật trên không với tới", () => {
  // Đây là chỗ luật "con trỏ đi qua ô sai và ô thừa" có thể đụng vào chuyện con
  // trỏ đứng yên lúc gõ dấu. Nó không đụng được, vì suốt đường dựng dấu không
  // có ô nào mang hai trạng thái ấy: phím rơi vào chữ đang gõ dở thì bước sang
  // chữ sau, còn phím dấu gõ cuối âm tiết thì quét lại được về đúng chữ.
  for (const typed of ["cuoo", "thaa", "thân", "thânf"]) {
    const target = typed.startsWith("cu") ? "cuộc" : "thần";
    for (const state of ["wrong", "extra"]) {
      equal(
        compareWord(target, typed).some((cell) => cell.state === state),
        false,
        `${typed} · ${state}`,
      );
    }
  }
  // Và chỗ đứng của con trỏ không đổi suốt cụm bộ gõ viết lại ô nhập.
  equal(caretIndex("thần", "tha"), 3);
  equal(caretIndex("thần", "thaa"), 3);
  equal(caretIndex("thần", "thâ"), 3);
});

test("hết giờ giữa một chữ có dấu thì không đòi nốt cái dấu", () => {
  // `thâ` mới là nửa đường tới `ầ`: phím dấu huyền chưa bấm, và đồng hồ vừa
  // dừng nên không còn cơ hội bấm nữa.
  deepEqual(partialScore("thần", "thâ"), { correct: 4, total: 5 });
  deepEqual(cutoffScore("thần", "thâ"), { correct: 4, total: 4 });
  // Gõ xong hẳn thì hai hàm nói cùng một câu.
  deepEqual(cutoffScore("thần", "thần"), partialScore("thần", "thần"));
  // Chữ chưa chạm tới vẫn không tính, y như `partialScore`.
  deepEqual(cutoffScore("thần", "th"), { correct: 2, total: 2 });
});

test("hết giờ không xoá được cái đã gõ sai", () => {
  // Gõ nhầm hẳn sang chữ khác thì vẫn trừ: chuyện ấy đã xảy ra rồi, đồng hồ
  // không liên quan.
  deepEqual(cutoffScore("thần", "thx"), { correct: 2, total: 5 });
  // Phím thừa cũng thế.
  deepEqual(cutoffScore("thần", "thầnx"), { correct: 6, total: 7 });
});
