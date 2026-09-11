let awaitingNextWord = false;
let lastBailoutAttempt = -1;
let lastInsertCompositionTextData = "";

export function isAwaitingNextWord(): boolean {
  return awaitingNextWord;
}

export function setAwaitingNextWord(value: boolean): void {
  awaitingNextWord = value;
}

export function getLastBailoutAttempt(): number {
  return lastBailoutAttempt;
}

export function setLastBailoutAttempt(value: number): void {
  lastBailoutAttempt = value;
}

export function getLastInsertCompositionTextData(): string {
  return lastInsertCompositionTextData;
}

export function setLastInsertCompositionTextData(value: string): void {
  lastInsertCompositionTextData = value;
}
