/**
 * Determines if the test should finish
 * @param options - Options object
 * @param options.goingToNextWord - Is this input committing the word and moving on
 * @param options.testInputWithData - Current test input result (after adding data)
 * @param options.currentWord - Current target word
 * @param options.allWordsTyped - Have all words been typed
 * @returns Boolean if test should finish
 */
export function checkIfFinished(options: {
  goingToNextWord: boolean;
  testInputWithData: string;
  currentWord: string;
  allWordsTyped: boolean;
  allWordsGenerated: boolean;
}): boolean {
  const {
    goingToNextWord,
    testInputWithData,
    currentWord,
    allWordsTyped,
    allWordsGenerated,
  } = options;
  const wordIsCorrect = testInputWithData === currentWord;
  if (
    allWordsTyped &&
    allWordsGenerated &&
    (wordIsCorrect || goingToNextWord)
  ) {
    return true;
  }
  return false;
}
