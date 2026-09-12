import { Config } from "../config/store";
import { requestDebouncedAnimationFrame } from "../utils/debounced-animation-frame";
import { EasingParam, JSAnimation } from "animejs";
import { ElementWithUtils, qsr } from "../utils/dom";
import * as TestWords from "../test/test-words";

const wordsCache = qsr("#words");

export class Caret {
  private id: string;
  private element: ElementWithUtils;
  private readyToResetMarginTop: boolean = false;
  private isMainCaret: boolean = false;

  private posAnimation: JSAnimation | null = null;
  private marginTopAnimation: JSAnimation | null = null;

  constructor(element: ElementWithUtils) {
    this.id = element.native.id;
    this.element = element;
    if (this.id === "caret") {
      this.isMainCaret = true;
    }
  }

  public show(): void {
    this.element.show();
    this.element.setStyle({ display: "" });
  }

  public hide(): void {
    this.element.hide();
  }

  public isHidden(): boolean {
    return this.element.hasClass("hidden");
  }

  public getWidth(): number {
    return this.element.getOffsetWidth();
  }

  public getHeight(): number {
    if (!this.isHidden()) {
      return this.element.getOffsetHeight();
    }

    let height = 0;
    this.show();
    height = this.element.getOffsetHeight();
    this.hide();
    return height;
  }

  public setPosition(options: { left: number; top: number }): void {
    this.posAnimation?.cancel();
    this.element.setStyle({
      left: `${options.left}px`,
      top: `${options.top}px`,
    });
  }

  public startBlinking(): void {
    if (Config.smoothCaret !== "off") {
      this.element.setStyle({ animationName: "caretFlashSmooth" });
    } else {
      this.element.setStyle({ animationName: "caretFlashHard" });
    }
  }

  public stopBlinking(): void {
    this.element.setStyle({ animationName: "none", opacity: "1" });
  }

  public updateBlinkingAnimation(): void {
    if (Config.smoothCaret === "off") {
      this.element.setStyle({ animationName: "caretFlashHard" });
    } else {
      this.element.setStyle({ animationName: "caretFlashSmooth" });
    }
  }

  public stopAllAnimations(): void {
    this.posAnimation?.cancel();
    this.marginTopAnimation?.cancel();
  }

  public clearMargins(): void {
    this.element.setStyle({ marginTop: "", marginLeft: "" });
    this.readyToResetMarginTop = false;
  }

  public handleLineJump(options: {
    newMarginTop: number;
    duration: number;
  }): void {
    // smooth line jump works by animating the words top margin.
    // to sync the carets to the lines, we need to do the same here.

    // using a readyToResetMarginTop flag here to make sure the animation
    // is fully finished before we reset the marginTop to 0

    // making sure to use a separate animation queue so that it doesnt
    // affect the position animations
    if (this.isMainCaret && options.duration === 0) return;

    // in case we have two line jumps in a row
    if (this.readyToResetMarginTop) {
      this.element.setStyle({
        marginTop: "0px",
      });
    }

    this.readyToResetMarginTop = false;

    if (options.duration === 0) {
      this.marginTopAnimation?.cancel();
      this.element.setStyle({ marginTop: `${options.newMarginTop}px` });
      this.readyToResetMarginTop = true;
      return;
    }

    this.marginTopAnimation = this.element.animate({
      marginTop: options.newMarginTop,
      duration: options.duration,
      onComplete: () => {
        this.readyToResetMarginTop = true;
      },
    });
  }

  public animatePosition(options: {
    left: number;
    top: number;
    duration?: number;
    easing?: EasingParam;
  }): void {
    const smoothCaretSpeed =
      Config.smoothCaret === "off"
        ? 0
        : Config.smoothCaret === "slow"
          ? 150
          : Config.smoothCaret === "medium"
            ? 100
            : Config.smoothCaret === "fast"
              ? 85
              : 0;

    const finalDuration = options.duration ?? smoothCaretSpeed;

    this.posAnimation = this.element.animate({
      left: options.left,
      top: options.top,
      duration: finalDuration,
      ease: options.easing ?? "inOut(1.25)",
    });
  }

  public goTo(options: {
    wordIndex: number;
    letterIndex: number;
    animate?: boolean;
    animationOptions?: {
      duration?: number;
      easing?: string;
    };
  }): void {
    requestDebouncedAnimationFrame(`caret.${this.id}.goTo`, () => {
      const word = wordsCache.qs(
        `.word[data-wordindex="${options.wordIndex}"]`,
      );
      const wordText = TestWords.words.get(options.wordIndex)?.display ?? "";
      const wordLength = Array.from(wordText).length;

      // caret can be either on the left side of the target letter or the right
      // we stick to the left side unless we are on the last letter or beyond
      // then we switch to the right side

      // we also clamp the letterIndex to be within the range of actual letters
      // anything beyond just goes to the edge of the word
      let side: "beforeLetter" | "afterLetter" = "beforeLetter";
      if (options.letterIndex >= wordLength) {
        side = "afterLetter";

        options.letterIndex -= 1;
      }

      if (options.letterIndex < 0) {
        options.letterIndex = 0;
      }

      if (word === null) return;

      const { left, top } = this.getTargetPosition({
        word,
        letterIndex: options.letterIndex,
        side,
      });

      // animation uses inline styles, so its fine to read inline here instead
      // of computed styles which would be much slower

      // if the margin animation finished, we reset it here by removing the margin
      // and offsetting the top by the same amount
      let currentMarginTop = parseFloat(
        this.element.getStyle().marginTop || "0",
      );
      if (this.readyToResetMarginTop) {
        this.readyToResetMarginTop = false;
        const currentTop = parseFloat(this.element.getStyle().top || "0");

        this.element.setStyle({
          marginTop: "0px",
          top: `${currentTop + currentMarginTop}px`,
        });
        currentMarginTop = 0;
      }

      // marginLeft is never set now that tape mode is gone, so it is always 0
      const currentMarginLeft = 0;

      /**
       * we subtract the margin from the target position in order to arrive at the intended location
       * if my margin is +20 and I wanna go to +50, then if I set my inline style left/top to +50
       * I will arrive to +70. However if I set it to (50 - 20), my left/top will be +30 and my margin
       * will be +20 and I will end up at (30 + 20) = 50
       */

      const animateOrPositionOptions = {
        left: left - currentMarginLeft,
        top: top - currentMarginTop,
        ...(options.animate && options.animationOptions),
      };

      if (options.animate) {
        this.animatePosition(animateOrPositionOptions);
      } else {
        this.setPosition(animateOrPositionOptions);
      }
    });
  }

  private getTargetPosition(options: {
    word: ElementWithUtils;
    letterIndex: number;
    side: "beforeLetter" | "afterLetter";
  }): { left: number; top: number } {
    const letters = options.word?.qsa("letter");

    if (letters.length === 0) {
      throw new Error("Caret getTargetPosition: no letters found in word");
    }

    let letter = letters[options.letterIndex] ?? letters[letters.length - 1];

    if (!letter) {
      throw new Error(
        `Caret getTargetPosition: letter not found for index ${options.letterIndex}`,
      );
    }

    //if the letter is not visible, use the closest visible letter
    const isLetterVisible = letter.getOffsetWidth() > 0;
    if (!isLetterVisible) {
      for (let i = options.letterIndex - 1; i >= 0; i--) {
        const loopLetter = letters[i] as ElementWithUtils;

        // find the closest visible letter before the current letter
        if (loopLetter.getOffsetWidth() > 0) {
          letter = loopLetter;
          break;
        }
      }
    }

    let left = 0;
    let top = 0;

    let afterLetterCorrection = 0;
    if (options.side === "afterLetter") {
      afterLetterCorrection += letter.getOffsetWidth();
    }
    left += letter.getOffsetLeft();
    left += options.word.getOffsetLeft();
    left += afterLetterCorrection;

    //top position
    top += letter.getOffsetTop();
    top += options.word.getOffsetTop();

    // center vertically in the letter, and horizontally on its edge
    top += (letter.getOffsetHeight() - this.getHeight()) / 2;
    left += (this.getWidth() / 2) * -1;

    return { left, top };
  }
}
