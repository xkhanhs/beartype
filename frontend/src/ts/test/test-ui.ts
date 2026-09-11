import { Config } from "../config/store";
import * as TestWords from "./test-words";
import { getCurrentInput } from "./events/data";
import { getLiveCachedAccuracy } from "./events/live-cache";
import { wordHtml } from "../beartype/word-html";
import * as Caret from "./caret";
import * as Misc from "../utils/misc";
import * as Strings from "../utils/strings";
import * as CompositionState from "../legacy-states/composition";
import { configEvent } from "../events/config";
import { getActivePage } from "../states/core";
import { convertRemToPixels } from "../utils/numbers";
import {
  cancelPendingAnimationFramesStartingWith,
  requestDebouncedAnimationFrame,
} from "../utils/debounced-animation-frame";
import * as SoundController from "../controllers/sound-controller";
import * as Numbers from "@monkeytype/util/numbers";
import { highlight } from "../events/keymap";
import * as Focus from "../test/focus";
import {
  blurInputElement,
  focusInputElement,
  getInputElement,
  isInputElementFocused,
} from "../input/input-element";
import * as SlowTimer from "../legacy-states/slow-timer";
import * as Joining from "./break-joining";
import {
  ElementsWithUtils,
  ElementWithUtils,
  qs,
  qsa,
  qsr,
} from "../utils/dom";
import {
  isDirectionReversed,
  isLanguageRightToLeft,
  getActiveWordIndex,
  isTestActive,
  setCurrentLiveStats,
  setOutOfFocusMaxHeight,
  setTestFocusState,
  showOutOfFocusWarning,
  getResultVisible,
} from "../states/test";
import { createEffect } from "solid-js";
import * as TestInitFailed from "../elements/test-init-failed";

export const updateHintsPositionDebounced = Misc.debounceUntilResolved(
  updateHintsPosition,
  { rejectSkippedCalls: false },
);

const wordsEl = qsr(".pageTest #words");
const wordsWrapperEl = qsr(".pageTest #wordsWrapper");

export let activeWordTop = 0;
export let activeWordHeight = 0;

// #words is still vanilla; the warning itself is Solid (OutOfFocusWarning.tsx).
// show/hideOutOfFocus live in states/test so commandline needn't import test-ui.
createEffect(() => {
  if (showOutOfFocusWarning()) {
    wordsEl.setStyle({ transition: "0.25s" })?.addClass("blurred");
  } else {
    wordsEl.setStyle({ transition: "none" })?.removeClass("blurred");
  }
});
let currentTestLine = 0;

export function focusWords(force = false): void {
  if (force) {
    blurInputElement();
  }
  focusInputElement(true);
  if (isTestActive()) {
    keepWordsInputInTheCenter(true);
  } else {
    const typingTest = document.querySelector<HTMLElement>("#typingTest");
    Misc.scrollToCenterOrTop(typingTest);
  }
}

export function keepWordsInputInTheCenter(force = false): void {
  const wordsInput = getInputElement();
  if (wordsInput === null || wordsWrapperEl === null) return;

  const wordsWrapperHeight = wordsWrapperEl.getOffsetHeight();
  const windowHeight = window.innerHeight;

  // dont do anything if the wrapper can fit on screen
  if (wordsWrapperHeight < windowHeight) return;

  const wordsInputRect = wordsInput.getBoundingClientRect();
  const wordsInputBelowCenter = wordsInputRect.top > windowHeight / 2;

  // dont do anything if its above or at the center unless forced
  if (!wordsInputBelowCenter && !force) return;

  wordsInput.scrollIntoView({
    block: "center",
  });
}

export function getWordElement(index: number): ElementWithUtils | null {
  const el = wordsEl.qs(`.word[data-wordindex='${index}']`);
  return el;
}

export function getActiveWordElement(): ElementWithUtils | null {
  return getWordElement(getActiveWordIndex());
}

export function updateActiveElement(
  options:
    | { direction: "forward" | "back"; initial?: undefined }
    | { direction?: undefined; initial: true },
): void {
  requestDebouncedAnimationFrame("test-ui.updateActiveElement", async () => {
    const { direction, initial } = options;

    let previousActiveWordTop: number | null = null;
    if (initial === undefined) {
      const previousActiveWord = wordsEl.qs(".active");
      // because of the animation frame, previousActiveWord may already be removed at this point, so check for null
      if (previousActiveWord !== null) {
        if (direction === "forward") {
          previousActiveWord.addClass("typed");
          Joining.set(previousActiveWord, true);
        } else if (direction === "back") {
          //
        }
        previousActiveWord.removeClass("active");
        previousActiveWordTop = previousActiveWord.getOffsetTop();
      }
    }

    const newActiveWord = getActiveWordElement();
    if (newActiveWord === null) {
      throw new Error("activeWord is null - can't update active element");
    }

    newActiveWord.addClass("active");
    newActiveWord.removeClass("error");
    newActiveWord.removeClass("typed");
    Joining.set(newActiveWord, false);

    activeWordTop = newActiveWord.getOffsetTop();
    activeWordHeight = newActiveWord.getOffsetHeight();

    if (previousActiveWordTop !== null) {
      const newActiveWordTop = newActiveWord.getOffsetTop();
      if (newActiveWordTop > previousActiveWordTop) {
        await lineJump(previousActiveWordTop);
      }
    }

    updateWordsInputPosition();
  });
}

function createHintsHtml(
  incorrectLettersIndices: number[][],
  activeWordLetters: ElementsWithUtils,
  input: string | string[],
  wrapWithDiv: boolean = true,
): string {
  // if input is an array, it contains only incorrect letters input.
  // if input is a string, it contains the whole word input.
  const isFullWord = typeof input === "string";
  const inputChars = isFullWord ? Strings.splitIntoCharacters(input) : input;

  let hintsHtml = "";
  let currentHint = 0;

  for (const adjacentLetters of incorrectLettersIndices) {
    for (const letterIndex of adjacentLetters) {
      const letter = activeWordLetters[letterIndex] as ElementWithUtils;
      const blockIndices = `${letterIndex}`;
      const blockChars = isFullWord
        ? inputChars[letterIndex]
        : inputChars[currentHint++];

      hintsHtml += `<hint data-chars-index=${blockIndices} style="left:${
        letter.getOffsetLeft() + letter.getOffsetWidth() / 2
      }px;">${blockChars}</hint>`;
    }
  }
  if (wrapWithDiv) hintsHtml = `<div class="hints">${hintsHtml}</div>`;
  return hintsHtml;
}

async function joinOverlappingHints(
  incorrectLettersIndices: number[][],
  activeWordLetters: ElementsWithUtils,
  hintElements: HTMLCollection,
): Promise<void> {
  const currentWord = TestWords.words.getCurrent();
  if (currentWord === undefined) return;

  const [isWordRightToLeft] = Strings.isWordRightToLeft(
    currentWord.text,
    isLanguageRightToLeft(),
    isDirectionReversed(),
  );

  let previousBlocksAdjacent = false;
  let currentHintBlock = 0;
  let HintBlocksCount = hintElements.length;
  while (currentHintBlock < HintBlocksCount - 1) {
    const hintBlock1 = hintElements[currentHintBlock] as HTMLElement;
    const hintBlock2 = hintElements[currentHintBlock + 1] as HTMLElement;

    const block1Indices = hintBlock1.dataset["charsIndex"]?.split(",") ?? [];
    const block2Indices = hintBlock2.dataset["charsIndex"]?.split(",") ?? [];

    const block1Letter1Indx = parseInt(block1Indices[0] ?? "0");
    const block2Letter1Indx = parseInt(block2Indices[0] ?? "0");

    const currentBlocksAdjacent = incorrectLettersIndices.some(
      (adjacentLettersSequence) =>
        adjacentLettersSequence.includes(block1Letter1Indx) &&
        adjacentLettersSequence.includes(block2Letter1Indx),
    );

    if (!currentBlocksAdjacent) {
      currentHintBlock++;
      previousBlocksAdjacent = false;
      continue;
    }

    const block1Letter1 = activeWordLetters[
      block1Letter1Indx
    ] as ElementWithUtils;
    const block2Letter1 = activeWordLetters[
      block2Letter1Indx
    ] as ElementWithUtils;

    const sameTop =
      block1Letter1.getOffsetTop() === block2Letter1.getOffsetTop();

    const leftBlock = isWordRightToLeft ? hintBlock2 : hintBlock1;
    const rightBlock = isWordRightToLeft ? hintBlock1 : hintBlock2;

    // block edge is offset half its width because of transform: translate(-50%)
    const leftBlockEnds = leftBlock.offsetLeft + leftBlock.offsetWidth / 2;
    const rightBlockStarts = rightBlock.offsetLeft - rightBlock.offsetWidth / 2;

    if (sameTop && leftBlockEnds > rightBlockStarts) {
      // join hint blocks
      hintBlock1.dataset["charsIndex"] = [
        ...block1Indices,
        ...block2Indices,
      ].join(",");

      const block1Letter1Pos =
        block1Letter1.getOffsetLeft() +
        (isWordRightToLeft ? block1Letter1.getOffsetWidth() : 0);
      const bothBlocksLettersWidthHalved =
        hintBlock2.offsetLeft - hintBlock1.offsetLeft;
      hintBlock1.style.left = `${block1Letter1Pos + bothBlocksLettersWidthHalved}px`;

      hintBlock1.insertAdjacentHTML("beforeend", hintBlock2.innerHTML);
      hintBlock2.remove();

      // after joining blocks, the sequence is shorter
      HintBlocksCount--;
      // check if the newly formed block overlaps with the previous one
      if (previousBlocksAdjacent && currentHintBlock > 0) currentHintBlock--;
    } else {
      currentHintBlock++;
    }
    previousBlocksAdjacent = true;
  }
}

async function updateHintsPosition(): Promise<void> {
  if (
    getActivePage() !== "test" ||
    getResultVisible() ||
    (Config.indicateTypos !== "below" && Config.indicateTypos !== "both")
  ) {
    return;
  }

  let previousHintsContainer: HTMLElement | undefined;
  let hintIndices: number[][] = [];
  let hintText: string[] = [];

  const hintElements = document.querySelectorAll<HTMLElement>(".hints > hint");

  for (const hintEl of hintElements) {
    const hintsContainer = hintEl.parentElement as HTMLElement;

    if (hintsContainer !== previousHintsContainer) {
      await adjustHintsContainer(previousHintsContainer, hintIndices, hintText);
      previousHintsContainer = hintsContainer;
      hintIndices = [];
      hintText = [];
    }

    const letterIndices = hintEl.dataset["charsIndex"]
      ?.split(",")
      .map((index) => parseInt(index));

    if (letterIndices === undefined || letterIndices.length === 0) continue;

    for (const currentLetterIndex of letterIndices) {
      const lastBlock = hintIndices[hintIndices.length - 1];
      if (lastBlock?.[lastBlock.length - 1] === currentLetterIndex - 1) {
        lastBlock.push(currentLetterIndex);
      } else {
        hintIndices.push([currentLetterIndex]);
      }
    }

    hintText.push(...Strings.splitIntoCharacters(hintEl.innerHTML));
  }
  await adjustHintsContainer(previousHintsContainer, hintIndices, hintText);

  async function adjustHintsContainer(
    hintsContainer: HTMLElement | undefined,
    hintIndices: number[][],
    hintText: string[],
  ): Promise<void> {
    if (!hintsContainer || hintIndices.length === 0) return;

    const wordElement = new ElementWithUtils(
      hintsContainer.parentElement as HTMLElement,
    );
    const letterElements = wordElement.qsa("letter");

    hintsContainer.innerHTML = createHintsHtml(
      hintIndices,
      letterElements,
      hintText,
      false,
    );
    const wordHintsElements = wordElement.native.getElementsByTagName("hint");
    await joinOverlappingHints(hintIndices, letterElements, wordHintsElements);
  }
}

function buildWordHTML(word: string, wordIndex: number): string {
  let newlineafter = false;
  let retval = `<div class='word' data-wordindex='${wordIndex}'>`;

  const chars = Strings.splitIntoCharacters(word);
  for (const char of chars) {
    if (char === "\t") {
      retval += `<letter class='tabChar'><i class="fas fa-long-arrow-alt-right fa-fw"></i></letter>`;
    } else if (char === "\n") {
      newlineafter = true;
      retval += `<letter class='nlChar'><i class="fas fa-level-down-alt fa-rotate-90 fa-fw"></i></letter>`;
    } else {
      retval += `<letter>${char}</letter>`;
    }
  }
  retval += "</div>";
  if (newlineafter) {
    retval +=
      "<div class='beforeNewline'></div><div class='newline'></div><div class='afterNewline'></div>";
  }
  return retval;
}

function updateWordWrapperClasses(): void {
  // outoffocus applies transition, need to remove it
  setTestFocusState("focused");

  wordsEl.removeClass("tape");
  wordsWrapperEl.removeClass("tape");

  wordsEl.removeClass("blind");
  wordsWrapperEl.removeClass("blind");

  if (Config.indicateTypos === "below" || Config.indicateTypos === "both") {
    wordsEl.addClass("indicateTyposBelow");
    wordsWrapperEl.addClass("indicateTyposBelow");
  } else {
    wordsEl.removeClass("indicateTyposBelow");
    wordsWrapperEl.removeClass("indicateTyposBelow");
  }

  wordsEl.removeClass("hideExtraLetters");
  wordsWrapperEl.removeClass("hideExtraLetters");

  wordsEl.removeClass("flipped");
  wordsEl.removeClass("colorfulMode");

  qsa("#caret, #typingTest, #wordsInput").setStyle({
    fontSize: `${Config.fontSize}rem`,
  });

  if (isLanguageRightToLeft()) {
    wordsEl.addClass("rightToLeftTest");
  } else {
    wordsEl.removeClass("rightToLeftTest");
  }

  const existing =
    wordsEl.native.className
      .split(/\s+/)
      .filter(
        (className) =>
          !className.startsWith("highlight-") &&
          !className.startsWith("typed-effect-"),
      ) ?? [];
  existing.push("highlight-letter", "typed-effect-keep");

  wordsEl.native.className = existing.join(" ");

  updateWordsWidth();
  updateWordsWrapperHeight(true);
  void centerActiveLine();
  updateWordsMargin();
  updateWordsInputPosition();
  void updateHintsPositionDebounced();
  Caret.updatePosition(true);

  if (!isInputElementFocused()) {
    setTestFocusState("unfocused");
  }
}

function showWords(): void {
  wordsEl.setHtml("");

  let wordsHTML = "";
  for (let i = 0; i < TestWords.words.length; i++) {
    const word = TestWords.words.get(i);
    if (word === undefined) continue; // won't happen, but ts complains
    wordsHTML += buildWordHTML(word.display, i);
  }
  wordsEl.setHtml(wordsHTML);

  updateActiveElement({
    initial: true,
  });
  updateWordWrapperClasses();
}

export function updateWordsInputPosition(): void {
  if (getActivePage() !== "test") return;
  const isTestRightToLeft = isDirectionReversed()
    ? !isLanguageRightToLeft()
    : isLanguageRightToLeft();

  const el = getInputElement();

  if (el === null) return;

  const activeWord = getActiveWordElement();

  if (!activeWord) {
    el.style.top = "0px";
    el.style.left = "0px";
    return;
  }

  const letterHeight = convertRemToPixels(Config.fontSize);
  const targetTop =
    activeWord.getOffsetTop() + letterHeight / 2 - el.offsetHeight / 2 + 1; //+1 for half of border

  el.style.maxWidth = "";
  if (activeWord.getOffsetWidth() < letterHeight) {
    el.style.width = `${letterHeight}px`;
  } else {
    el.style.width = `${activeWord.getOffsetWidth()}px`;
  }

  el.style.top = `${targetTop}px`;

  if (activeWord.getOffsetWidth() < letterHeight && isTestRightToLeft) {
    el.style.left = `${activeWord.getOffsetLeft() - letterHeight}px`;
  } else {
    el.style.left = `${Math.max(0, activeWord.getOffsetLeft())}px`;
  }

  keepWordsInputInTheCenter();
}

export async function centerActiveLine(): Promise<void> {
  const activeWordEl = getActiveWordElement();
  if (!activeWordEl) {
    return;
  }
  const currentTop = activeWordEl.getOffsetTop();

  let previousLineTop = currentTop;
  for (let i = getActiveWordIndex() - 1; i >= 0; i--) {
    previousLineTop = getWordElement(i)?.getOffsetTop() ?? currentTop;
    if (previousLineTop < currentTop) {
      await lineJump(previousLineTop, true);
      return;
    }
  }
}

export function updateWordsWrapperHeight(force = false): void {
  if (getActivePage() !== "test" || getResultVisible()) return;
  if (!force && Config.mode !== "custom") return;
  const activeWordEl = getActiveWordElement();
  if (!activeWordEl) return;

  wordsWrapperEl.show();

  const wordComputedStyle = window.getComputedStyle(activeWordEl.native);
  const wordMargin =
    parseInt(wordComputedStyle.marginTop) +
    parseInt(wordComputedStyle.marginBottom);
  const wordHeight = activeWordEl.getOffsetHeight() + wordMargin;

  //tape off, showAllLines off
  const wordElements = wordsEl.qsa(".word");
  let lines = 0;
  let lastTop = 0;
  let wordIndex = 0;
  let wrapperHeight = 0;

  while (lines < 3) {
    const word = wordElements[wordIndex];
    if (!word) break;
    const top = word.getOffsetTop();
    if (top > lastTop) {
      lines++;
      wrapperHeight += word.getOffsetHeight() + wordMargin;
      lastTop = top;
    }
    wordIndex++;
  }
  if (lines < 3) wrapperHeight = wrapperHeight * (3 / lines);

  //limit to 3 lines
  wordsWrapperEl.setStyle({ height: `${wrapperHeight}px` });

  setOutOfFocusMaxHeight(wordHeight * 3);
}

function updateWordsMargin(): void {
  const afterNewlineEls = wordsEl.qsa(".afterNewline");
  wordsEl.setStyle({ marginLeft: "0", marginTop: "0" });
  for (const afterNewline of afterNewlineEls) {
    afterNewline.setStyle({
      marginLeft: "0",
    });
  }
}

export function addWord(
  word: string,
  wordIndex = TestWords.words.length - 1,
): void {
  // if the current active word is the last word, we need to NOT use raf
  // because other ui parts depend on the word existing
  if (getActiveWordIndex() === wordIndex - 1) {
    wordsEl.appendHtml(buildWordHTML(word, wordIndex));
  } else {
    requestAnimationFrame(async () => {
      wordsEl.appendHtml(buildWordHTML(word, wordIndex));
    });
  }

  // maybe ill come back to this
  // requestAnimationFrame(async () => {
  //   wordsEl.insertAdjacentHTML("beforeend", buildWordHTML(word, wordIndex));
  //   // in case word addition took a long time and some input happened in the mean time
  //   // we need to update word letters for that word
  //   const inputHistory = [
  //     ...getInputHistory(),
  //     getCurrentInput(),
  //   ];
  //   const input = inputHistory[wordIndex];
  //   if (input !== undefined && input !== "") {
  //     await updateWordLetters({
  //       wordIndex,
  //       input,
  //       compositionData: CompositionState.getData(),
  //     });
  //   }
  // });
}

// because of the requestAnimationFrame, multiple calls to updateWordLetters
// can be made before the actual update happens. This map keeps track of the
// latest input for each word and is used in before-insert-text to
// make sure the currently typed word will not overflow to the next line
export let pendingWordData: Map<number, string> = new Map();

export async function updateWordLetters({
  wordIndex,
  input,
  compositionData,
}: {
  wordIndex: number;
  input: string;
  compositionData: string;
}): Promise<void> {
  pendingWordData.set(wordIndex, input);
  requestDebouncedAnimationFrame(
    `test-ui.updateWordLetters.${wordIndex}`,
    async () => {
      pendingWordData.delete(wordIndex);
      const currentWord = TestWords.words.get(wordIndex)?.display;
      if (currentWord === undefined) return;
      let ret = "";
      const wordAtIndex = getWordElement(wordIndex);
      if (!wordAtIndex) return;
      const hintIndices: number[][] = [];

      // beartype: lay the word out by keys, not by character index -- see
      // beartype/word-html.ts.
      ret = wordHtml(currentWord ?? "", input, compositionData);

      wordAtIndex.setHtml(ret);

      if (hintIndices?.length) {
        const wordAtIndexLetters = wordAtIndex.qsa("letter");
        let hintsHtml;
        if (Config.indicateTypos === "both") {
          hintsHtml = createHintsHtml(
            hintIndices,
            wordAtIndexLetters,
            currentWord ?? "",
          );
        } else {
          hintsHtml = createHintsHtml(hintIndices, wordAtIndexLetters, input);
        }
        wordAtIndex.appendHtml(hintsHtml);
        const hintElements = wordAtIndex.native.getElementsByTagName("hint");
        await joinOverlappingHints(
          hintIndices,
          wordAtIndexLetters,
          hintElements,
        );
      }

      if (SlowTimer.get()) {
        // because we block word jumps in before-insert-text
        // this check only needs to happen when slow timer is on, then it
        // needs to happen because the word jump check is disabled
        const wordTopAfterUpdate = wordAtIndex.getOffsetTop();
        if (wordTopAfterUpdate > activeWordTop) {
          await lineJump(activeWordTop);
        }
      }
    }, //end of raf
  );
}

function removeTestElements(lastElementIndexToRemove: number): void {
  const wordsChildren = wordsEl.getChildren();

  if (wordsChildren === undefined) return;

  for (let i = lastElementIndexToRemove; i >= 0; i--) {
    const child = wordsChildren[i];
    if (!child || !child.native.isConnected) continue;
    child.remove();
  }
}

let currentLinesJumping = 0;

async function lineJump(currentTop: number, force = false): Promise<void> {
  //last word of the line
  if (currentTestLine > 0 || force) {
    const hideBound = currentTop;

    const activeWordEl = getActiveWordElement();
    if (!activeWordEl) return;

    // index of the active word in all #words.children
    // (which contains .word/.newline/.beforeNewline/.afterNewline elements)
    const wordsChildren = wordsEl.getChildren();
    const activeWordElementIndex = wordsChildren.indexOf(activeWordEl);

    let lastElementIndexToRemove: number | undefined = undefined;
    for (let i = activeWordElementIndex - 1; i >= 0; i--) {
      const child = wordsChildren[i] as ElementWithUtils;
      if (child.hasClass("hidden")) continue;
      if (Math.floor(child.getOffsetTop()) < hideBound) {
        if (child.hasClass("word")) {
          lastElementIndexToRemove = i;
          break;
        } else if (child.hasClass("beforeNewline")) {
          // set it to .newline but check .beforeNewline.offsetTop
          // because it's more reliable
          lastElementIndexToRemove = i + 1;
          break;
        }
      }
    }

    if (lastElementIndexToRemove === undefined) {
      currentTestLine++;
      updateWordsWrapperHeight();
      return;
    }

    currentLinesJumping++;

    const wordHeight = activeWordEl.getOuterHeight();
    const newMarginTop = -1 * wordHeight * currentLinesJumping;

    const caretLineJumpOptions = {
      newMarginTop,
      duration: 0,
    };
    Caret.caret.handleLineJump(caretLineJumpOptions);

    currentLinesJumping = 0;
    removeTestElements(lastElementIndexToRemove);
  }
  currentTestLine++;
  updateWordsWrapperHeight();
  return;
}

export function setJoiningClass(isEnabled: boolean): void {
  if (isEnabled || Config.mode === "custom") {
    wordsEl.addClass("joiningScript");
  } else {
    wordsEl.removeClass("joiningScript");
  }
}

export function highlightBadWord(index: number): void {
  requestDebouncedAnimationFrame(`test-ui.highlightBadWord.${index}`, () => {
    getWordElement(index)?.addClass("error");
  });
}

function updateWordsWidth(): void {
  const el = qs("#typingTest");
  el?.setStyle({ maxWidth: "100%" });
  el?.removeClass("full-width-padding").addClass("content");
}

export function getActiveWordTopAndHeightWithDifferentData(data: string): {
  top: number;
  height: number;
} {
  const activeWord = getActiveWordElement();

  if (!activeWord) throw new Error("No active word element found");

  const lettersEls = activeWord.qsa("letter");
  const domLettersCount = lettersEls.length;
  const nodes = [];
  for (let i = domLettersCount; i < data.length; i++) {
    const tempLetter = document.createElement("letter");
    const displayData = data[i] === " " ? "_" : data[i];
    tempLetter.textContent = displayData as string;
    nodes.push(tempLetter);
  }

  lettersEls[domLettersCount - 1]?.native.after(...nodes);

  const top = activeWord.getOffsetTop();
  const height = activeWord.getOffsetHeight();
  for (const node of nodes) {
    node.remove();
  }

  return { top, height };
}

// this means input, delete or composition
function afterAnyTestInput(
  type: "textInput" | "delete" | "compositionUpdate",
  correctInput: boolean | null,
): void {
  if (type === "textInput" || type === "compositionUpdate") {
    if (correctInput === true || Config.playSoundOnError === "off") {
      void SoundController.playClick();
    } else {
      void SoundController.playError();
    }
  } else if (type === "delete") {
    void SoundController.playClick();
  }

  const acc = Numbers.roundTo2(getLiveCachedAccuracy());
  if (!isNaN(acc)) {
    setCurrentLiveStats({ acc });
  }

  if (Config.keymapMode === "next") {
    const keyToHighlight =
      TestWords.words.getCurrent()?.textWithCommit[getCurrentInput().length];
    if (keyToHighlight !== undefined) {
      highlight(keyToHighlight);
    }
  }

  Focus.set(true);
  Caret.stopAnimation();
  Caret.updatePosition();
}

export function afterTestTextInput(
  correct: boolean,
  inputOverride?: string,
  goingToNextWord = false,
): void {
  let input = inputOverride ?? getCurrentInput();
  if (goingToNextWord) {
    input = input.replace(/ $/, "");
  }

  void updateWordLetters({
    input,
    wordIndex: getActiveWordIndex(),
    compositionData: CompositionState.getData(),
  });

  afterAnyTestInput("textInput", correct);
}

export function afterTestCompositionUpdate(): void {
  void updateWordLetters({
    input: getCurrentInput(),
    wordIndex: getActiveWordIndex(),
    compositionData: CompositionState.getData(),
  });
  // correct needs to be true to get the normal click sound
  afterAnyTestInput("compositionUpdate", true);
}

export function afterTestDelete(): void {
  void updateWordLetters({
    input: getCurrentInput(),
    wordIndex: getActiveWordIndex(),
    compositionData: CompositionState.getData(),
  });
  afterAnyTestInput("delete", null);
}

export function beforeTestWordChange(
  direction: "forward",
  correct: boolean,
): void;
export function beforeTestWordChange(direction: "back", correct: null): void;
export function beforeTestWordChange(
  direction: "forward" | "back",
  correct: boolean | null,
): void {
  if (direction === "back") {
    void updateWordLetters({
      input: getCurrentInput(),
      wordIndex: getActiveWordIndex(),
      compositionData: CompositionState.getData(),
    });
  }

  if (direction === "forward") {
    if (correct === false) {
      highlightBadWord(getActiveWordIndex());
    }
  }
}

export async function afterTestWordChange(
  direction: "forward" | "back",
  lastBurst?: number | null,
): Promise<void> {
  updateActiveElement({
    direction,
  });
  Caret.updatePosition();

  if (lastBurst !== null && Numbers.isSafeNumber(lastBurst)) {
    setCurrentLiveStats({ burst: Math.round(lastBurst) });
  }

  if (Config.keymapMode === "next") {
    const keyToHighlight =
      TestWords.words.getCurrent()?.textWithCommit[getCurrentInput().length];
    if (keyToHighlight !== undefined) {
      highlight(keyToHighlight);
    }
  }
}

export function onTestStart(): void {
  Focus.set(true);
  setCurrentLiveStats({
    wpm: 0,
    acc: 100,
    raw: 0,
    burst: 0,
    seconds: 0,
  });
}

function getRestartAnimationTime(noAnim: boolean): number {
  return noAnim ? 0 : Misc.applyReducedMotion(125);
}

export async function fadeOutForRestart(
  source: "testPage" | "resultPage",
  noAnim: boolean,
): Promise<void> {
  const selector = source === "resultPage" ? "#result" : "#typingTest";
  await qs(selector)?.promiseAnimate({
    opacity: 0,
    duration: getRestartAnimationTime(noAnim),
  });
}

export async function fadeInAfterRestart(noAnim: boolean): Promise<void> {
  const typingTestEl = qs("#typingTest");
  await typingTestEl?.promiseAnimate({
    opacity: [0, 1],
    onBegin: () => {
      typingTestEl.removeClass("hidden");
    },
    duration: getRestartAnimationTime(noAnim),
  });
}

// beartype: `source` no longer branches here (upstream's XP breakdown skip
// dispatched an event nothing subscribed to); kept in the signature so
// callers stay unchanged.
export function onTestRestart(_source: "testPage" | "resultPage"): void {
  qs("#result")?.hide();
  qs("#typingTest")?.setStyle({ opacity: "0" }).show();
  getInputElement().style.left = "0";
  Focus.set(false);
  setCurrentLiveStats({
    wpm: undefined,
    acc: undefined,
    raw: undefined,
    burst: undefined,
    seconds: undefined,
  });
  focusWords(true);
  Caret.resetPosition();
  TestInitFailed.hide();

  currentTestLine = 0;
  void SoundController.clearAllSounds();
  cancelPendingAnimationFramesStartingWith("test-ui");
  showWords();
}

export function onTestFinish(): void {
  Caret.hide();
  setTestFocusState("focused");
  if (Config.playSoundOnClick === "16") {
    void SoundController.playFartReverb();
  }
}

qs("#wordsInput")?.on("focus", (e) => {
  if (!isInputElementFocused()) return;
  if (!getResultVisible() && Config.showOutOfFocusWarning) {
    setTestFocusState("focused");
  }
  Caret.show(true);
});

qs("#wordsInput")?.on("focusout", () => {
  if (!isInputElementFocused()) {
    setTestFocusState("unfocused");
  }
  Caret.hide();
});

qs("#wordsWrapper")?.on("click", () => {
  focusWords();
});

window.addEventListener("blur", () => {
  setTestFocusState("unfocusedWindow");
});

// little roadblock for basic cheating
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState !== "hidden") return;
  setTestFocusState("unfocusedWindow");
});

configEvent.subscribe(({ key, newValue }) => {
  if (key === "showOutOfFocusWarning" && !newValue) {
    setTestFocusState("focused");
  }
  if (["fontSize", "fontFamily"].includes(key ?? "")) {
    void updateHintsPositionDebounced();
  }
  if (["indicateTypos", "fontSize", "fontFamily"].includes(key)) {
    if (key !== "fontFamily") updateWordWrapperClasses();
    if (["fontFamily", "fontSize"].includes(key)) {
      Joining.update(key, wordsEl);
    }
  }
});
