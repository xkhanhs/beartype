import { Config } from "../config/store";
// beartype: results live in this browser, not in an account snapshot
import * as DB from "../beartype/local-results";

import * as SlowTimer from "../legacy-states/slow-timer";
import * as DateTime from "../utils/date-and-time";
import * as Misc from "../utils/misc";
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
import type { IdleReason } from "../beartype/idle";
import { locale, t } from "../beartype/strings";
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

    qs("#result .stats .wpm .bottom")?.setAttribute("aria-label", wpmHover);

    // beartype: one line, the parts split by a middle dot
    qs("#result .stats .acc .bottom")?.setAttribute(
      "aria-label",
      `${
        result.acc === 100
          ? "100%"
          : Format.percentage(result.acc, { showDecimalPlaces: true })
      } · ${t("accuracyHover", acc.correct, acc.incorrect)}`,
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
      t("afkShare", afkSecondsPercent),
    );
  }
  qs("#result .stats .time .bottom")?.setAttribute(
    "aria-label",
    t("afkHover", result.afkDuration, afkSecondsPercent),
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
    t(
      "timeHover",
      `${Numbers.roundTo2(result.testDuration)}`,
      result.afkDuration,
      afkSecondsPercent,
    ),
  );
}

// beartype: at most one decimal, with the decimal mark of the language the
// page is in -- 96,5 reading Vietnamese and 96.5 reading English
function oneDecimal(value: number, round: (n: number) => number): string {
  return (round(value * 10) / 10).toLocaleString(locale(), {
    maximumFractionDigits: 1,
  });
}

/**
 * beartype: how even the rhythm was. Upstream computes it for every test and
 * this app already stored it; it was the one figure nothing ever drew. Two
 * hands at the same speed are not the same pair of hands, one steady and one
 * fast between stumbles, and the second is what a plateau is made of.
 */
function updateConsistency(): void {
  qs("#result .stats .consistency .bottom")
    ?.setText(
      result.consistency === 100
        ? "100%"
        : `${oneDecimal(result.consistency, Math.floor)}%`,
    )
    ?.setAttribute("aria-label", t("consistencyHover"));
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
        : {
            wpm: result.wpm,
            acc: result.acc,
            consistency: result.consistency,
            timestamp: result.timestamp,
          },
    ),
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
    t("newBest", Format.typingSpeed(pbDiff, { showDecimalPlaces: true })),
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

function updateOther(
  difficultyFailed: boolean,
  failReason: string,
  afkDetected: boolean,
  isRepeated: boolean,
  tooShort: boolean,
  idle: IdleReason | null,
): void {
  // beartype: a test that is not kept says so in one quiet word under the
  // figures; the balloon on it gives the reasons, with the bar each missed.
  // The checks themselves are upstream's, in test-logic.ts `finish`.
  const fast = result.mode === "words" && result.mode2 === "10" ? 420 : 350;
  const reasons: string[] = [];
  if (difficultyFailed) {
    if (failReason === "slow timer") {
      reasons.push(t("failedSlowTimer"));
    } else if (failReason === "strict") {
      reasons.push(t("failedStrict"));
    } else {
      reasons.push(t("failed", failReason));
    }
  }
  // the lengths on offer here are all long enough; only a test over in under
  // a second is too short
  if (tooShort) {
    reasons.push(t("tooShort"));
  }
  if (afkDetected) {
    reasons.push(t("afkDetected"));
  }
  if (idle !== null) {
    reasons.push(
      idle.kind === "pause"
        ? t("idlePause", idle.seconds)
        : t("idleShare", idle.percent),
    );
  }
  if (isRepeated) {
    reasons.push(t("sameTestAgain"));
  }
  if (result.wpm < 0 || result.wpm > fast) {
    reasons.push(t("tooFast", fast));
  }
  if (result.rawWpm < 0 || result.rawWpm > fast) {
    reasons.push(t("rawTooFast", fast));
  }
  if (result.acc < 75 || result.acc > 100) {
    reasons.push(t("accTooLow"));
  }
  // the one check left: a timed test whose clock disagrees with the date
  if (isTestInvalid() && reasons.length === 0) {
    reasons.push(t("clockDisagrees"));
  }

  const info = qs("#result .stats .info");
  if (reasons.length === 0) {
    info?.hide();
    return;
  }
  info?.show();
  qs("#result .stats .info .bottom")
    ?.setHtml(
      `${t("invalid")} <svg class="bt-icon" aria-hidden="true"><use href="#i-info"></use></svg>`,
    )
    ?.setAttribute(
      "aria-label",
      `${t("notSavedBecause")}\n${reasons.map((r) => `· ${r}`).join("\n")}`,
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
  idle: IdleReason | null,
): Promise<void> {
  result = structuredClone(res);
  hideCrown();
  qs("#words")?.removeClass("blurred");
  blurInputElement();
  qs("#result .stats .time .bottom .afk")?.setText("");

  updateWpmAndAcc();
  updateTime();
  updateRecent(dontSave);
  updateWords();
  updateConsistency();
  updateCrown(dontSave);
  updateOther(
    difficultyFailed,
    failReason,
    afkDetected,
    isRepeated,
    tooShort,
    idle,
  );

  qsa("main #result .stats")?.show();

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
