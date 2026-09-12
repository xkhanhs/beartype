import { describe, it, expect, vi, beforeEach } from "vitest";

const { getLanguage, show, generateWords } = vi.hoisted(() => ({
  getLanguage: vi.fn(),
  show: vi.fn(),
  generateWords: vi.fn(),
}));

vi.mock("../../src/ts/utils/json-data", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  getLanguage,
}));
vi.mock("../../src/ts/elements/test-init-failed", () => ({
  show,
  hide: vi.fn(),
}));
vi.mock("../../src/ts/test/words-generator", () => ({
  generateWords,
  areAllWordsGenerated: vi.fn(() => false),
}));
vi.mock("../../src/ts/test/test-ui", () => ({
  fadeOutForRestart: vi.fn(async () => undefined),
  fadeInAfterRestart: vi.fn(async () => undefined),
  onTestRestart: vi.fn(),
  setJoiningClass: vi.fn(),
}));

import { restart } from "../../src/ts/test/test-logic";
import { Config } from "../../src/ts/config/store";
import { isTestRestarting } from "../../src/ts/states/test";

describe("starting a test when the words cannot be had", () => {
  beforeEach(() => {
    getLanguage.mockReset();
    show.mockReset();
    generateWords.mockReset();
  });

  it("stops after one failed word-list load and says so on screen", async () => {
    getLanguage.mockRejectedValue(new Error("404 Not Found"));

    await restart({ noAnim: true });

    expect(getLanguage).toHaveBeenCalledTimes(1);
    expect(show).toHaveBeenCalledTimes(1);
    expect(show).toHaveBeenCalledWith(
      "Không tải được danh sách từ. Kiểm tra mạng rồi bấm gõ lại.",
      "Error: 404 Not Found",
    );
    expect(isTestRestarting()).toBe(false);
  });

  it("tries the load again on the next restart", async () => {
    getLanguage.mockRejectedValueOnce(new Error("Failed to fetch"));
    await restart({ noAnim: true });
    getLanguage.mockRejectedValueOnce(new Error("Failed to fetch"));
    await restart({ noAnim: true });

    expect(getLanguage).toHaveBeenCalledTimes(2);
  });

  it("stops after one throwing word generator", async () => {
    getLanguage.mockResolvedValue({ name: Config.language, words: ["a"] });
    generateWords.mockRejectedValue(new Error("Random word is empty"));

    await restart({ noAnim: true });

    expect(generateWords).toHaveBeenCalledTimes(1);
    expect(show).toHaveBeenCalledWith(
      "Không tạo được bài gõ. Bấm gõ lại để thử lần nữa.",
      "Error: Random word is empty",
    );
  });
});
