/**
 * Writes static/languages/vietnamese.json from keybear's word list.
 *
 *   pnpm tsx scripts/build-vietnamese.ts ~/Documents/GitHub/keybear
 *
 * Upstream's Vietnamese lists are not the ones typed here. keybear sieved its
 * own out of OpenSubtitles frequency counts, and its speed test draws from the
 * 600 most frequent words plus a hand-picked supplement; this does the same, so
 * the two apps put the same words in front of the same hands.
 *
 * Every word is written with the tone on the main vowel (`hoà`, `khoẻ`,
 * `thuỷ`), and the list is deduplicated afterwards: keybear's list carries
 * both spellings of about fifty words (`khỏe` and `khoẻ`), which would
 * otherwise come out as the same word twice as often as any other.
 */
import fs from "node:fs";
import path from "node:path";
import { withToneStyle } from "../src/ts/beartype/vietnamese";

/** How far down the frequency list the test reaches -- keybear's COMMON_WORDS. */
const COMMON_WORDS = 600;

/**
 * Words people type all the time that sit below COMMON_WORDS in the frequency
 * list. Copied from keybear's typetest/common-words.ts, which took them from
 * upstream's hand-picked 319-word list minus names and word fragments.
 */
const SUPPLEMENT = [
  "sướng",
  "bếp",
  "khóa",
  "toán",
  "hóa",
  "hạnh",
  "phúc",
  "nắng",
  "kính",
  "tức",
  "bực",
  "hành",
  "vật",
  "đấu",
  "bơi",
  "lịch",
  "quê",
  "ngọt",
  "đỉnh",
  "tham",
  "cơm",
  "gạo",
  "phương",
  "giáo",
  "thương",
  "xây",
  "dựng",
  "trình",
  "hoài",
  "suối",
  "chấm",
  "trần",
  "chăm",
  "giới",
  "kinh",
  "tia",
  "hợp",
  "tờ",
  "trí",
  "xinh",
  "an",
  "cảm",
  "chi",
  "im",
  "khăn",
  "giành",
  "ba",
  "ơn",
  "chim",
  "khóc",
  "lành",
  "ký",
  "bão",
  "dạ",
  "ẩm",
  "thực",
  "quần",
  "nội",
  "minh",
  "chia",
  "sẻ",
  "nghệ",
  "thang",
  "sơ",
  "đàn",
  "sáo",
  "gió",
  "quốc",
  "ngữ",
  "văn",
  "mưa",
  "đơn",
  "hạt",
  "bướm",
  "hoàn",
  "phố",
  "thuật",
  "tích",
  "giả",
  "tai",
  "mì",
  "hồng",
  "một",
  "hai",
  "mỗi",
  "mực",
  "bút",
  "tắt",
  "đành",
  "tivi",
  "cộng",
  "trừ",
];

const keybear = process.argv[2];
if (keybear === undefined) {
  console.error("usage: tsx scripts/build-vietnamese.ts <path to keybear>");
  process.exit(1);
}

const source = path.join(
  keybear,
  "packages/keybr-content-words/lib/data/words-vi.json",
);
const frequent = (JSON.parse(fs.readFileSync(source, "utf8")) as string[])
  .map((word) => word.normalize("NFC"))
  // The list is built from a real corpus, so its head holds single letters
  // (`t`, `i`, `b`) left over from word splitting. They are not words.
  .filter((word) => [...word].length > 1)
  .slice(0, COMMON_WORDS);

const words = [
  ...new Set(
    [...frequent, ...SUPPLEMENT].map((word) =>
      withToneStyle(word.normalize("NFC"), "new"),
    ),
  ),
];

const target = path.join(
  import.meta.dirname,
  "../static/languages/vietnamese.json",
);
const current = JSON.parse(fs.readFileSync(target, "utf8")) as {
  additionalAccents: unknown;
};

fs.writeFileSync(
  target,
  `${JSON.stringify(
    {
      name: "vietnamese",
      additionalAccents: current.additionalAccents,
      words,
    },
    null,
    2,
  )}\n`,
);
console.log(`wrote ${words.length} words to ${target}`);
