// Ported from keybear (packages/page-practice/lib/typetest/scoring.ts). Keep
// the two in step; the only additions are at the end of the file.
import { telexKeysOf } from "./telex-keys";
import { MARKS, toneStyleOf, withToneStyle } from "./vietnamese";

/**
 * Chấm điểm theo **phím đáng tốn**, không theo ký tự.
 *
 * Một chữ đáng bao nhiêu phím thì đó là mẫu số của nó: `a` một phím, `ạ` hai,
 * `ế` ba. Gõ được tới đâu tính tới đó -- `e` khi đích là `ế` ăn một phím, `ê`
 * ăn hai. Bỏ dấu là mất đúng số phím của cái dấu bỏ đi, chứ không phải mất cả
 * chữ; gõ nhầm hẳn sang chữ khác thì mất cả phím của chữ ấy.
 *
 * Điểm là một hàm thuần của (chữ đích, chữ đã gõ), nên nó không phụ thuộc vào
 * việc bộ gõ viết lại ô nhập mấy lần hay nhanh chậm ra sao. Đó là chỗ khác
 * go10ngon.net, nơi mỗi lần chấm phải chờ 15ms cho ô nhập lắng lại và người gõ
 * nhanh vô tình bị đếm hụt số phím.
 *
 * **Khớp theo phím, không theo chỉ số ký tự.** Đây là chỗ bản đầu tiên sai, và
 * sai với mọi từ mang dấu mũ hay móc. Bộ gõ không gộp `oo` thành `ô` ngay được:
 * `xoong` `boong` `coong` là từ thật, nên nó phải chờ xem chữ sau là gì. Trong
 * quãng chờ ấy ô nhập mang `cuooc` -- dài **năm** ký tự trong khi từ đích
 * `cuộc` dài **bốn**. So theo vị trí thì ký tự thứ tư gõ ra là `o` còn đích ở
 * đó là `c`: một chữ đỏ oan giữa một từ gõ không sai phím nào, và ở màn luyện
 * Colemak (nơi `countTypos` bật) là một lần gõ hụt ghi vĩnh viễn cho *mỗi* từ
 * có dấu hình -- độ chính xác đóng đinh quanh 70% cho một bàn tay gõ đúng hết.
 *
 * Nên phép khớp đổi sang đúng đơn vị mà ngón tay bỏ ra: `ộ` là ba phím `ooj`,
 * `ô` đã gõ ra cũng là hai phím `oo`, hai bên quy về cùng một dãy phím rồi mới
 * khớp. Trong một chữ thì **không xét thứ tự** các phím dấu, và phím còn thừa
 * được quét ngược lại cho chữ nào còn thiếu -- đó là thứ cho phép bỏ dấu ở cuối
 * âm tiết (`sung` rồi `s`), lối gõ tự do mà bộ gõ nào cũng nhận. Cùng một luật
 * `next-key.ts` đã dùng cho bàn phím vẽ dưới dòng chữ.
 */

/**
 * Chuỗi phím của một chữ, giữ nguyên hoa thường ở **chữ cái gốc**: `Ộ` phải gõ
 * `O` chứ không phải `o`, còn phím dấu thì bộ gõ nào cũng nhận cả hai kiểu.
 *
 * Chữ đội dấu không thuộc bảng quốc ngữ (`ü`, `ñ`) trả về chính nó:
 * `telexKeysOf` chỉ biết dấu tiếng Việt và nó lột dấu lạ đi mất, để thế thì gõ
 * `u` ăn trọn điểm của `ü`.
 */
function keysOfChar(char: string): readonly string[] {
  const nfd = [...char.normalize("NFD")];
  if (nfd.length > 1 && !nfd.slice(1).every((mark) => MARKS.has(mark))) {
    return [char];
  }
  const keys = [...telexKeysOf(char)];
  if (keys.length === 0) {
    return [char];
  }
  if (char !== char.toLowerCase()) {
    keys[0] = (keys[0] ?? "").toUpperCase();
  }
  return keys;
}

/** Số phím một chữ đáng tốn: chữ cái gốc, cộng mỗi dấu một phím. */
export function keyCost(char: string): number {
  return keysOfChar(char).length;
}

/** Số phím cả từ đáng tốn, kể cả dấu cách chốt từ ở cuối. */
export function wordCost(target: string): number {
  let cost = 1; // dấu cách
  for (const char of target) {
    cost += keyCost(char);
  }
  return cost;
}

/** Một chữ của từ đích, kèm những phím của nó đã được trả. */
type Slot = {
  readonly char: string;
  /** Phím của chữ này còn nợ. */
  readonly owed: string[];
  /** Số phím đã trả. */
  paid: number;
  /** Đã có một phím gõ nhầm rơi đúng vào chỗ chữ này. */
  missed: boolean;
  /**
   * Chữ trong ô nhập đã sinh ra phím gõ nhầm ấy -- thứ hiện dưới chữ đích khi
   * bật `showTypedChars`. Chỉ giữ chữ **đầu tiên** rơi vào ô này: đó là phím đã
   * làm hỏng ô, những gì gõ tiếp sau đã sang ô khác.
   */
  typed: string | null;
};

type Alignment = {
  readonly slots: readonly Slot[];
  /** Phím gõ ra mà không chữ nào nhận, gom theo chữ đã sinh ra chúng. */
  readonly extra: readonly { readonly char: string; readonly keys: number }[];
};

/**
 * Rải phím đã gõ vào các chữ của từ đích.
 *
 * Con trỏ chỉ đi tới, không lùi. Một phím không khớp chữ đang đứng thì có hai
 * đường: chữ ấy **đã nhận phím rồi** (đang gõ dở, như `ộ` mới có `oo`) thì phím
 * này thuộc về chữ sau -- bước sang; chữ ấy **chưa nhận gì** thì đây là gõ
 * nhầm, đánh dấu chữ ấy rồi bước sang, đúng như phép so theo vị trí vẫn làm.
 * Phân biệt hai đường ấy là toàn bộ chỗ sửa: thiếu nó thì `c` của `cuooc` đâm
 * vào chữ `ộ` đang gõ dở và bị gọi là sai.
 */
function align(target: string, typed: string): Alignment {
  const slots: Slot[] = [...target].map((char) => ({
    char,
    owed: [...keysOfChar(char)],
    paid: 0,
    missed: false,
    typed: null,
  }));
  const extra: { char: string; keys: number }[] = [];
  // `from` là chữ thứ mấy trong ô nhập đã sinh ra phím này. Cần nó vì một chữ
  // có dấu sinh nhiều phím mà chỉ đáng **một** ô trên màn hình -- xem chỗ gom
  // ở cuối hàm.
  const left: { char: string; key: string; from: number }[] = [];
  let at = 0;
  let from = -1;
  for (const char of typed) {
    from += 1;
    for (const key of keysOfChar(char)) {
      let placed = false;
      while (at < slots.length) {
        const slot = slots[at] as Slot;
        const owed = slot.owed.indexOf(key);
        if (owed >= 0) {
          slot.owed.splice(owed, 1);
          slot.paid += 1;
          placed = true;
          break;
        }
        if (slot.paid > 0 || slot.missed) {
          at += 1;
          continue;
        }
        slot.missed = true;
        slot.typed = char;
        at += 1;
        placed = true;
        break;
      }
      if (!placed) {
        left.push({ char, key, from });
      }
    }
  }
  // Phím dấu gõ ở cuối âm tiết (`sung` rồi `s`) rơi về sau cả những chữ đứng
  // trước nó, nên vòng trên không còn chỗ đặt. Quét lại cho chữ nào **đã bắt
  // đầu** mà còn thiếu đúng phím ấy; chữ chưa ai chạm tới thì không, bằng không
  // một phím lạc lại đi hoàn thành hộ một chữ chưa gõ.
  // Gom phím thừa lại thành ô: **một chữ trong ô nhập là một ô**, kể cả chữ có
  // dấu đáng ba phím. Gom theo `from` chứ không theo mặt chữ, vì hai chữ giống
  // nhau gõ liền nhau là hai chữ thật -- gõ `xxx` mà gom theo mặt chữ thì ba
  // phím nhập vào làm một ô `x` duy nhất, và hai chữ người ta vừa gõ biến mất
  // khỏi màn hình. Đo được trên màn: ô nhập `nhaxxx`, trên màn `nhằmx`.
  let lastFrom = -1;
  for (const { char, key, from } of left) {
    const slot = slots.find(
      (item) => item.paid > 0 && !item.missed && item.owed.includes(key),
    );
    if (slot !== undefined) {
      slot.owed.splice(slot.owed.indexOf(key), 1);
      slot.paid += 1;
    } else {
      const last = extra[extra.length - 1];
      if (last !== undefined && lastFrom === from) {
        last.keys += 1;
      } else {
        extra.push({ char, keys: 1 });
        lastFrom = from;
      }
    }
  }
  return { slots, extra };
}

/** Số phím đã trả cho từ đích. */
function paidKeys({ slots }: Alignment): number {
  return slots.reduce((sum, slot) => sum + slot.paid, 0);
}

/** Số phím gõ ra mà không chữ nào nhận. */
function extraKeys({ extra }: Alignment): number {
  return extra.reduce((sum, item) => sum + item.keys, 0);
}

/**
 * Số phím đã gõ *đúng hướng*. Phím thừa không cộng gì -- chúng chỉ làm phồng
 * mẫu số, xem `commitScore` và `partialScore`.
 */
export function wordProgress(target: string, typed: string): number {
  return paidKeys(align(target, typed));
}

export type Score = {
  /** Số phím gõ đúng hướng. */
  readonly correct: number;
  /** Số phím lẽ ra phải bỏ ra. */
  readonly total: number;
};

/**
 * Điểm của một từ đã chốt bằng dấu cách. Cả từ phải trả đủ phím, kể cả những
 * chữ chưa gõ tới: bỏ nửa từ rồi nhấn cách là bỏ qua đúng ngần ấy phím, và đó
 * chính là chỗ độ chính xác phải trừ.
 */
export function commitScore(target: string, typed: string): Score {
  const aligned = align(target, typed);
  return {
    correct: paidKeys(aligned) + 1, // +1: dấu cách vừa gõ đúng
    total: wordCost(target) + extraKeys(aligned),
  };
}

/**
 * Điểm của từ đang gõ dở. Chỉ tính phần đã chạm tới -- những chữ còn ở phía
 * trước chưa phải là lỗi của ai cả, và tính chúng vào thì độ chính xác tụt
 * xuống rồi bò lên sau mỗi phím, nhìn như hỏng.
 */
export function partialScore(target: string, typed: string): Score {
  return reachedScore(target, typed, true);
}

/**
 * Điểm của từ đang gõ dở khi **đồng hồ vừa hết**, không phải khi đang gõ.
 *
 * Khác `partialScore` đúng một chỗ: chữ còn đang dựng dở mà vẫn trên đường --
 * `thâ` trên đường tới `thần` -- không bị đòi nốt những phím chưa kịp bấm. Hết
 * giờ ngay trước phím dấu không phải lỗi của tay ai, mà `partialScore` thì trừ
 * đúng cái dấu ấy: bài đo dừng giữa một chữ có dấu và người gõ mất điểm cho
 * việc đồng hồ không cho làm nốt. Chữ gõ nhầm hẳn và phím thừa vẫn trừ như
 * thường -- chúng là chuyện đã xảy ra rồi.
 */
export function cutoffScore(target: string, typed: string): Score {
  return reachedScore(target, typed, false);
}

/**
 * Phần chung của hai hàm trên: chỉ tính những chữ đã chạm tới. `owe` nói có đòi
 * nốt phím còn thiếu của một chữ đang dựng dở hay không.
 */
function reachedScore(target: string, typed: string, owe: boolean): Score {
  const aligned = align(target, typed);
  let reached = -1;
  aligned.slots.forEach((slot, index) => {
    if (slot.paid > 0 || slot.missed) {
      reached = index;
    }
  });
  let correct = 0;
  let total = extraKeys(aligned);
  for (const slot of aligned.slots.slice(0, reached + 1)) {
    correct += slot.paid;
    total += slot.paid + (owe || slot.missed ? slot.owed.length : 0);
  }
  return { correct, total };
}

/**
 * Chữ đã gõ có còn đang **trên đường** tới từ đích không.
 *
 * "Trên đường" gồm cả những gì gõ dở: `e` khi đích là `ế` chưa sai chút nào,
 * nó chỉ chưa xong -- đó là toàn bộ lý do màn này không dùng `TextInput`. Chỉ
 * gõ hẳn sang chữ khác, hay gõ thừa ra ngoài từ, mới là chệch.
 *
 * Dùng để bắt **lỗi đã sửa**: một phím đẩy từ đang gõ từ "trên đường" sang
 * "chệch" là một lần gõ hụt, dù ngay sau đó có xoá đi gõ lại cho đúng. Không có
 * phép này thì sửa xong là sạch dấu vết, và cả bảng phím yếu lẫn con số cuối
 * lượt đều đọc ra một bàn tay không bao giờ trượt.
 */
export function offTrack(target: string, typed: string): boolean {
  const { slots, extra } = align(target, typed);
  return extra.length > 0 || slots.some((slot) => slot.missed);
}

type CharState =
  /** Chưa gõ tới. */
  | "pending"
  /** Đúng hẳn. */
  | "correct"
  /** Đang trên đường tới đích -- gõ chữ cái rồi, còn thiếu dấu. */
  | "partial"
  /** Gõ sang chữ khác. */
  | "wrong"
  /** Gõ thừa ra ngoài từ. */
  | "extra";

export type CharCell = {
  readonly char: string;
  readonly state: CharState;
  /**
   * Chữ đã gõ ra ở chỗ này. Chỉ ô `wrong` mới có: ô `extra` vốn đã mang chính
   * chữ đã gõ, còn ô `partial` thì chưa sai gì.
   */
  readonly typed?: string;
};

/**
 * Từng chữ của từ, kèm tình trạng, để vẽ ra màn hình. Chữ *đích* luôn là chữ
 * hiện ra -- người gõ cần biết mình phải gõ gì, không phải mình vừa gõ gì -- trừ
 * phần thừa ở đuôi, thứ không có chữ đích nào để hiện. Ô gõ nhầm mang thêm chữ
 * *đã gõ* trong `typed`, để màn hình treo nó bên dưới khi bật `showTypedChars`
 * -- ô vẫn hiện chữ đích, chữ đã gõ chỉ thêm vào.
 */
export function compareWord(
  target: string,
  typed: string,
): readonly CharCell[] {
  const { slots, extra } = align(target, typed);
  const cells: CharCell[] = slots.map((slot) => ({
    char: slot.char,
    // Chỉ đặt khoá này ở ô gõ nhầm: mọi ô khác không mang chữ đã gõ nào cả, và
    // một `typed: null` rải khắp mảng chỉ làm mọi phép so nặng thêm.
    ...(slot.missed && slot.typed !== null ? { typed: slot.typed } : null),
    state: slot.missed
      ? "wrong"
      : slot.paid === 0
        ? "pending"
        : slot.owed.length === 0
          ? "correct"
          : "partial",
  }));
  for (const { char } of extra) {
    cells.push({ char, state: "extra" });
  }
  return cells;
}

/**
 * Ô mà con trỏ đứng vào, khi từ đích là `target` và trong ô nhập là `typed`.
 *
 * **Không phải** số ký tự đã gõ, và đó là cả vấn đề. Bộ gõ tiếng Việt dựng một
 * chữ có dấu bằng cách viết đi viết lại ô nhập, nên giữa hai phím ô nhập mang
 * những thứ dài ngắn khác nhau mà cùng trỏ về một chỗ trên từ đích: gõ `thần`
 * kiểu Telex thì ô nhập lần lượt là `tha`, `thaa`, `thâ` -- ba độ dài cho cùng
 * một chữ `ầ` đang dựng dở. Đếm ký tự thì con trỏ chạy quá sang phải ở `thaa`
 * rồi giật lùi lại khi thành `thâ`, thấy rõ vì con trỏ trượt có hoạt hình; còn
 * ở phím dấu gõ cuối âm tiết (`thânf`) nó vượt hẳn ra ngoài mảng ô rồi **biến
 * mất** cho tới phím sau.
 *
 * Nên đếm theo *từ đích*: đứng ngay sau **ô cuối cùng đã nhận được một phím**,
 * dù phím ấy đúng (`paid`) hay nhầm (`missed`) hay chẳng chữ nào nhận (`extra`).
 * Nói cách khác: sau ô cuối cùng không còn màu chờ.
 *
 * Chữ gõ nhầm cũng đẩy con trỏ đi, và đó là chỗ sửa muộn. Ô `missed` trông thì
 * mang chữ *đích*, nhưng nó nói "chữ này đã bị một phím sai ăn mất" -- tay đã
 * đi qua đó rồi. Bỏ con trỏ lại đằng sau thì gõ hai phím sai vào `kẻ` cho ra cả
 * hai ô đỏ mà con trỏ vẫn đứng ở mép trái từ, không nhúc nhích: người gõ mất
 * hẳn chỗ đứng của mình. Ô thừa cũng vậy -- chúng là chữ *đã gõ* vẽ ra thật, gõ
 * `hờng` khi đích là `hoà` thì ba ô `ờ n g` hiện lên bên phải, mà bỏ con trỏ lại
 * thì chữ chạy quá con trỏ. Cả hai đường đều còn một cái sai chung: phím xoá kế
 * tiếp ăn vào ô ngoài cùng bên phải, chứ không phải chỗ con trỏ đang chỉ.
 *
 * Luật này không đụng được vào chuyện con trỏ đứng yên lúc dựng dấu, vì đường
 * dựng dấu **không sinh ô `missed` lẫn ô `extra`** bao giờ: `cuoo`, `thaa`,
 * `thân`, `thânf` đều không có ô nào. Phím rơi vào một chữ đang gõ dở thì bước
 * sang chữ sau chứ không bị gọi là nhầm, và phím dấu gõ cuối âm tiết thì quét
 * lại được về chữ nào còn thiếu đúng phím ấy. Hai loại ô kia chỉ mọc ra khi
 * thật sự gõ sai, và lúc ấy chúng nằm trên màn hình cho ai cũng thấy.
 */
export function caretIndex(target: string, typed: string): number {
  const { slots, extra } = align(target, typed);
  if (extra.length > 0) {
    // `compareWord` xếp ô thừa ngay sau các ô của từ đích, nên đây là chỗ sau
    // ô cuối cùng của cả mảng.
    return slots.length + extra.length;
  }
  let at = 0;
  slots.forEach((slot, index) => {
    if (slot.paid > 0 || slot.missed) {
      at = index + 1;
    }
  });
  return at;
}

// ---------------------------------------------------------------------------
// beartype additions. Everything above is keybear's; below is what monkeytype's
// result screen needs on top of it.

/**
 * The typed word rewritten in the tone style of the target, so `hoà` typed
 * where `hòa` is shown -- or the other way round -- scores as the same word.
 * Which style comes out is a checkbox in the input method, not something the
 * typist got wrong.
 */
export function inTargetStyle(target: string, typed: string): string {
  const style = toneStyleOf(target);
  return style === null ? typed : withToneStyle(typed, style);
}

/** Keys, split the way upstream's result screen splits characters. */
export type KeyCounts = {
  /** Keys typed toward the target, the commit space included. */
  readonly correct: number;
  /** Keys owed by letters that were reached but came out wrong or unfinished. */
  readonly incorrect: number;
  /** Keys typed that no letter of the target took. */
  readonly extra: number;
  /** Keys owed by letters never reached. */
  readonly missed: number;
};

/**
 * What a word owes, in keys:
 * - `"all"` -- the word was committed: every key of it is owed, `commitScore`.
 * - `"reached"` -- the word is being typed: only the letters reached so far
 *   are owed, unfinished marks included, `partialScore`.
 * - `"cutoff"` -- the clock ran out mid-word: letters still being built are
 *   not owed their missing marks, `cutoffScore`.
 *
 * `correct + incorrect + extra + missed` is keybear's denominator, so the
 * accuracy read off these counts is keybear's accuracy.
 */
export function keyCounts(
  target: string,
  typed: string,
  owe: "all" | "reached" | "cutoff",
  committed: boolean,
): KeyCounts {
  const { slots, extra } = align(target, inTargetStyle(target, typed));
  let reachedUpTo = -1;
  slots.forEach((slot, index) => {
    if (slot.paid > 0 || slot.missed) reachedUpTo = index;
  });
  let correct = committed ? 1 : 0;
  let incorrect = 0;
  let missed = 0;
  slots.forEach((slot, index) => {
    correct += slot.paid;
    const reached = index <= reachedUpTo;
    if (!reached) {
      if (owe === "all") missed += slot.owed.length;
      return;
    }
    if (slot.missed || owe !== "cutoff") incorrect += slot.owed.length;
  });
  return {
    correct,
    incorrect,
    extra: extra.reduce((sum, item) => sum + item.keys, 0),
    missed,
  };
}

/** Letters of the target a wrong key landed on, plus keys no letter took. */
function mistakes(target: string, typed: string): number {
  const { slots, extra } = align(target, inTargetStyle(target, typed));
  return (
    slots.filter((slot) => slot.missed).length +
    extra.reduce((sum, item) => sum + item.keys, 0)
  );
}

/**
 * Whether the key that turned `before` into `after` was a wrong one: it made a
 * new mistake rather than paying toward a letter.
 *
 * Judged on the key alone, like upstream's per-character check: a right key
 * after a wrong one is still right, and a second wrong key is a second
 * mistake. What changes is what "right" means -- `e` where `ế` stands pays
 * one of the letter's three keys, so it is right.
 */
export function isWrongKey(
  target: string,
  before: string,
  after: string,
): boolean {
  return mistakes(target, after) > mistakes(target, before);
}

/**
 * Upstream's `countChars`, counted in keys. `typed` and `target` are a word's
 * input and target as the event log keeps them, each with its trailing commit
 * character when it has one.
 *
 * `creditPartial` is upstream's flag for the word the clock or a bail-out cut
 * short: its unfinished letters are not held against it.
 */
export function countKeysAsChars(
  typed: string,
  target: string,
  creditPartial: boolean,
): {
  allCorrect: number;
  correctWord: number;
  incorrect: number;
  extra: number;
  missed: number;
} {
  const commit = /[ \n]$/;
  const committed = commit.test(typed);
  const counts = keyCounts(
    target.replace(commit, ""),
    typed.replace(commit, ""),
    !committed && creditPartial ? "cutoff" : "all",
    committed,
  );
  return {
    allCorrect: counts.correct,
    correctWord: counts.correct,
    incorrect: counts.incorrect,
    extra: counts.extra,
    missed: counts.missed,
  };
}
