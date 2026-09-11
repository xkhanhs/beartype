//TODO: use Format
import { Chart, type PluginChartOptions } from "chart.js";

import { Config } from "../config/store";
import { setConfig } from "../config/setters";
import * as ChartController from "../controllers/chart-controller";
import { Quote } from "../controllers/quotes-controller";
// beartype: results live in this browser, not in an account snapshot
import * as DB from "../beartype/local-results";

import {
  showNoticeNotification,
  showSuccessNotification,
} from "../states/notifications";
import { getCustomTextIndicator } from "../states/core";
import * as GlarsesMode from "../legacy-states/glarses-mode";
import * as SlowTimer from "../legacy-states/slow-timer";
import * as DateTime from "../utils/date-and-time";
import * as Misc from "../utils/misc";
import * as Strings from "../utils/strings";
import * as Numbers from "@monkeytype/util/numbers";
import * as Arrays from "../utils/arrays";
import { get as getTypingSpeedUnit } from "../utils/typing-speed-units";
import * as PbCrown from "./pb-crown";
import * as TestUI from "./test-ui";
import * as TodayTracker from "./today-tracker";
import { configEvent } from "../events/config";
import * as Focus from "./focus";
import * as CustomText from "./custom-text";
import * as Funbox from "./funbox/funbox";
import Format from "../singletons/format";
import confetti from "canvas-confetti";
import type { AnnotationOptions } from "chartjs-plugin-annotation";
import { CompletedEvent } from "@monkeytype/schemas/results";
import { getActiveFunboxes, isFunboxActiveWithProperty } from "./funbox/list";
import { getFunbox } from "@monkeytype/funbox";
import { canQuickRestart as canQuickRestartFn } from "../utils/quick-restart";
import { LocalStorageWithSchema } from "../utils/local-storage-with-schema";
import { z } from "zod";
import { blurInputElement } from "../input/input-element";
import { qs, qsa } from "../utils/dom";
import { getTheme } from "../states/theme";
import {
  getLastEventLog,
  getResultVisible,
  isTestInvalid,
  setResultCalculating,
} from "../states/test";
import {
  getAccuracy,
  getInputHistory,
  getRawHistory,
  getTimerBoundaryLabels,
} from "./events/stats";
import { setResultHistory } from "../components/beartype/ResultHistory";

let result: CompletedEvent;
let minChartVal: number;
let maxChartVal: number;

let useSmoothedBurst = true;
let useFakeChartData = false;

export function toggleSmoothedBurst(): void {
  useSmoothedBurst = !useSmoothedBurst;
  showSuccessNotification(useSmoothedBurst ? "on" : "off");
  if (getResultVisible()) {
    void updateChartData().then(() => {
      ChartController.result.update("resize");
    });
  }
}

export function toggleUserFakeChartData(): void {
  useFakeChartData = !useFakeChartData;
  showSuccessNotification(useFakeChartData ? "on" : "off");
  if (getResultVisible()) {
    void updateChartData().then(() => {
      ChartController.result.update("resize");
    });
  }
}

let resultAnnotation: AnnotationOptions<"line">[] = [];

async function updateChartData(): Promise<void> {
  const eventLog = getLastEventLog();
  if (result.chartData === "toolong" || eventLog === null) {
    ChartController.result.getDataset("wpm").data = [];
    ChartController.result.getDataset("raw").data = [];
    ChartController.result.getDataset("burst").data = [];
    ChartController.result.getDataset("error").data = [];
    return;
  }

  const typingSpeedUnit = getTypingSpeedUnit(Config.typingSpeedUnit);
  ChartController.result.getScale("wpm").title.text =
    typingSpeedUnit.fullUnitString;

  const labels = getTimerBoundaryLabels(eventLog, false);

  const chartData1 = [
    ...result.chartData.wpm.map((a) =>
      Numbers.roundTo2(typingSpeedUnit.fromWpm(a)),
    ),
  ];

  const chartData2 = getRawHistory(eventLog).map((a) =>
    Numbers.roundTo2(typingSpeedUnit.fromWpm(a)),
  );

  const valueWindow = Math.max(...result.chartData.burst) * 0.25;
  let smoothedBurst = Arrays.smoothWithValueWindow(
    result.chartData.burst,
    1,
    useSmoothedBurst ? valueWindow : 0,
  );

  const chartData3 = [
    ...smoothedBurst.map((a) => Numbers.roundTo2(typingSpeedUnit.fromWpm(a))),
  ];

  const subcolor = getTheme().sub;

  if (Config.funbox.length > 0) {
    let content = "";
    for (const fb of getActiveFunboxes()) {
      content += fb.name;
      if (fb.functions?.getResultContent) {
        content += `(${fb.functions.getResultContent()})`;
      }
      content += " ";
    }
    content = content.trimEnd();
    resultAnnotation.push({
      display: true,
      id: "funbox-label",
      type: "line",
      scaleID: "wpm",
      value: ChartController.result.getScale("wpm").min,
      borderColor: "transparent",
      borderWidth: 1,
      borderDash: [2, 2],
      label: {
        backgroundColor: "transparent",
        font: {
          family: Config.fontFamily.replace(/_/g, " "),
          size: 11,
          style: "normal",
          weight: Chart.defaults.font.weight as string,
          lineHeight: Chart.defaults.font.lineHeight as number,
        },
        color: subcolor,
        padding: 3,
        borderRadius: 3,
        position: "start",
        display: true,
        content: `${content}`,
      },
    });
  }

  ChartController.result.data.labels = labels;

  ChartController.result.getDataset("wpm").data = chartData1;
  ChartController.result.getDataset("wpm").label = Config.typingSpeedUnit;

  ChartController.result.getDataset("raw").data = chartData2;

  ChartController.result.getDataset("burst").data = chartData3;

  ChartController.result.getDataset("error").data = result.chartData.err;
  ChartController.result.getScale("error").max = Math.max(
    ...result.chartData.err,
  );

  if (useFakeChartData) {
    applyFakeChartData();
  }
}

function applyFakeChartData(): void {
  const fakeChartData = {
    wpm: [
      108, 120, 116, 114, 113, 120, 118, 121, 119, 120, 116, 118, 113, 110, 108,
      110, 107, 107, 108, 109, 110, 112, 114, 112, 111, 109, 110, 108, 108, 109,
    ],
    raw: [
      108, 120, 116, 114, 113, 120, 123, 127, 131, 131, 131, 132, 130, 133, 134,
      134, 131, 129, 129, 128, 129, 130, 131, 129, 129, 127, 127, 128, 127, 127,
    ],
    burst: [
      108, 132, 108, 108, 108, 156, 144, 156, 156, 132, 132, 144, 108, 168, 156,
      132, 96, 108, 120, 120, 144, 156, 144, 84, 132, 84, 132, 156, 108, 120,
    ],
    err: [
      0, 0, 0, 0, 0, 0, 3, 1, 3, 0, 5, 0, 3, 5, 4, 0, 2, 0, 0, 0, 0, 0, 0, 1, 2,
      1, 0, 4, 0, 0,
    ],
  };

  const labels = fakeChartData.wpm.map((_, i) => (i + 1).toString());

  const typingSpeedUnit = getTypingSpeedUnit(Config.typingSpeedUnit);

  const chartData1 = [
    ...fakeChartData.wpm.map((a) =>
      Numbers.roundTo2(typingSpeedUnit.fromWpm(a)),
    ),
  ];

  const chartData2 = [
    ...fakeChartData.raw.map((a) =>
      Numbers.roundTo2(typingSpeedUnit.fromWpm(a)),
    ),
  ];

  const chartData3 = [
    ...fakeChartData.burst.map((a) =>
      Numbers.roundTo2(typingSpeedUnit.fromWpm(a)),
    ),
  ];

  maxChartVal = Math.max(
    ...[
      Math.max(...chartData1),
      Math.max(...chartData2),
      Math.max(...chartData3),
    ],
  );

  let minChartVal = 0;

  if (!Config.startGraphsAtZero) {
    minChartVal = Math.min(
      ...[
        Math.min(...chartData1),
        Math.min(...chartData2),
        Math.min(...chartData3),
      ],
    );

    // Round down to nearest multiple of 10
    minChartVal = Math.floor(minChartVal / 10) * 10;
  }

  ChartController.result.data.labels = labels;

  ChartController.result.getDataset("wpm").data = chartData1;
  ChartController.result.getDataset("wpm").label = Config.typingSpeedUnit;
  ChartController.result.getScale("wpm").min = minChartVal;
  ChartController.result.getScale("wpm").max = maxChartVal;

  ChartController.result.getDataset("raw").data = chartData2;
  ChartController.result.getScale("raw").min = minChartVal;
  ChartController.result.getScale("raw").max = maxChartVal;

  ChartController.result.getDataset("burst").data = chartData3;
  ChartController.result.getScale("burst").min = minChartVal;
  ChartController.result.getScale("burst").max = maxChartVal;

  ChartController.result.getDataset("error").data = fakeChartData.err;
  ChartController.result.getScale("error").max = Math.max(...fakeChartData.err);
}

export async function updateChartPBLine(): Promise<void> {
  const themecolors = getTheme();
  const localPb = DB.getLocalPB(
    result.mode,
    result.mode2,
    result.punctuation ?? false,
    result.numbers ?? false,
    result.language,
    result.difficulty,
    result.lazyMode ?? false,
    getFunbox(result.funbox),
  );
  const localPbWpm = localPb?.wpm ?? 0;
  if (localPbWpm === 0) return;
  const typingSpeedUnit = getTypingSpeedUnit(Config.typingSpeedUnit);
  const chartlpb = Numbers.roundTo2(
    typingSpeedUnit.fromWpm(localPbWpm),
  ).toFixed(2);
  resultAnnotation.push({
    display: true,
    type: "line",
    id: "lpb",
    scaleID: "wpm",
    value: chartlpb,
    borderColor: `${themecolors.sub}55`,
    borderWidth: 1,
    // borderDash: [4, 16],
    label: {
      backgroundColor: themecolors.sub,
      font: {
        family: Config.fontFamily.replace(/_/g, " "),
        size: 11,
        style: "normal",
        weight: Chart.defaults.font.weight as string,
        lineHeight: Chart.defaults.font.lineHeight as number,
      },
      color: themecolors.bg,
      padding: 3,
      borderRadius: 3,
      position: "center",
      content: ` PB: ${chartlpb} `,
      display: true,
    },
  });
}

function updateWpmAndAcc(): void {
  let inf = false;
  if (result.wpm >= 1000) {
    inf = true;
  }

  qs("#result .stats .wpm .top .text")?.setText(Config.typingSpeedUnit);

  if (inf) {
    qs("#result .stats .wpm .bottom")?.setText("∞");
  } else {
    qs("#result .stats .wpm .bottom")?.setText(Format.typingSpeed(result.wpm));
  }
  qs("#result .stats .raw .bottom")?.setText(Format.typingSpeed(result.rawWpm));
  // beartype: one decimal, as in keybear -- a ten-word test has a key or two
  // under sixty, so one missed key moves the figure by well over a point and
  // two different tests would round to the same whole number. Rounded down,
  // as upstream does, so a test with a miss never reads 100.
  qs("#result .stats .acc .bottom")?.setText(
    result.acc === 100 ? "100%" : `${oneDecimal(result.acc, Math.floor)}%`,
  );

  const accEventLog = getLastEventLog();
  if (accEventLog !== null) {
    const acc = getAccuracy(accEventLog);
    if (Config.alwaysShowDecimalPlaces) {
      if (Config.typingSpeedUnit !== "wpm") {
        qs("#result .stats .wpm .bottom")?.setAttribute(
          "aria-label",
          `${result.wpm.toFixed(2)} wpm`,
        );
        qs("#result .stats .raw .bottom")?.setAttribute(
          "aria-label",
          `${result.rawWpm.toFixed(2)} wpm`,
        );
      } else {
        qs("#result .stats .wpm .bottom")?.removeAttribute("aria-label");
        qs("#result .stats .raw .bottom")?.removeAttribute("aria-label");
      }

      let time = `${Numbers.roundTo2(result.testDuration).toFixed(2)}s`;
      if (result.testDuration > 61) {
        time = DateTime.secondsToString(Numbers.roundTo2(result.testDuration));
      }
      qs("#result .stats .time .bottom .text")?.setText(time);
      // qs("#result .stats .acc .bottom")?.removeAttribute("aria-label");

      qs("#result .stats .acc .bottom")?.setAttribute(
        "aria-label",
        `${acc.correct} đúng\n${acc.incorrect} sai`,
      );
    } else {
      //not showing decimal places
      const decimalsAndSuffix = {
        showDecimalPlaces: true,
        suffix: ` ${Config.typingSpeedUnit}`,
      };
      let wpmHover = Format.typingSpeed(result.wpm, decimalsAndSuffix);
      let rawWpmHover = Format.typingSpeed(result.rawWpm, decimalsAndSuffix);

      if (Config.typingSpeedUnit !== "wpm") {
        wpmHover += ` (${result.wpm.toFixed(2)} wpm)`;
        rawWpmHover += ` (${result.rawWpm.toFixed(2)} wpm)`;
      }

      qs("#result .stats .wpm .bottom")?.setAttribute("aria-label", wpmHover);
      qs("#result .stats .raw .bottom")?.setAttribute(
        "aria-label",
        rawWpmHover,
      );

      qs("#result .stats .acc .bottom")
        ?.setAttribute(
          "aria-label",
          `${
            result.acc === 100
              ? "100%"
              : Format.percentage(result.acc, { showDecimalPlaces: true })
          }\n${acc.correct} đúng\n${acc.incorrect} sai`,
        )
        ?.setAttribute("data-balloon-break", "");
    }
  }
}

function updateConsistency(): void {
  qs("#result .stats .consistency .bottom")?.setText(
    Format.percentage(result.consistency),
  );
  if (Config.alwaysShowDecimalPlaces) {
    qs("#result .stats .consistency .bottom")?.setAttribute(
      "aria-label",
      Format.percentage(result.keyConsistency, {
        showDecimalPlaces: true,
        suffix: " key",
      }),
    );
  } else {
    qs("#result .stats .consistency .bottom")?.setAttribute(
      "aria-label",
      `${result.consistency}% (${result.keyConsistency}% key)`,
    );
  }
}

function updateTime(): void {
  const afkSecondsPercent = Numbers.roundTo2(
    (result.afkDuration / result.testDuration) * 100 || 0,
  );
  qs("#result .stats .time .bottom .afk")?.setText("");
  if (afkSecondsPercent > 0) {
    qs("#result .stats .time .bottom .afk")?.setText(
      `${afkSecondsPercent}% ngừng gõ`,
    );
  }
  qs("#result .stats .time .bottom")?.setAttribute(
    "aria-label",
    `ngừng gõ ${result.afkDuration}s (${afkSecondsPercent}%)`,
  );

  if (Config.alwaysShowDecimalPlaces) {
    let time = `${Numbers.roundTo2(result.testDuration).toFixed(2)}s`;
    if (result.testDuration > 61) {
      time = DateTime.secondsToString(Numbers.roundTo2(result.testDuration));
    }
    qs("#result .stats .time .bottom .text")?.setText(time);
  } else {
    // beartype: up to one decimal, as in keybear: half a second is a real
    // difference between two runs of the same words
    let time = `${oneDecimal(result.testDuration, Math.round)}s`;
    if (result.testDuration > 61) {
      time = DateTime.secondsToString(Math.round(result.testDuration));
    }
    qs("#result .stats .time .bottom .text")?.setText(time);
    qs("#result .stats .time .bottom")?.setAttribute(
      "aria-label",
      `${Numbers.roundTo2(result.testDuration)}s (${
        result.afkDuration
      }s ngừng gõ, ${afkSecondsPercent}%)`,
    );
  }
}

export function updateTodayTracker(): void {
  qs("#result .stats .time .bottom .timeToday")?.setText(
    TodayTracker.getString(),
  );
}

// beartype: at most one decimal, written the Vietnamese way (96,5)
function oneDecimal(value: number, round: (n: number) => number): string {
  return (round(value * 10) / 10).toLocaleString("vi-VN", {
    maximumFractionDigits: 1,
  });
}

// beartype: the words typed, the second of keybear's two small figures
function updateWords(): void {
  const eventLog = getLastEventLog();
  const words =
    eventLog === null
      ? undefined
      : getInputHistory(eventLog).filter((word) => word !== "").length;
  qs("#result .stats .words .bottom")?.setText(
    words === undefined ? "-" : `${words}`,
  );
}

// beartype: best and usual speed over the last tests on this browser, so the
// number just typed has something to be read against
function updateRecent(dontSave: boolean): void {
  if (Config.mode === "custom" || Config.mode === "zen") {
    setResultHistory(null);
    return;
  }
  setResultHistory(
    DB.recentSummary(
      {
        mode: result.mode,
        mode2: result.mode2,
        punctuation: result.punctuation ?? false,
        numbers: result.numbers ?? false,
        language: result.language,
        difficulty: result.difficulty,
        lazyMode: result.lazyMode ?? false,
      },
      // an invalid test is not kept, so it does not count here either
      dontSave
        ? null
        : { wpm: result.wpm, acc: result.acc, timestamp: result.timestamp },
    ),
  );
}

function updateKey(): void {
  qs("#result .stats .key .bottom")?.setText(
    `${result.charStats[0]}/${result.charStats[1]}/${result.charStats[2]}/${
      result.charStats[3]
    }`,
  );
}

export function showCrown(type: PbCrown.CrownType): void {
  PbCrown.show();
  PbCrown.update(type);
}

export function updateCrownText(text: string): void {
  qs("#result .stats .wpm .crown")?.setAttribute("aria-label", text);
}

export async function updateCrown(dontSave: boolean): Promise<void> {
  // beartype: a drill from the miss book is practice, not a test with a best
  if (Config.mode === "quote" || Config.mode === "custom" || dontSave) {
    hideCrown();
    return;
  }

  let pbDiff = 0;
  const canGetPb = await resultCanGetPb();

  console.debug("Result can get PB:", canGetPb.value, canGetPb.reason ?? "");

  if (canGetPb.value) {
    const localPb = DB.getLocalPB(
      Config.mode,
      result.mode2,
      Config.punctuation,
      Config.numbers,
      Config.language,
      Config.difficulty,
      Config.lazyMode,
      getActiveFunboxes(),
    );
    const localPbWpm = localPb?.wpm ?? 0;
    pbDiff = result.wpm - localPbWpm;
    console.debug("Local PB", localPb, "diff", pbDiff);
    if (pbDiff <= 0) {
      hideCrown();
      console.debug("Hiding crown");
    } else {
      // beartype: this browser keeps the only record, so a new best is
      // final -- upstream showed a half crown until its server agreed
      console.debug("Showing new pb crown");
      showCrown("normal");
      updateCrownText(
        `kỷ lục mới +${Format.typingSpeed(pbDiff, { showDecimalPlaces: true })}`,
      );
      if (localPb !== undefined) showConfetti();
    }
  } else {
    const localPb = DB.getLocalPB(
      Config.mode,
      result.mode2,
      Config.punctuation,
      Config.numbers,
      Config.language,
      Config.difficulty,
      Config.lazyMode,
      [],
    );
    const localPbWpm = localPb?.wpm ?? 0;
    pbDiff = result.wpm - localPbWpm;
    console.debug("Local PB", localPb, "diff", pbDiff);
    if (pbDiff <= 0) {
      // hideCrown();
      console.debug("Showing warning crown");
      showCrown("warning");
      updateCrownText(`bài này không tính kỷ lục (${canGetPb.reason})`);
    } else {
      console.debug("Showing ineligible crown");
      showCrown("ineligible");
      updateCrownText(
        `nhanh hơn kỷ lục +${Format.typingSpeed(pbDiff, {
          showDecimalPlaces: true,
        })}, nhưng cài đặt này không tính kỷ lục (${canGetPb.reason})`,
      );
    }
  }
}

export function hideCrown(): void {
  PbCrown.hide();
  updateCrownText("");
}

export function showErrorCrownIfNeeded(): void {
  if (PbCrown.getCurrentType() !== "pending") return;
  PbCrown.show();
  PbCrown.update("error");
  updateCrownText(
    `Local PB data is out of sync with the server - please refresh (pb mismatch)`,
  );
}

type CanGetPbObject = {
  value: boolean;
  reason?: string;
};

async function resultCanGetPb(): Promise<CanGetPbObject> {
  const funboxes = result.funbox;
  const funboxObjects = getFunbox(result.funbox);
  const allFunboxesCanGetPb = funboxObjects.every((f) => f?.canGetPb);

  const funboxesOk = funboxes.length === 0 || allFunboxesCanGetPb;
  // allow stopOnError:letter to be PB only if 100% accuracy, since it doesn't affect gameplay
  const stopOnLetterTriggered =
    Config.stopOnError === "letter" && result.acc < 100;
  const notBailedOut = !result.bailedOut;

  if (funboxesOk && !stopOnLetterTriggered && notBailedOut) {
    return {
      value: true,
    };
  } else {
    if (!funboxesOk) {
      return {
        value: false,
        reason: "funbox",
      };
    }
    if (stopOnLetterTriggered) {
      return {
        value: false,
        reason: "stop on letter",
      };
    }
    if (!notBailedOut) {
      return {
        value: false,
        reason: "bailed out",
      };
    }
    return {
      value: false,
      reason: "unknown",
    };
  }
}

export function showConfetti(): void {
  if (SlowTimer.get()) return;
  const style = getComputedStyle(document.body);
  const colors = [
    style.getPropertyValue("--main-color"),
    style.getPropertyValue("--text-color"),
    style.getPropertyValue("--sub-color"),
  ];
  const duration = Date.now() + 125;

  (function f(): void {
    void confetti({
      particleCount: 5,
      angle: 60,
      spread: 75,
      origin: { x: 0 },
      colors: colors,
    });
    void confetti({
      particleCount: 5,
      angle: 120,
      spread: 75,
      origin: { x: 1 },
      colors: colors,
    });

    if (Date.now() < duration) {
      requestAnimationFrame(f);
    }
  })();
}

function updateTestType(randomQuote: Quote | null): void {
  let testType = "";

  testType += Config.mode;

  if (Config.mode === "time") {
    testType += ` ${Config.time}`;
  } else if (Config.mode === "words") {
    testType += ` ${Config.words}`;
  } else if (Config.mode === "quote") {
    if (randomQuote?.group !== undefined) {
      testType += ` ${["short", "medium", "long", "thicc"][randomQuote.group]}`;
    }
  }
  const ignoresLanguage = isFunboxActiveWithProperty("ignoresLanguage");
  if (Config.mode !== "custom" && !ignoresLanguage) {
    testType += `<br>${Strings.getLanguageDisplayString(result.language)}`;
  }
  if (Config.punctuation) {
    testType += "<br>punctuation";
  }
  if (Config.numbers) {
    testType += "<br>numbers";
  }
  if (Config.blindMode) {
    testType += "<br>blind";
  }
  if (Config.lazyMode) {
    testType += "<br>lazy";
  }
  if (Config.funbox.length > 0) {
    testType += `<br>${Config.funbox.map((it) => it.replace(/_/g, " ")).join(", ")}`;
  }
  if (Config.difficulty === "expert") {
    testType += "<br>expert";
  } else if (Config.difficulty === "master") {
    testType += "<br>master";
  }
  if (Config.stopOnError !== "off") {
    testType += `<br>stop on ${Config.stopOnError}`;
  }
  if (Config.deleteOnError !== "off") {
    testType += `<br>delete on ${Config.deleteOnError.replace(/_/g, " ")}`;
  }

  qsa("#result .stats .testType .bottom")?.setHtml(testType);
}

function updateOther(
  difficultyFailed: boolean,
  failReason: string,
  afkDetected: boolean,
  isRepeated: boolean,
  tooShort: boolean,
): void {
  // beartype: a test that is not kept says so in one quiet word under the
  // figures; the balloon on it gives the reasons, with the bar each missed.
  // The checks themselves are upstream's, in test-logic.ts `finish`.
  const fast = result.mode === "words" && result.mode2 === "10" ? 420 : 350;
  const reasons: string[] = [];
  if (difficultyFailed) {
    reasons.push(
      failReason === "slow timer"
        ? "máy chạy chậm, đồng hồ trễ nên bài bị dừng"
        : `không đạt (${failReason})`,
    );
  }
  // the lengths on offer here are all long enough; only a test over in under
  // a second is too short
  if (tooShort) {
    reasons.push("bài xong trong chưa tới 1 giây");
  }
  if (afkDetected) {
    reasons.push("có lúc ngừng gõ quá lâu giữa bài");
  }
  if (isRepeated) {
    reasons.push("gõ lại đúng bài vừa rồi");
  }
  if (result.wpm < 0 || result.wpm > fast) {
    reasons.push(`tốc độ trên ${fast} wpm`);
  }
  if (result.rawWpm < 0 || result.rawWpm > fast) {
    reasons.push(`tốc độ thô trên ${fast} wpm`);
  }
  if (result.acc < 75 || result.acc > 100) {
    reasons.push("độ chính xác dưới 75%");
  }
  if (result.bailedOut) {
    reasons.push("bỏ dở giữa chừng");
  }
  // the one check left: a timed test whose clock disagrees with the date
  if (isTestInvalid() && reasons.length === 0) {
    reasons.push("thời gian đo lệch với đồng hồ của máy");
  }

  const info = qs("#result .stats .info");
  if (reasons.length === 0) {
    info?.hide();
    return;
  }
  info?.show();
  qs("#result .stats .info .bottom")
    ?.setHtml(`không hợp lệ <i class="fas fa-info-circle"></i>`)
    ?.setAttribute(
      "aria-label",
      `không lưu vào sổ vì:\n${reasons.map((r) => `· ${r}`).join("\n")}`,
    )
    ?.setAttribute("data-balloon-pos", "up")
    ?.setAttribute("data-balloon-break", "");
}

function updateQuoteSource(randomQuote: Quote | null): void {
  if (Config.mode === "quote") {
    qs("#result .stats .source")?.show();
    qs("#result .stats .source .bottom")?.setHtml(
      randomQuote?.source ?? "Error: Source unknown",
    );
  } else {
    qs("#result .stats .source")?.hide();
  }
}

export async function update(
  res: CompletedEvent,
  difficultyFailed: boolean,
  failReason: string,
  afkDetected: boolean,
  isRepeated: boolean,
  tooShort: boolean,
  randomQuote: Quote | null,
  dontSave: boolean,
): Promise<void> {
  resultAnnotation = [];
  result = structuredClone(res);
  hideCrown();
  qs("#resultWordsHistory .words")?.empty();
  qs("#result #resultWordsHistory")?.hide();
  qs("#result #replayStats")?.setText("");
  qs("#result #resultReplay")?.hide();
  qs("#result #replayWords")?.empty();
  qs("#retrySavingResultButton")?.hide();
  qs(".pageTest #result #rateQuoteButton .icon")
    ?.removeClass("fas")
    ?.addClass("far");
  qs(".pageTest #result #rateQuoteButton .rating")?.setText("");
  qs(".pageTest #result #rateQuoteButton")?.hide();
  qs("#words")?.removeClass("blurred");
  blurInputElement();
  qs("#result .stats .time .bottom .afk")?.setText("");
  qs("#result .loginTip")?.hide();

  updateWpmAndAcc();
  updateConsistency();
  updateTime();
  updateRecent(dontSave);
  updateWords();
  updateKey();
  updateTestType(randomQuote);
  updateQuoteSource(randomQuote);
  await updateCrown(dontSave);
  await updateChartData();
  updateResultChartDataVisibility();
  updateMinMaxChartValues();
  await updateChartPBLine();
  applyMinMaxChartValues();
  updateOther(difficultyFailed, failReason, afkDetected, isRepeated, tooShort);

  ((ChartController.result.options as PluginChartOptions<"line" | "scatter">)
    .plugins.annotation.annotations as AnnotationOptions<"line">[]) =
    resultAnnotation;
  ChartController.result.resize();

  if (
    qs("#result .stats .tags")?.hasClass("hidden") &&
    qs("#result .stats .info")?.hasClass("hidden")
  ) {
    qs("#result .stats .infoAndTags")?.hide();
  } else {
    qs("#result .stats .infoAndTags")?.show();
  }

  if (GlarsesMode.get()) {
    qs("main #result .noStressMessage")?.remove();
    qs("main #result")?.prependHtml(`

      <div class='noStressMessage' style="
        text-align: center;
        grid-column: 1/3;
        font-size: 2rem;
        padding-bottom: 2rem;
      ">
      <i class="fas fa-check"></i>
      </div>

    `);
    qsa("main #result .stats")?.hide();
    qs("main #result .chart")?.hide();
    qs("main #result #resultWordsHistory")?.hide();
    qs("main #result #resultReplay")?.hide();
    qs("main #result .loginTip")?.hide();
    qs("main #result #showWordHistoryButton")?.hide();
    qs("main #result #watchReplayButton")?.hide();
    qs("main #result #saveScreenshotButton")?.hide();

    console.log(
      `Test Completed: ${result.wpm} wpm ${result.acc}% acc ${result.rawWpm} raw ${result.consistency}% consistency`,
    );
  } else {
    qsa("main #result .stats")?.show();
    qs("main #result .chart")?.show();
    qs("main #result #rateQuoteButton")?.hide();
    qs("main #result #reportQuoteButton")?.hide();
    qs("main #result .stats .dailyLeaderboard")?.hide();
    qs("main #result #showWordHistoryButton")?.show();
    qs("main #result #watchReplayButton")?.show();
    qs("main #result #saveScreenshotButton")?.show();
  }

  if (res.wpm === 0 && !difficultyFailed && res.testDuration >= 5) {
    const roundedTime = Math.round(res.testDuration);

    const messages = [
      `Congratulations. You just wasted ${roundedTime} seconds of your life by typing nothing. Be proud of yourself.`,
      `Bravo! You've managed to waste ${roundedTime} seconds and accomplish exactly zero. A true productivity icon.`,
      `That was ${roundedTime} seconds of absolutely legendary idleness. History will remember this moment.`,
      `Wow, ${roundedTime} seconds of typing... nothing. Bold. Mysterious. Completely useless.`,
      `Thank you for those ${roundedTime} seconds of utter nothingness. The keyboard needed the break.`,
      `A breathtaking display of inactivity. ${roundedTime} seconds of absolutely nothing. Powerful.`,
      `You just gave ${roundedTime} seconds of your life to the void. And the void says thanks.`,
      `Stunning. ${roundedTime} seconds of intense... whatever that wasn't. Keep it up, champ.`,
      `Is it performance art? A protest? Or just ${roundedTime} seconds of glorious nothing? We may never know.`,
      `You typed nothing for ${roundedTime} seconds. And in that moment, you became legend.`,
    ];

    showConfetti();
    showNoticeNotification(Arrays.randomElementFromArray(messages), {
      customTitle: "Nice",
      durationMs: 15000,
      important: true,
    });
  }

  Focus.set(false);

  const canQuickRestart = canQuickRestartFn(
    Config.mode,
    Config.words,
    Config.time,
    CustomText.getData(),
    getCustomTextIndicator()?.isLong ?? false,
  );

  if (Config.alwaysShowWordsHistory && canQuickRestart && !GlarsesMode.get()) {
    void TestUI.toggleResultWords(true);
  }
  void Funbox.clear();

  qs(".pageTest .loading")?.hide();
  qs("#result")?.show();

  const resultEl = qs("#result");
  resultEl?.focus({
    preventScroll: true,
  });

  await Misc.promiseAnimate("#result", {
    opacity: [0, 1],
    duration: Misc.applyReducedMotion(125),
  });

  Misc.scrollToCenterOrTop(resultEl?.native ?? null);
  setResultCalculating(false);
  qs("#words")?.empty();
  ChartController.result.resize();
}

const resultChartDataVisibility = new LocalStorageWithSchema({
  key: "resultChartDataVisibility",
  schema: z
    .object({
      raw: z.boolean(),
      burst: z.boolean(),
      errors: z.boolean(),
      pbLine: z.boolean(),
      tagPbLine: z.boolean(),
    })
    .strict(),
  fallback: {
    raw: true,
    burst: true,
    errors: true,
    pbLine: true,
    tagPbLine: true,
  },
});

function updateMinMaxChartValues(): void {
  const values = [];

  const datasets = {
    wpm: ChartController.result.getDataset("wpm"),
    burst: ChartController.result.getDataset("burst"),
    raw: ChartController.result.getDataset("raw"),
  };

  if (!datasets.wpm.hidden) {
    values.push(...datasets.wpm.data);
  }
  if (!datasets.burst.hidden) {
    values.push(...datasets.burst.data);
  }
  if (!datasets.raw.hidden) {
    values.push(...datasets.raw.data);
  }

  maxChartVal = Math.max(...values);

  let maxAnnotation: null | number = null;
  for (const annotation of resultAnnotation) {
    if ((annotation.display ?? false) === false) continue;
    if (annotation.value === undefined) continue;
    // values.push(annotation.value as number);
    if (
      maxAnnotation === null ||
      parseFloat(annotation.value as string) > maxAnnotation
    ) {
      maxAnnotation = parseFloat(annotation.value as string);
    }
  }

  if (maxAnnotation !== null) {
    const typingSpeedUnit = getTypingSpeedUnit(Config.typingSpeedUnit);
    const lpbRange = typingSpeedUnit.fromWpm(20);
    if (
      maxChartVal >= maxAnnotation - lpbRange &&
      maxChartVal <= maxAnnotation + lpbRange
    ) {
      maxChartVal = Math.round(maxAnnotation + lpbRange);
    }
  }

  maxChartVal = Math.ceil(maxChartVal / 10) * 10;

  minChartVal = 0;

  if (!Config.startGraphsAtZero) {
    minChartVal = Math.min(...values);

    // Round down to nearest multiple of 10
    minChartVal = Math.floor(minChartVal / 10) * 10;
  }
}

function applyMinMaxChartValues(): void {
  ChartController.result.getScale("wpm").min = minChartVal;
  ChartController.result.getScale("wpm").max = maxChartVal;
  ChartController.result.getScale("raw").min = minChartVal;
  ChartController.result.getScale("raw").max = maxChartVal;
  ChartController.result.getScale("burst").min = minChartVal;
  ChartController.result.getScale("burst").max = maxChartVal;
}

function updateResultChartDataVisibility(): void {
  const vis = resultChartDataVisibility.get();
  ChartController.result.getDataset("raw").hidden = !vis.raw;
  ChartController.result.getDataset("burst").hidden = !vis.burst;
  ChartController.result.getDataset("error").hidden = !vis.errors;

  for (const annotation of resultAnnotation) {
    if (annotation.id === "lpb") {
      annotation.display = vis.pbLine;
    } else if (annotation.id === "tpb") {
      annotation.display = vis.tagPbLine;
    }
  }

  const buttons = qsa(".pageTest #result .chart .chartLegend button");

  for (const button of buttons) {
    const id = button?.getAttribute("data-id") as string;

    if (id === "scale") {
      continue;
    }

    if (
      id !== "raw" &&
      id !== "burst" &&
      id !== "errors" &&
      id !== "pbLine" &&
      id !== "tagPbLine"
    ) {
      continue;
    }

    button.toggleClass("active", vis[id]);

    // beartype: the pb line comes from this browser's results; there are no tags
    if (id === "tagPbLine") {
      button.toggleClass("hidden", true);
    }
  }
}

qsa(".pageTest #result .chart .chartLegend button")?.on(
  "click",
  async (event) => {
    const $target = event.target as HTMLElement;
    const id = $target.getAttribute("data-id");

    if (id === "scale") {
      setConfig("startGraphsAtZero", !Config.startGraphsAtZero);
      return;
    }

    if (
      id !== "raw" &&
      id !== "burst" &&
      id !== "errors" &&
      id !== "pbLine" &&
      id !== "tagPbLine"
    ) {
      return;
    }
    const vis = resultChartDataVisibility.get();
    vis[id] = !vis[id];
    resultChartDataVisibility.set(vis);

    updateResultChartDataVisibility();
    updateMinMaxChartValues();
    applyMinMaxChartValues();
    ChartController.result.update();
  },
);

configEvent.subscribe(async ({ key }) => {
  if (
    ["typingSpeedUnit", "startGraphsAtZero"].includes(key) &&
    getResultVisible()
  ) {
    resultAnnotation = [];

    updateWpmAndAcc();
    await updateChartData();
    await updateChartPBLine();
    updateResultChartDataVisibility();
    updateMinMaxChartValues();
    applyMinMaxChartValues();
    void TestUI.applyBurstHeatmap();

    ((ChartController.result.options as PluginChartOptions<"line" | "scatter">)
      .plugins.annotation.annotations as AnnotationOptions<"line">[]) =
      resultAnnotation;
    ChartController.result.update();
    ChartController.result.resize();
  }
});
