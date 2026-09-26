import { getConfig } from "../config/store";
import { LOCALE_TAG, type UiLanguage } from "./ui-language";

/**
 * Every word the page says, in both languages it speaks.
 *
 * One flat table rather than a file per language: a string and its
 * translation sit on the same line, so a new one cannot be added in one
 * language and forgotten in the other, and `strings.spec.ts` has one place to
 * read. Keys are named for where the words appear.
 *
 * An entry whose text depends on a number is a function of that number in
 * both languages -- a language puts the count where its own grammar wants it,
 * which no amount of `%s` substitution gets right.
 *
 * Text the two languages spell the same way is not in here: `wpm`, `100%`,
 * `Caps Lock`, and the names of the palettes, which are proper nouns.
 */
const STRINGS = {
  // the footer
  sourceLink: { vi: "mã nguồn", en: "source" },
  switchLanguage: {
    vi: "switch to English",
    en: "chuyển sang tiếng Việt",
  },

  // the colours, beside the gear
  themeButton: { vi: "giao diện", en: "appearance" },
  themeMenu: { vi: "màu", en: "colours" },
  themeSystem: { vi: "tự động", en: "automatic" },
  themeGroupSystem: { vi: "theo máy", en: "by computer" },
  themeGroupLight: { vi: "màu sáng", en: "light" },
  themeGroupDark: { vi: "màu tối", en: "dark" },

  // the settings card
  settings: { vi: "cài đặt", en: "settings" },
  smoothCaret: { vi: "con trỏ mượt", en: "smooth caret" },
  smoothCaretHint: {
    vi: "con trỏ trượt sang chữ kế tiếp thay vì nhảy",
    en: "the caret slides to the next letter instead of jumping",
  },
  paceCaret: { vi: "con trỏ dẫn tốc", en: "pace caret" },
  paceCaretHint: {
    vi: "một con trỏ mờ chạy trước theo phần trăm tốc độ thường của bạn: 80% để tập cho thật chuẩn, 120% để ép nhanh hơn. Cần vài bài đã gõ mới biết tốc độ thường.",
    en: "a faint caret runs ahead at a share of your usual speed: 80% to drill accuracy, 120% to push. It needs a few tests before there is a usual speed to take.",
  },
  strictAccuracy: { vi: "chuẩn tuyệt đối", en: "strict" },
  strictAccuracyHint: {
    vi: "gõ sai một phím là bài dừng ngay: bài tập ép chính xác tuyệt đối, không phải cách gõ hằng ngày",
    en: "one wrong key ends the test: a drill for perfect accuracy, not a way to type every day",
  },
  fontSize: { vi: "cỡ chữ", en: "text size" },
  indicateTypos: { vi: "hiện phím gõ sai", en: "show typos" },
  indicateTyposHint: {
    vi: "chữ gõ nhầm hiện nhỏ dưới chữ đích",
    en: "the letter typed by mistake shows small under the right one",
  },
  randomTheme: { vi: "xoay màu", en: "rotate colours" },
  randomThemeHint: {
    vi: "mỗi bài mới lấy ngẫu nhiên một màu trong nhóm đã chọn",
    en: "every new test draws a palette from the chosen group",
  },
  keymap: { vi: "bàn phím ảo", en: "on-screen keyboard" },
  keymapHint: {
    vi: "bàn phím QWERTY dưới bài gõ, sáng lên theo phím",
    en: "a QWERTY keyboard under the words, lighting up as you type",
  },

  // the values those rows offer
  off: { vi: "tắt", en: "off" },
  on: { vi: "bật", en: "on" },
  slow: { vi: "chậm", en: "slow" },
  medium: { vi: "vừa", en: "medium" },
  fast: { vi: "nhanh", en: "fast" },
  rotateAuto: { vi: "theo máy", en: "by computer" },
  rotateLight: { vi: "màu sáng", en: "light" },
  rotateDark: { vi: "màu tối", en: "dark" },
  rotateAll: { vi: "lẫn lộn", en: "all" },

  // the options bar. English keeps its own name in the Vietnamese page, as it
  // always has; a name a reader recognises beats a translated one.
  modeTime: { vi: "thời gian", en: "time" },
  modeWords: { vi: "số từ", en: "words" },
  languageVietnamese: { vi: "tiếng việt", en: "vietnamese" },
  languageEnglish: { vi: "english", en: "english" },

  // the same bar on a narrow screen: one pill saying what is set, and the
  // card it opens, whose rows need the names the bar itself never showed
  testOptions: { vi: "tuỳ chọn bài gõ", en: "test options" },
  optionsLanguage: { vi: "ngôn ngữ", en: "language" },
  optionsMode: { vi: "kiểu", en: "mode" },
  optionsLength: { vi: "độ dài", en: "length" },

  // the buttons under the words, and on the result
  newTestHint: {
    vi: "bài mới · tab + enter",
    en: "new test · tab + enter",
  },
  restart: { vi: "gõ lại", en: "restart" },
  repeatTest: { vi: "gõ lại bài này", en: "repeat this test" },

  // the miss book drill
  drillRunningHint: {
    vi: "đang luyện từ hay sai · quay về bài thường",
    en: "drilling missed words · back to the normal test",
  },
  drillNeedsWords: {
    vi: (words: number) => `cần ít nhất ${words} từ trong sổ`,
    en: (words: number) => `needs at least ${words} words in the book`,
  },
  drillCount: {
    vi: (words: number) => `luyện ${words} từ hay sai`,
    en: (words: number) => `drill ${words} missed words`,
  },

  // the slow word book, on the result screen
  slowCaughtUp: { vi: "theo kịp", en: "at pace" },
  slowSlow: { vi: "chậm", en: "slow" },
  slowUnmeasured: { vi: "chưa đo", en: "not measured" },
  slowCaughtUpRule: {
    vi: (percent: number) =>
      `từ ${percent}% tốc độ bạn gõ các từ cùng độ dài trở lên`,
    en: (percent: number) =>
      `at ${percent}% or more of your speed on words as long`,
  },
  slowSlowRule: {
    vi: (percent: number) =>
      `gõ đúng nhưng dưới ${percent}% tốc độ bạn gõ các từ cùng độ dài`,
    en: (percent: number) =>
      `typed right, under ${percent}% of your speed on words as long`,
  },
  slowUnmeasuredRule: {
    vi: (times: number) => `cần gõ đúng ít nhất ${times} lần mới xét`,
    en: (times: number) => `judged once typed right ${times} times`,
  },
  slowPart: {
    vi: (part: string, words: number, share: number) =>
      `${part} · ${words} từ · ${share}% bộ từ`,
    en: (part: string, words: number, share: number) =>
      `${part} · ${words} words · ${share}% of the list`,
  },

  // the slow word drill
  slowDrillRunningHint: {
    vi: "đang luyện từ chậm · quay về bài thường",
    en: "drilling slow words · back to the normal test",
  },
  slowDrillCount: {
    vi: (words: number) => `luyện ${words} từ gõ đúng mà chậm`,
    en: (words: number) => `drill ${words} words typed right but slowly`,
  },

  // while typing
  repeatedTest: { vi: "bài gõ lại", en: "repeated test" },
  unfocusedWindow: {
    vi: "bấm vào đâu đó để quay lại cửa sổ",
    en: "click anywhere to come back to the window",
  },
  // one sentence in two halves, so a narrow screen breaks it between them
  // rather than wherever the words happen to run out
  unfocusedWordsTap: { vi: "bấm vào đây hoặc", en: "click here or" },
  unfocusedWordsType: {
    vi: "gõ một phím để tiếp tục",
    en: "press a key to carry on",
  },

  // the result screen
  accuracy: { vi: "chính xác", en: "accuracy" },
  words: { vi: "số từ", en: "words" },
  time: { vi: "thời gian", en: "time" },
  consistency: { vi: "đều tay", en: "consistency" },
  consistencyHover: {
    vi: "gõ càng đều nhịp càng cao; gõ giật từng đợt thì thấp, dù tốc độ có nhanh",
    en: "the steadier the rhythm the higher it is; bursts and pauses read low, however fast",
  },
  accuracyHover: {
    vi: (correct: number, incorrect: number) =>
      `${correct} đúng · ${incorrect} sai`,
    en: (correct: number, incorrect: number) =>
      `${correct} correct · ${incorrect} wrong`,
  },
  afkShare: {
    vi: (percent: number) => `${percent}% ngừng gõ`,
    en: (percent: number) => `${percent}% idle`,
  },
  afkHover: {
    vi: (seconds: number, percent: number) =>
      `ngừng gõ ${seconds}s (${percent}%)`,
    en: (seconds: number, percent: number) => `idle ${seconds}s (${percent}%)`,
  },
  timeHover: {
    vi: (duration: string, afk: number, percent: number) =>
      `${duration}s (${afk}s ngừng gõ, ${percent}%)`,
    en: (duration: string, afk: number, percent: number) =>
      `${duration}s (${afk}s idle, ${percent}%)`,
  },
  newBest: {
    vi: (diff: string) => `kỷ lục mới +${diff}`,
    en: (diff: string) => `new best +${diff}`,
  },

  // the book of recent tests under the result
  historyBest: { vi: "tốt nhất", en: "best" },
  historyUsual: { vi: "trung bình", en: "average" },
  historyPractice: { vi: "giờ luyện", en: "practice" },
  historyBestHint: {
    vi: "chỉ tính bài 60 giây hoặc 50 từ trở lên",
    en: "only tests of 60 seconds or 50 words and up",
  },
  practiceTime: {
    vi: (hours: number, minutes: number) =>
      hours === 0
        ? `${minutes} phút`
        : `${hours}h${`${minutes}`.padStart(2, "0")}`,
    en: (hours: number, minutes: number) =>
      hours === 0 ? `${minutes}m` : `${hours}h ${minutes}m`,
  },
  historyBar: {
    vi: (speed: string, acc: number, when: string) =>
      `${speed} wpm · ${acc}% chính xác\n${when}`,
    en: (speed: string, acc: number, when: string) =>
      `${speed} wpm · ${acc}% accuracy\n${when}`,
  },

  // why a test was not kept
  invalid: { vi: "không hợp lệ", en: "not valid" },
  notSavedBecause: { vi: "không lưu vào sổ vì:", en: "not saved because:" },
  failedSlowTimer: {
    vi: "máy chạy chậm, đồng hồ trễ nên bài bị dừng",
    en: "the computer is slow, the clock lagged and the test was stopped",
  },
  failedStrict: {
    vi: "gõ sai một phím, bài dừng vì đang bật chuẩn tuyệt đối",
    en: "a wrong key, and the strict setting stopped the test",
  },
  failed: {
    vi: (reason: string) => `không đạt (${reason})`,
    en: (reason: string) => `failed (${reason})`,
  },
  tooShort: {
    vi: "bài xong trong chưa tới 1 giây",
    en: "over in under a second",
  },
  afkDetected: {
    vi: "5 giây cuối không gõ phím nào",
    en: "no key in the last five seconds",
  },
  idlePause: {
    vi: (seconds: number) => `có lúc ngừng gõ liền ${seconds} giây`,
    en: (seconds: number) => `a stop of ${seconds} seconds partway through`,
  },
  idleShare: {
    vi: (percent: number) => `ngừng gõ ${percent}% thời gian bài`,
    en: (percent: number) => `idle for ${percent}% of the test`,
  },
  sameTestAgain: {
    vi: "gõ lại đúng bài vừa rồi",
    en: "the very same test again",
  },
  tooFast: {
    vi: (wpm: number) => `tốc độ trên ${wpm} wpm`,
    en: (wpm: number) => `speed over ${wpm} wpm`,
  },
  rawTooFast: {
    vi: (wpm: number) => `tốc độ thô trên ${wpm} wpm`,
    en: (wpm: number) => `raw speed over ${wpm} wpm`,
  },
  accTooLow: { vi: "độ chính xác dưới 75%", en: "accuracy under 75%" },
  clockDisagrees: {
    vi: "thời gian đo lệch với đồng hồ của máy",
    en: "the measured time disagrees with the computer's clock",
  },

  // a test that could not be built at all
  buildFailed: {
    vi: "Không dựng được bài gõ.",
    en: "Could not build the test.",
  },
  buildFailedRetry: {
    vi: "Không dựng được bài gõ. Bấm gõ lại để thử lần nữa.",
    en: "Could not build the test. Press restart to try again.",
  },
  wordsUnreachable: {
    vi: "Không tải được danh sách từ. Kiểm tra mạng rồi bấm gõ lại.",
    en: "Could not load the word list. Check the network, then press restart.",
  },
  makeFailedRetry: {
    vi: "Không tạo được bài gõ. Bấm gõ lại để thử lần nữa.",
    en: "Could not make the test. Press restart to try again.",
  },

  // the tab
  pageTitle: {
    vi: "beartype · đo tốc độ gõ tiếng Việt",
    en: "beartype · typing speed test",
  },
} as const;

export type StringKey = keyof typeof STRINGS;

/** Every key, to check one read out of the markup against; see dom-strings.ts. */
export const STRING_KEYS = Object.keys(STRINGS) as readonly StringKey[];

/** The arguments a key wants, read off its Vietnamese entry. */
type Args<K extends StringKey> = (typeof STRINGS)[K]["vi"] extends (
  ...args: infer A
) => string
  ? A
  : [];

/** The language the page is in right now. */
export function uiLanguage(): UiLanguage {
  return getConfig.uiLanguage;
}

/**
 * What the page says for `key`, in the language it is in.
 *
 * Reading the config store here is what makes the SolidJS half redraw on its
 * own: a `{t("newTest")}` in JSX compiles to a getter, so the call runs again
 * when the language changes. The vanilla half redraws when it is next built,
 * which for the result screen and the words is every test.
 */
export function t<K extends StringKey>(key: K, ...args: Args<K>): string {
  // the table holds one entry per key, each with its own arguments; `Args`
  // has already tied those to `key` at the call, and no single signature
  // describes the whole column, so the narrowing happens here
  const entry: string | ((...args: Args<K>) => string) = STRINGS[key][
    uiLanguage()
  ] as unknown as string | ((...args: Args<K>) => string);
  return typeof entry === "function" ? entry(...args) : entry;
}

/** The tag to hand `toLocaleString`, so numbers and dates read the same way. */
export function locale(): string {
  return LOCALE_TAG[uiLanguage()];
}

export { STRINGS as stringsForTests };
