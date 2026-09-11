import { Config } from "../config/store";
import * as CustomText from "./custom-text";
import { Wordset, withWords } from "./wordset";
import * as PractiseWords from "./practise-words";
import * as Arrays from "../utils/arrays";
import { WordGenError } from "../utils/word-gen-error";

import { LanguageObject } from "@monkeytype/schemas/languages";
import { isRepeated } from "../states/test";
import * as TestWords from "./test-words";
import { withToneStyle } from "../beartype/vietnamese";
import { getToneStyle } from "../beartype/tone-style";

export function getLimit(): number {
  let limit = 100;

  //infinite words
  if (Config.mode === "words" && Config.words === 0) {
    limit = 100;
  }

  //custom
  if (Config.mode === "custom") {
    if (
      CustomText.getLimitValue() === 0 ||
      CustomText.getLimitMode() === "time"
    ) {
      limit = 100;
    } else {
      limit =
        CustomText.getLimitValue() > 100 ? 100 : CustomText.getLimitValue();
    }
  }

  //make sure the limit is not higher than the word count
  if (Config.mode === "words" && Config.words !== 0 && Config.words < limit) {
    limit = Config.words;
  }

  if (
    Config.mode === "custom" &&
    CustomText.getLimitMode() === "word" &&
    CustomText.getLimitValue() < limit &&
    CustomText.getLimitValue() !== 0
  ) {
    limit = CustomText.getLimitValue();
  }

  return limit;
}

let currentWordset: Wordset | null = null;
let currentLanguage: LanguageObject | null = null;

type GenerateWordsReturn = {
  words: string[];
  sectionIndexes: number[];
  hasTab: boolean;
  hasNewline: boolean;
  allRightToLeft?: boolean;
  allJoiningScript?: boolean;
};

export async function generateWords(
  language: LanguageObject,
): Promise<GenerateWordsReturn> {
  if (!isRepeated()) {
    previousGetNextWordReturns = [];
  }
  currentSection = [];
  sectionIndex = 0;
  sectionHistory = [];
  currentLanguage = language;
  const rawWordList: string[] = [];
  const ret: GenerateWordsReturn = {
    words: [],
    sectionIndexes: [],
    hasTab: false,
    hasNewline: false,
    allRightToLeft: language.rightToLeft,
    allJoiningScript: language.joiningScript ?? false,
  };

  let wordList = language.words;
  if (Config.mode === "custom") {
    wordList = CustomText.getText();
  }

  const customAndUsingPipeDelimiter =
    Config.mode === "custom" && CustomText.getPipeDelimiter();

  const limit = getLimit();
  console.debug(
    `${customAndUsingPipeDelimiter ? "Section" : "Word"} limit ${limit}`,
  );

  currentWordset = await withWords(wordList);

  console.debug("Wordset", currentWordset);

  if (limit === 0) {
    return ret;
  }

  let stop = false;
  let i = 0;
  while (!stop) {
    const nextWord = await getNextWord(
      i,
      limit,
      Arrays.nthElementFromArray(rawWordList, -1) ?? "",
      Arrays.nthElementFromArray(rawWordList, -2) ?? "",
    );
    rawWordList.push(nextWord.wordRaw);
    ret.words.push(nextWord.word);
    ret.sectionIndexes.push(nextWord.sectionIndex);

    if (customAndUsingPipeDelimiter) {
      //generate a given number of sections, make sure to not cut a section off
      const sectionFinishedAndOverLimit =
        currentSection.length === 0 && sectionIndex >= limit;
      //make sure we dont go over a hard limit, in cases where the sections are very large
      const upperWordLimit = ret.words.length >= 100;
      if (sectionFinishedAndOverLimit || upperWordLimit) {
        stop = true;
      }
    } else if (ret.words.length >= limit) {
      stop = true;
    }
    i++;
  }

  ret.hasTab =
    ret.words.some((w) => w.includes("\t")) ||
    currentWordset.words.some((w) => w.includes("\t"));
  ret.hasNewline =
    ret.words.some((w) => w.includes("\n")) ||
    currentWordset.words.some((w) => w.includes("\n"));

  sectionHistory = []; //free up a bit of memory? is that even a thing?
  return ret;
}

export let sectionIndex = 0;
export let currentSection: string[] = [];
let sectionHistory: string[] = [];

let previousGetNextWordReturns: GetNextWordReturn[] = [];

type GetNextWordReturn = {
  word: string;
  wordRaw: string;
  sectionIndex: number;
};

//generate next word
export async function getNextWord(
  wordIndex: number,
  wordsBound: number,
  previousWord: string | undefined,
  previousWord2: string | undefined,
): Promise<GetNextWordReturn> {
  console.debug("Getting next word", {
    isRepeated: isRepeated(),
    currentWordset,
    wordIndex,
    language: currentLanguage,
    wordsBound,
    previousWord,
    previousWord2,
  });

  if (currentWordset === null) {
    throw new WordGenError("Current wordset is null");
  }

  if (currentLanguage === null) {
    throw new WordGenError("Current language is null");
  }

  if (isRepeated()) {
    const repeated = previousGetNextWordReturns[wordIndex];

    if (repeated === undefined) {
      // if the repeated word is undefined, that means we are out of words from the previous test
      // we need to either throw, or revert to random generation
      // reverting should only happen in certain cases

      let continueRandomGeneration = false;

      if (
        Config.mode === "time" ||
        (Config.mode === "custom" && CustomText.getLimitMode() === "time") ||
        (Config.mode === "custom" &&
          CustomText.getLimitMode() === "word" &&
          wordIndex < CustomText.getLimitValue()) ||
        (Config.mode === "custom" &&
          CustomText.getLimitMode() === "section" &&
          sectionIndex < CustomText.getLimitValue()) ||
        (Config.mode === "words" && wordIndex < Config.words)
      ) {
        continueRandomGeneration = true;
      }

      if (!continueRandomGeneration) {
        throw new WordGenError("Repeated word is undefined");
      } else {
        console.debug(
          "Repeated word is undefined but random generation is allowed - getting random word",
        );
      }
    } else {
      console.debug("Repeated word: ", repeated);
      sectionIndex++;
      return repeated;
    }
  }

  let randomWord = currentWordset.randomWord();
  const previousWordRaw = previousWord
    ?.replace(/[.?!":\-,]/g, "")
    .toLowerCase();
  const previousWord2Raw = previousWord2
    ?.replace(/[.?!":\-,']/g, "")
    .toLowerCase();

  if (currentSection.length === 0) {
    if (Config.mode === "custom" && CustomText.getMode() === "repeat") {
      randomWord = currentWordset.nextWord();
    } else if (
      Config.mode === "custom" &&
      CustomText.getMode() === "random" &&
      (currentWordset.length < 4 || PractiseWords.before.mode !== null)
    ) {
      randomWord = currentWordset.randomWord();
    } else if (Config.mode === "custom" && CustomText.getMode() === "shuffle") {
      randomWord = currentWordset.shuffledWord();
    } else if (
      Config.mode === "custom" &&
      CustomText.getLimitMode() === "section"
    ) {
      randomWord = currentWordset.randomWord();

      const previousSection = Arrays.nthElementFromArray(sectionHistory, -1);
      const previousSection2 = Arrays.nthElementFromArray(sectionHistory, -2);

      let regenerationCount = 0;
      while (
        regenerationCount < 100 &&
        (previousSection === randomWord || previousSection2 === randomWord)
      ) {
        regenerationCount++;
        randomWord = currentWordset.randomWord();
      }
    } else {
      let regenarationCount = 0; //infinite loop emergency stop button
      let firstAfterSplitLazy = (
        randomWord.split(" ")[0] as string
      ).toLowerCase();
      while (
        regenarationCount < 100 &&
        (previousWordRaw === firstAfterSplitLazy ||
          previousWord2Raw === firstAfterSplitLazy ||
          (Config.mode !== "custom" && randomWord === "I") ||
          (Config.mode !== "custom" &&
            !Config.language.startsWith("code") &&
            /[-=_+[\]{};'\\:"|,./<>?]/i.test(randomWord)) ||
          (Config.mode !== "custom" && /[0-9]/i.test(randomWord)))
      ) {
        regenarationCount++;
        randomWord = currentWordset.randomWord();
        firstAfterSplitLazy = randomWord.split(" ")[0] as string;
      }
    }
    randomWord = randomWord.replace(/ +/g, " ");
    randomWord = randomWord.replace(/(^ )|( $)/g, "");

    currentSection = [...randomWord.split(" ")];
    sectionHistory.push(randomWord);
    randomWord = currentSection.shift() as string;
    sectionIndex++;
  } else {
    randomWord = currentSection.shift() as string;
  }

  if (randomWord === undefined) {
    throw new WordGenError("Random word is undefined");
  }

  if (randomWord === "") {
    throw new WordGenError("Random word is empty");
  }

  if (/ /g.test(randomWord)) {
    throw new WordGenError("Random word contains spaces");
  }

  const randomWordLanguage = Config.language;

  if (
    Config.mode !== "custom" &&
    /[A-Z]/.test(randomWord) &&
    !randomWordLanguage.startsWith("german") &&
    !randomWordLanguage.startsWith("swiss_german") &&
    !randomWordLanguage.startsWith("code") &&
    !randomWordLanguage.startsWith("klingon")
  ) {
    randomWord = randomWord.toLowerCase();
  }

  randomWord = randomWord.replace(/ +/gm, " ");
  randomWord = randomWord.replace(/(^ )|( $)/gm, "");

  if (Config.language.startsWith("swiss_german")) {
    randomWord = randomWord.replace(/ß/g, "ss");
  }

  // beartype: draw the tone the way this computer's input method writes it
  // (`hoà` or `hòa`); see beartype/tone-style.ts
  randomWord = withToneStyle(randomWord, getToneStyle());

  console.debug("Word:", randomWord);

  const ret = {
    word: appendCommitCharacter(randomWord),
    wordRaw: randomWord,
    sectionIndex: sectionIndex,
  };

  previousGetNextWordReturns.push(ret);

  return ret;
}

/**
 * Appends the inter-word commit separator the way the generator does: a
 * trailing space, unless the word already ends with a newline.
 */
export function appendCommitCharacter(word: string): string {
  if (word.endsWith("\n")) {
    return word;
  }
  return `${word} `;
}

export function areAllWordsGenerated(): boolean {
  return (
    (Config.mode === "words" &&
      TestWords.words.length >= Config.words &&
      Config.words > 0) ||
    (Config.mode === "custom" &&
      CustomText.getLimitMode() === "word" &&
      TestWords.words.length >= CustomText.getLimitValue() &&
      CustomText.getLimitValue() !== 0) ||
    (Config.mode === "custom" &&
      CustomText.getLimitMode() === "section" &&
      sectionIndex >= CustomText.getLimitValue() &&
      currentSection.length === 0 &&
      CustomText.getLimitValue() !== 0)
  );
}
