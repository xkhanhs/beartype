import * as TestUI from "../../test/test-ui";
import {
  decreaseActiveWordIndex,
  getActiveWordIndex,
  increaseActiveWordIndex,
} from "../../states/test";
import * as TestLogic from "../../test/test-logic";
import * as TestWords from "../../test/test-words";
import { showLoaderBar, hideLoaderBar } from "../../states/loader-bar";
import { setInputElementValue } from "../input-element";
import { setAwaitingNextWord } from "../state";
import { DeleteInputType } from "./input-type";
import { getInputForWord } from "../../test/events/data";

type GoToNextWordParams = {
  correctInsert: boolean;
  now: number;
};

type GoToNextWordReturn = {
  increasedWordIndex: boolean;
  lastBurst: number | null;
};

export async function goToNextWord({
  correctInsert,
}: GoToNextWordParams): Promise<GoToNextWordReturn> {
  const ret: GoToNextWordReturn = {
    increasedWordIndex: false,
    lastBurst: null,
  };

  TestUI.beforeTestWordChange("forward", correctInsert);

  const lastWord = getActiveWordIndex() >= TestWords.words.length - 1;
  if (lastWord) {
    setAwaitingNextWord(true);
    showLoaderBar();
    await TestLogic.addWord();
    hideLoaderBar();
    setAwaitingNextWord(false);
  } else {
    void TestLogic.addWord();
  }

  if (getActiveWordIndex() < TestWords.words.length - 1) {
    ret.increasedWordIndex = true;
    increaseActiveWordIndex();
  }

  setInputElementValue("");
  void TestUI.afterTestWordChange("forward", ret.lastBurst);

  return ret;
}

export function goToPreviousWord(inputType: DeleteInputType): void {
  if (getActiveWordIndex() === 0) {
    setInputElementValue("");
    return;
  }

  TestUI.beforeTestWordChange("back", null);

  decreaseActiveWordIndex();

  if (inputType === "deleteWordBackward") {
    setInputElementValue("");
  } else if (inputType === "deleteContentBackward") {
    const word = getInputForWord(getActiveWordIndex());
    if (word.endsWith("\n") || word.endsWith(" ")) {
      setInputElementValue(word.slice(0, -1));
    } else {
      setInputElementValue(word);
    }
  }
  void TestUI.afterTestWordChange("back");
}
