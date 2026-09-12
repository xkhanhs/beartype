let awaitingNextWord = false;
let lastInsertCompositionTextData = "";

export function isAwaitingNextWord(): boolean {
  return awaitingNextWord;
}

export function setAwaitingNextWord(value: boolean): void {
  awaitingNextWord = value;
}

export function getLastInsertCompositionTextData(): string {
  return lastInsertCompositionTextData;
}

export function setLastInsertCompositionTextData(value: string): void {
  lastInsertCompositionTextData = value;
}
