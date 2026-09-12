# Phase 2: TS chết ngoài đường gõ

Code upstream mà app không gọi, chỉ test của chính nó gọi (knip coi test là
entry nên không báo). Xoá code cùng test case của nó trong cùng commit, không
thì knip đỏ.

Cách tìm lại: chạy knip với cấu hình không có `__tests__` trong `entry`
(`entry: ["src/ts/index.ts", "scripts/build-vietnamese.ts", "vite.config.ts",
"vite-plugins/*.ts"]`).

## Việc (mỗi gạch đầu dòng một commit)

**2a. Hàm tiện ích không ai dùng** (~250 dòng src, ~350 dòng test)
- `utils/numbers.ts`: `abbreviateNumber`, `parseIntOptional`, `roundTo1`,
  `mapRange`, `safeNumber`.
- `utils/strings.ts`: `highlightMatches`, `replaceControlCharacters`.
- `utils/format.ts`: `rank()`.
- `utils/zod.ts`: `unwrapSchema`. `schemas/util.ts`: `slug`,
  `nameWithSeparators`.
- `test/events/stats.ts`: `getMissedWords`, `getCorrectedWordsHistory`.
- `config/utils.ts`: `getConfigChanges`. `states/theme.ts`: `updateThemeColor`.
- **Không xoá**: `config/testing.ts` (bốn spec dùng), `findInputValueMismatches`
  (oracle của test dựng lại log), các hàm chấm điểm trong `beartype/` (giữ cho
  khớp keybear), `applyConfig`/`getAllTestEvents`/`getKeymapLayout`/
  `SmoothCaretSchema`/`invalid` (dùng trong module, chỉ bỏ `export` nếu knip
  đòi).

**2b. `date-fns`** (~145 dòng src, ~88 dòng test)
- `utils/date-and-time.ts`: xoá `getFirstDayOfTheWeek` và bảng
  `weekStartsOnFallback`; giữ `secondsToString`. `pnpm remove date-fns`.

**2c. `dom.ts`** (~390 dòng)
- Xoá các method không ai gọi ngoài `dom.ts`: `append closestParent disable
  enable getAttribute getChecked getOuterWidth getSelected getValue
  hasAttribute isChecked isDisabled isFocused matches prependHtml
  removeAttribute replaceWith screenBounds select setChecked setSelected
  setValue slideDown slideUp toggleClass wrapWith`, bản collection tương ứng,
  `hasValue`/`hasSelectableValue`, các type `ElementWithValue*`.
- **Giữ** `bindReady`, `checkUniqueSelector` (hàm private, `qs`/`qsr`/
  `onDOMReady` dùng).
- Grep lại từng tên trước khi xoá; ts-check bắt phần sót.

**2d. Thông báo nổi** (~290 dòng src, ~330 dòng test)
- Xoá `states/notifications.ts`, `utils/error.ts` (chỉ notifications dùng) và
  mọi lời gọi: `test-logic.ts` (~17, gồm bản `showNoticeNotification` rỗng
  trong `finish()` ~582), `test-timer.ts` (cả `slowTimerNotifIds`),
  `input/handlers/keydown.ts`, `config/validation.ts`,
  `utils/local-storage-with-schema.ts`, `components/core/Theme.tsx`,
  `controllers/theme-controller.ts`, `event-handlers/global.ts`,
  `Overlays.tsx`.
- Xoá `notifications.spec.ts`; sửa spy trong `Theme.spec.tsx` (~32, ~110) và
  `config.spec.ts` (~35).
- Không có gì trên màn đổi: danh sách thông báo chưa bao giờ được gắn vào
  trang. Lời gọi trong `keydown.ts` nằm ở nhánh bỏ ngang (phase 4) — nếu tách
  được thì để nó sang phase 4.

**2e. Tiếng Hàn** (~80 dòng src, ~365 dòng test)
- `test/events/stats.ts:6` import và 363-370; `strings.countChars` (chỉ đường
  tiếng Hàn tới); `koreanStatus` ở `states/test.ts:149`, `test-logic.ts:181`,
  318-327; `events/data.ts:39`; `events/types.ts:147`; mock ở
  `stats.spec.ts:51`. `pnpm remove hangul-js`.
- `!koreanStatus` luôn đúng nên chấm điểm không đổi.

**2f. Signal không ai đọc, khoá cấu hình cố định** (~85 dòng)
- `states/test.ts`: `wordsHaveNumbers`, `isLongTest` và effect 113-123,
  `getLastResult`, `getLastSignedOutResult`; kéo theo vòng `hasNumbers` lúc
  init và `structuredClone` ở `finish` (~560).
- `getCompositionText`/`setCompositionText` (`composition.ts:47, 64`) nằm trong
  đường gõ: để sang phase 4.
- Khoá không ai đổi được, ra khỏi `Config` theo CLAUDE.md: `themeLight`,
  `themeDark` (+ handler `theme-controller.ts` 128-143), `showOutOfFocusWarning`
  (nhánh false ở `test-ui.ts:977`), `resultSaving` (kiểm ở `test-logic.ts` 145,
  668). Thêm các khoá này vào danh sách khoá bị bỏ trong
  `production-local-storage.spec.ts`.
- `CaretStyleSchema`: chỉ còn `"default"`; danh sách class trong
  `Caret.setStyle`.
- `updateWordWrapperClasses` (`test-ui.ts` ~371-375): bỏ `removeClass` của
  `tape`, `blind`, `hideExtraLetters`, `flipped`, `colorfulMode` (không ai
  thêm, không selector nào dùng; chạy lúc init/đổi cấu hình, không theo phím).

## Kiểm tra
Pre-push đầy đủ sau từng commit. `pnpm dev`: gõ một bài time và một bài words,
mở luyện từ hay sai, đổi theme — không có lỗi trong console.

## Rủi ro
Thấp. Bộ nhớ đầy (`local-storage-with-schema.ts:119`) vẫn im lặng như bây giờ.
