import * as TestUI from "../../test/test-ui";
import { getInputElementValue } from "../input-element";

import { goToPreviousWord } from "../helpers/word-navigation";
import { DeleteInputType } from "../helpers/input-type";
import { getCurrentInput, logTestEvent } from "../../test/events/data";
import { getActiveWordIndex } from "../../states/test";

export function onDelete(inputType: DeleteInputType, now: number): void {
  const { realInputValue } = getInputElementValue();

  const inputBeforeDelete = getCurrentInput();
  const activeWordIndexBeforeDelete = getActiveWordIndex();

  const inputAfterDelete = getInputElementValue().inputValue;

  //normal backspace
  if (realInputValue === "") {
    // if the input is NOT empty, that means the ctrl backspace deleted more than just the fake space (THANKS FIREFOX)
    // which means we need to force update the current word element when we move back
    goToPreviousWord(inputType);

    // Record the resulting state of the destination word
    const postNavInputValue = getInputElementValue().inputValue;
    logTestEvent("input", now, {
      inputType: inputType,
      wordIndex: getActiveWordIndex(),
      charIndex: postNavInputValue.length,
      inputValue: postNavInputValue,
      ...(inputBeforeDelete !== "" ? { clearedNextWord: true } : {}),
    });
  } else {
    // Delete within current word
    logTestEvent("input", now, {
      inputType: inputType,
      wordIndex: activeWordIndexBeforeDelete,
      charIndex: inputBeforeDelete.length,
      inputValue: inputAfterDelete,
    });
  }

  TestUI.afterTestDelete();
}
