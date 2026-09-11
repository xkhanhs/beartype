---
phase: 3
title: "Gỡ tính năng khỏi lõi, từng cụm"
status: completed
priority: P1
effort: "8h"
dependencies: [2]
---

# Phase 3: Gỡ tính năng khỏi lõi

## Overview
Phần lớn số dòng thừa nằm ở đây: `test-ui.ts` (2.104), `test-logic.ts` (1.158),
`words-generator.ts` (1.024), `events/stats.ts` (963), funbox (~1.500 kể cả
package), cùng các nhánh rải trong `input/`. Với cấu hình đang ghim, không nhánh
nào chạy tới. Gỡ chúng thì hành vi không đổi, nhưng các file này là cảm giác gõ,
nên đi từng cụm, mỗi cụm một commit, kiểm xong mới sang cụm sau.

## Cụm (mỗi cụm một commit, theo thứ tự này)
1. **Funbox**: `test/funbox/**`, `packages/funbox`, `config/funbox-validation.ts`,
   `test/poetry.ts`, `test/wikipedia.ts`, `test/weak-spot.ts` (nếu chỉ funbox dùng),
   `#memoryTimer`, `#layoutfluidTimer`, mọi `Config.funbox`/`FunboxProperty`.
2. **Chế độ ngoài time/words**: quote, zen, custom (và `wordset` nếu chỉ phục vụ custom):
   `controllers/quotes-controller.ts`, `test/custom-text.ts`, `types/quotes.ts`,
   `schemas/quotes`, nhánh `mode === "quote" | "zen" | "custom"` trong lõi và
   `TestConfig.tsx`, `repeatQuotes`, `quoteLength`, `customText`.
3. **Pace caret**: `test/pace-caret.ts`, `#paceCaret`, `paceCaret*`, `repeatedPace`,
   lời gọi trong `test-logic.ts`, `test-ui.ts`, `caret.ts`, `word-navigation.ts`.
4. **Tuỳ chọn sinh từ**: punctuation, numbers (`english-punctuation.ts`), lazy mode
   (`lazy-mode.ts`, `legacy-states/remember-lazy-mode.ts`), british english
   (`british-english.ts`, `constants/british-english.ts`), break-joining nếu chỉ
   phục vụ các tuỳ chọn này.
5. **Giả lập layout**: `test/layout-emulator.ts`, lời gọi trong `input/handlers/keydown.ts`,
   `Config.layout`, `constants/layouts.ts`. Giữ `modern-caps-lock` (cảnh báo Caps Lock dùng).
6. **Tuỳ chọn độ khó**: `stopOnError`, `difficulty`, `confidenceMode`, `freedomMode`,
   `strictSpace`, `minWpm`/`minAcc`/`minBurst`, `blindMode`, `indicateTypos`,
   `hideExtraLetters`, `oppositeShiftMode` (+ `shift-tracker.ts`), `quickEnd`,
   `codeUnindentOnBackspace`, `quickRestart` (giữ phím tắt tab+enter mặc định).
7. **Tuỳ chọn hiển thị**: `tapeMode`/`tapeMargin`, `flipTestColors`, `colorfulMode`,
   `highlightMode`, `typedEffect`, `showAllLines`, `maxLineWidth`, `timerStyle`/`timerColor`/`timerOpacity`,
   `liveSpeed/Acc/BurstStyle`, `burstHeatmap`, `alwaysShowWordsHistory`,
   `alwaysShowDecimalPlaces`, `typingSpeedUnit`, `showAverage`, `showPb`, `showKeyTips`.
   Mỗi khoá: giữ đúng giá trị beartype đang dùng, gỡ các nhánh còn lại.
8. **Trang trí của upstream**: `monkey` + `elements/monkey-power.ts`, `glarses-mode`,
   `customBackground*`, `randomTheme`, `customTheme*`, `favThemes`, `ads`,
   `today-tracker.ts`, practise words của upstream (`test/practise-words.ts`,
   `modals/practise-words.ts`) nếu nút luyện từ sai của beartype không dùng tới.
9. **Âm thanh tạm giữ nguyên** (`sound-controller.ts`, `playSoundOn*`): phase 6 dùng lại.
   Keymap: nhánh `keymapMode` trong lõi giữ lại (phase 6 bật).

## Cách làm một cụm
1. `grep` khoá config và tên module; liệt kê mọi chỗ đọc.
2. Mỗi chỗ `if (Config.x === <giá trị ghim>)`: giữ thân nhánh đúng, bỏ nhánh sai.
   Ternary cũng vậy. Không gộp hay đảo thứ tự các lệnh còn lại.
3. Bỏ khoá khỏi `default-config.ts` và `BEARTYPE_DEFAULTS`. Nếu `Config` còn đọc
   ở chỗ khác thì `tsc` sẽ báo, sửa hết rồi mới qua.
4. `vitest run`, `tsc`, build; mở dev, gõ một bài tiếng Việt và một bài tiếng Anh.
5. Commit `refactor(core): drop <tính năng>`. Nếu đổi test: chỉ xoá test của phần bị gỡ,
   không sửa kỳ vọng của test còn lại.

## Related Code Files
- Modify: `frontend/src/ts/test/{test-ui,test-logic,words-generator,test-timer,test-words,result}.ts`,
  `frontend/src/ts/test/events/*`, `frontend/src/ts/input/**`, `frontend/src/ts/states/test.ts`,
  `frontend/src/ts/constants/default-config.ts`, `frontend/src/ts/beartype/config-lock.ts`,
  `frontend/src/ts/components/pages/test/TestConfig.tsx`, `frontend/src/html/pages/test.html`,
  `frontend/src/styles/test.scss`, `packages/schemas/src/configs.ts`
- Delete: các module nêu trong từng cụm, `packages/funbox/`

## Success Criteria
- [ ] Mỗi cụm một commit xanh; `git bisect` qua được từng commit.
- [ ] Test của `__tests__/beartype/` và `__tests__/input/` không bị sửa kỳ vọng.
- [ ] Gõ bằng tay sau mỗi cụm không thấy khác (con trỏ, cuộn dòng, dấu dở, màn kết quả).

## Risk Assessment
- Nhầm giá trị ghim, giữ nhánh sai: hành vi đổi mà test có thể không bắt. Trước mỗi
  cụm, in `getBeartypeDefaults()` ra để so, không đoán theo tên.
- `events/stats.ts` và `test-timer.ts` quyết định WPM và điều kiện dừng bài. Chỉ bỏ
  nhánh chết, không đụng phép tính.
- Cụm 6 và 7 nhiều khoá, dễ sót. Được phép tách nhỏ hơn nữa nếu diff quá dài để đọc.
