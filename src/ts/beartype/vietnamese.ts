// Ported from keybear (packages/keybr-unicode/lib/vietnamese.ts), where the
// Vietnamese scoring this app uses was worked out. Keep the two in step.
/**
 * Một chữ tiếng Việt có dấu không ra đời bằng một phím. Bộ gõ (Telex, VNI) dựng
 * nó dần dần bằng cách *viết lại* ô nhập: gõ `e` `e` `s` thì ô nhập lần lượt
 * mang `e`, rồi `ê`, rồi `ế`.
 *
 * Mọi trang đo tốc độ gõ của nước ngoài đều chấm từng phím một, nên hai bước
 * đầu của chuỗi ấy bị đánh là sai và độ chính xác của người gõ tiếng Việt không
 * bao giờ phản ánh đúng cái họ làm. Ở đây chữ đang gõ dở không phải *sai*, nó
 * là *chưa xong*: `e` khi đích là `ế` nằm trên đường tới đích, và nó được tính
 * đúng một phím tiến bộ.
 *
 * Bảng phân rã không viết tay mà suy ra từ Unicode: dạng NFD của một chữ Việt
 * là chữ cái gốc cộng tối đa hai dấu tổ hợp (dấu hình -- mũ, á, móc -- và dấu
 * thanh). Bỏ bớt *một* dấu rồi ghép lại NFC cho ra đúng những trạng thái trung
 * gian mà bộ gõ đi qua. `đ` là ngoại lệ duy nhất: U+0111 không phân rã được.
 */

/**
 * Các dấu tổ hợp của chữ quốc ngữ: mũ, á, móc, và năm dấu thanh.
 *
 * Một dấu **được gọi tên bằng chính ký tự tổ hợp của nó**, không bằng một mã
 * tự đặt (`"acute"`, `"sac"`). Bảng này đã là bảng phân loại rồi, và đặt thêm
 * một bộ tên nữa lên trên nó là dựng hai từ vựng cho một khái niệm, để rồi
 * phải có một chỗ dịch qua lại -- chỗ ấy sai một dòng là cả một bài học dạy
 * nhầm dấu.
 */
export const MARKS = new Set([
  "̂", // dấu mũ: â ê ô
  "̆", // dấu á (breve): ă
  "̛", // dấu móc (horn): ơ ư
  "̀", // huyền
  "́", // sắc
  "̃", // ngã
  "̉", // hỏi
  "̣", // nặng
]);

/**
 * Nét gạch của `đ`, thứ Unicode không phân rã được, nên nó không có ký tự tổ
 * hợp nào để mang tên. Lấy luôn chính chữ `đ` làm tên của dấu ấy -- xem `MARKS`
 * về việc vì sao không đặt tên riêng.
 */
export const STROKE_MARK = "đ";

/** Chữ có nét gạch, thứ Unicode không phân rã được. */
const STROKE = new Map([
  ["đ", "d"],
  ["Đ", "D"],
]);

/**
 * Những trạng thái ngay trước `char` trên đường bộ gõ dựng nó -- bỏ đi đúng một
 * dấu, theo mọi cách bỏ được.
 *
 * Chữ mang cả dấu hình lẫn dấu thanh có *hai* cha, và cả hai đều đúng: Telex
 * cho gõ `ee`+`s` (ê → ế) hay `es`+`e` (é → ế), người gõ chọn thứ tự nào là
 * việc của họ.
 */
function parentsOf(char: string): readonly string[] {
  const stroke = STROKE.get(char);
  if (stroke !== undefined) {
    return [stroke];
  }
  const nfd = char.normalize("NFD");
  const marks = [...nfd].slice(1);
  if (marks.length === 0 || !marks.every((mark) => MARKS.has(mark))) {
    return [];
  }
  const base = [...nfd][0];
  return marks.map((_, index) =>
    (base + marks.filter((_, other) => other !== index).join("")).normalize(
      "NFC",
    ),
  );
}

/**
 * Mọi trạng thái trung gian của `target`, kèm số bước còn lại từ đó tới đích.
 * Chính `target` đứng ở bước 0.
 */
function chainOf(target: string): ReadonlyMap<string, number> {
  const cached = chains.get(target);
  if (cached !== undefined) {
    return cached;
  }
  const chain = new Map([[target, 0]]);
  const walk = (char: string, depth: number): void => {
    for (const parent of parentsOf(char)) {
      const seen = chain.get(parent);
      if (seen === undefined || seen > depth + 1) {
        chain.set(parent, depth + 1);
        walk(parent, depth + 1);
      }
    }
  };
  walk(target, 0);
  chains.set(target, chain);
  return chain;
}

const chains = new Map<string, ReadonlyMap<string, number>>();

/**
 * `typed` còn cách `target` mấy lần viết lại nữa: 0 là đã tới đích, số dương là
 * đang trên đường, `-1` là gõ nhầm hẳn sang chữ khác.
 */
export function stepsToward(target: string, typed: string): number {
  return chainOf(target).get(typed) ?? -1;
}

/** Số phím dấu mà `char` đòi thêm ngoài chữ cái gốc: `a` 0, `ạ` 1, `ế` 2. */
export function markCount(char: string): number {
  let max = 0;
  for (const depth of chainOf(char).values()) {
    max = Math.max(max, depth);
  }
  return max;
}

/**
 * Những dấu một chữ đang đội: `a` không dấu nào, `ạ` một, `ế` hai (mũ và sắc),
 * `đ` một (nét gạch). Đây là thứ giáo trình học dấu lọc từ theo -- xem
 * `telexsteps.ts`.
 */
export function marksOf(char: string): readonly string[] {
  if (STROKE.has(char)) {
    return [STROKE_MARK];
  }
  const marks = [...char.normalize("NFD")].slice(1);
  return marks.every((mark) => MARKS.has(mark)) ? marks : [];
}

const TONES = "̣̀́̃̉";

/**
 * Hai lối bỏ dấu thanh, thứ chia đôi cách viết `hoà` và `hòa`.
 *
 * `"new"` là lối từ điển đang viết -- dấu rơi vào nguyên âm **sau**: `hoà`
 * `khoá` `thuỷ`. `"old"` là lối phần lớn bộ gõ viết ra -- dấu rơi vào nguyên âm
 * **trước**: `hòa` `khóa` `thủy`.
 *
 * Lối nào không phải lựa chọn của trang web: nó là một ô đánh dấu trong bộ gõ
 * của máy. Nên trang này không chọn thay, nó **dò xem máy viết lối nào** rồi
 * bày từ theo đúng lối ấy -- xem `ime-check.ts`.
 */
export type ToneStyle = "new" | "old";

/**
 * Lối bỏ dấu của `word`, hay `null` nếu từ ấy hai lối viết như nhau.
 *
 * Chỗ tranh chấp hẹp, và ba điều kiện này là toàn bộ nó: âm tiết **mở** kết
 * thúc bằng `oa` `oe` `uy`, có mang dấu thanh, và phụ âm đầu không phải `qu`.
 * Có âm cuối (`toàn`) hay có sẵn nguyên âm đội mũ (`chuyện`) thì chỉ còn một
 * chỗ đặt dấu được; ở `quý` thì `u` thuộc về `qu` nên cũng vậy. Trong
 * `words-vi.json` còn đúng 47 từ trên 4694.
 *
 * Ở dạng NFD, đuôi tranh chấp luôn là ba ký tự cuối, và hai lối chỉ khác nhau ở
 * chỗ hoán vị hai ký tự cuối: `[v1 v2 dấu]` là lối mới, `[v1 dấu v2]` là lối cũ.
 */
export function toneStyleOf(word: string): ToneStyle | null {
  const nfd = [...word.normalize("NFD")];
  if (nfd.length < 3) {
    return null;
  }
  const [first = "", second = "", third = ""] = nfd.slice(-3);
  let style: ToneStyle;
  let vowels: string;
  if (TONES.includes(third) && !MARKS.has(first) && !MARKS.has(second)) {
    style = "new";
    vowels = first + second;
  } else if (TONES.includes(second) && !MARKS.has(first) && !MARKS.has(third)) {
    style = "old";
    vowels = first + third;
  } else {
    return null;
  }
  if (!/^(oa|oe|uy)$/.test(vowels.toLowerCase())) {
    return null;
  }
  const bare = nfd.filter((char) => !MARKS.has(char)).join("");
  return bare.toLowerCase().endsWith("quy") ? null : style;
}

/** `word` viết theo lối `style`; từ nào hai lối viết như nhau thì giữ nguyên. */
export function withToneStyle(word: string, style: ToneStyle): string {
  const current = toneStyleOf(word);
  if (current === null || current === style) {
    return word;
  }
  // toneStyleOf only answers for words whose NFD ends in three characters,
  // and the two styles differ by swapping the last two of them.
  const nfd = [...word.normalize("NFD")];
  const tail = nfd.splice(-2);
  return [...nfd, ...tail.reverse()].join("").normalize("NFC");
}
