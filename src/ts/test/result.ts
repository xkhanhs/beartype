import { Config } from "../config/store";
// beartype: results live in this browser, not in an account snapshot
import * as DB from "../beartype/local-results";

import * as SlowTimer from "../legacy-states/slow-timer";
import * as DateTime from "../utils/date-and-time";
import * as Misc from "../utils/misc";
import * as Strings from "../utils/strings";
import * as Numbers from "../utils/numbers";
import * as PbCrown from "./pb-crown";
import * as Focus from "./focus";
import Format from "../singletons/format";
import confetti from "canvas-confetti";
import { CompletedEvent } from "../schemas/results";
import { blurInputElement } from "../input/input-element";
import { qs, qsa } from "../utils/dom";
import {
  getLastEventLog,
  isTestInvalid,
  setResultCalculating,
} from "../states/test";
import { getAccuracy, getInputHistory } from "./events/stats";
import { setResultHistory } from "../components/beartype/ResultHistory";

let result: CompletedEvent;

function updateWpmAndAcc(): void {
  let inf = false;
  if (result.wpm >= 1000) {
    inf = true;
  }

  qs("#result .stats .wpm .top .text")?.setText("wpm");

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
    const decimalsAndSuffix = {
      showDecimalPlaces: true,
      suffix: " wpm",
    };
    const wpmHover = Format.typingSpeed(result.wpm, decimalsAndSuffix);
    const rawWpmHover = Format.typingSpeed(result.rawWpm, decimalsAndSuffix);

    qs("#result .stats .wpm .bottom")?.setAttribute("aria-label", wpmHover);
    qs("#result .stats .raw .bottom")?.setAttribute("aria-label", rawWpmHover);

    // beartype: one line, the parts split by a middle dot
    qs("#result .stats .acc .bottom")?.setAttribute(
      "aria-label",
      `${
        result.acc === 100
          ? "100%"
          : Format.percentage(result.acc, { showDecimalPlaces: true })
      } · ${acc.correct} đúng · ${acc.incorrect} sai`,
    );
  }
}

function updateConsistency(): void {
  qs("#result .stats .consistency .bottom")?.setText(
    Format.percentage(result.consistency),
  );
  qs("#result .stats .consistency .bottom")?.setAttribute(
    "aria-label",
    `${result.consistency}% (${result.keyConsistency}% key)`,
  );
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

// beartype: best and usual speed over the tests on this browser in the same
// language, whatever the mode, so the number just typed has something to be
// read against
function updateRecent(dontSave: boolean): void {
  if (Config.mode === "custom") {
    setResultHistory(null);
    return;
  }
  setResultHistory(
    DB.recentSummary(
      result.language,
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

function updateCrownText(text: string): void {
  qs("#result .stats .wpm .crown")?.setAttribute("aria-label", text);
}

// The crown shows a new best and nothing else: a test that cannot count has
// no place in the ranking at all.
function updateCrown(dontSave: boolean): void {
  // beartype: a drill from the miss book is practice, not a test with a best
  if (Config.mode === "custom" || dontSave) {
    hideCrown();
    return;
  }

  const localPb = DB.getLocalPB(Config.language);
  const pbDiff = result.wpm - (localPb?.wpm ?? 0);
  if (pbDiff <= 0) {
    hideCrown();
    return;
  }

  // this browser keeps the only record, so a new best is final
  PbCrown.show();
  updateCrownText(
    `kỷ lục mới +${Format.typingSpeed(pbDiff, { showDecimalPlaces: true })}`,
  );
  if (localPb !== undefined) showConfetti();
}

function hideCrown(): void {
  PbCrown.hide();
  updateCrownText("");
}

function showConfetti(): void {
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

function updateTestType(): void {
  let testType = "";

  testType += Config.mode;

  if (Config.mode === "time") {
    testType += ` ${Config.time}`;
  } else if (Config.mode === "words") {
    testType += ` ${Config.words}`;
  }
  if (Config.mode !== "custom") {
    testType += `<br>${Strings.getLanguageDisplayString(result.language)}`;
  }

  qsa("#result .stats .testType .bottom")?.setHtml(testType);
}

function updateOther(
  difficultyFailed: boolean,
  failReason: string,
  afkDetected: boolean,
  isRepeated: boolean,
  tooShort: boolean,
  idle: string | null,
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
    reasons.push("5 giây cuối không gõ phím nào");
  }
  if (idle !== null) {
    reasons.push(idle);
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

export async function update(
  res: CompletedEvent,
  difficultyFailed: boolean,
  failReason: string,
  afkDetected: boolean,
  isRepeated: boolean,
  tooShort: boolean,
  dontSave: boolean,
  idle: string | null,
): Promise<void> {
  result = structuredClone(res);
  hideCrown();
  qs("#retrySavingResultButton")?.hide();
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
  updateTestType();
  updateCrown(dontSave);
  updateOther(
    difficultyFailed,
    failReason,
    afkDetected,
    isRepeated,
    tooShort,
    idle,
  );

  if (
    qs("#result .stats .tags")?.hasClass("hidden") &&
    qs("#result .stats .info")?.hasClass("hidden")
  ) {
    qs("#result .stats .infoAndTags")?.hide();
  } else {
    qs("#result .stats .infoAndTags")?.show();
  }

  qsa("main #result .stats")?.show();
  qs("main #result .stats .dailyLeaderboard")?.hide();
  qs("main #result #saveScreenshotButton")?.show();

  Focus.set(false);

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
}
