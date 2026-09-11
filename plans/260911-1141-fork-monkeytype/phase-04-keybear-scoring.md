---
phase: 4
title: "Chấm điểm theo keybear"
status: completed
priority: P1
effort: "1-2d"
dependencies: [3]
---

# Phase 4: Chấm điểm theo keybear

## Overview
Chỗ duy nhất beartype sửa lõi gõ của monkeytype. Monkeytype so **từng ký tự ở
cùng vị trí**; với tiếng Việt qua bộ gõ, `e` đứng dưới `ế` là sai, `cuooc` (bộ gõ
đang chờ xem có phải `coong`) dài 5 so với `cuộc` dài 4 và đẩy chữ `c` sang ô
sai. Keybear đã giải chuyện này trong `packages/page-practice/lib/typetest/scoring.ts`:
khớp theo **phím**, không theo chỉ số ký tự.

## Hiện trạng monkeytype (đã đọc code, SHA `91bd24b`)
Đúng/sai được quyết định ở ba nơi, và cả ba đều là so ký tự cùng vị trí:

| Nơi | Làm gì | Hệ quả với tiếng Việt |
|-----|--------|-----------------------|
| `input/helpers/validation.ts` `isCharCorrect` | `data === targetWord[inputValue.length]`, ghi vào cờ `correct` của sự kiện | `e` cho `ế` = một phím sai, trừ độ chính xác |
| `test/events/stats.ts` `countCharsForWordIndex` → `utils/strings` `countChars` | đếm correct/incorrect/extra/missed cho kết quả và WPM | chữ dựng dở cuối bài bị tính sai |
| `test/test-ui.ts` `updateWordLetters` (~dòng 795) | `currentWordChars[i] === inputChars[i]` → class `correct`/`incorrect`/`extra` | chữ đỏ nháy lên giữa lúc dựng dấu; `cuooc` hiện một ô thừa |

Mọi con số kết quả suy ra từ **nhật ký sự kiện** (`test/events/data.ts`), nên chỉ
cần sửa đúng ba chỗ trên — không phải viết lại phần tính toán.

## Architecture
1. **Chép bộ chấm keybear** thành `frontend/src/ts/beartype/scoring.ts`
   (+ test chép từ `scoring.test.ts`): `align`, `commitScore`, `partialScore`,
   `cutoffScore`, `offTrack`, `compareWord`, `caretIndex`, `wordCost`. Phụ thuộc
   `telexKeysOf` (keybear tự viết, `keybr-lesson/lib/speedupwords.ts`) chép theo;
   `MARKS` của `@keybr/unicode` thay bằng tập dấu kết hợp U+0300–U+0323 viết tay
   (5 dấu thanh + mũ, móc, trăng) — đừng kéo cả package keybr.
   Với chữ không dấu, `keysOfChar(c) = [c]`, nên cùng một bộ chấm chạy đúng cho
   tiếng Anh, không cần nhánh ngôn ngữ.
2. **Ba chỗ nối**, mỗi chỗ một khối có chú thích `// beartype:` để diff với
   upstream đọc ra ngay:
   - `isCharCorrect` → phím này có **đẩy từ từ "trên đường" sang "chệch"** không:
     `!(offTrack(target, input + data) && !offTrack(target, input))`. Đây là
     đúng luật `typos` của keybear (`use-typetest.ts`): lỗi đã sửa vẫn được đếm,
     chữ dựng dở không bị đếm.
   - `countCharsForWordIndex` → trả số phím từ `commitScore` (từ đã chốt),
     `cutoffScore` (từ cuối khi hết giờ). WPM và độ chính xác lấy theo
     `session.ts` của keybear: `wpm = correct / 5 / phút`,
     `accuracy = correct / total`. Số "lỗi đã sửa" hiện riêng, không trộn vào
     độ chính xác — cũng như keybear.
   - `updateWordLetters`, nhánh từ đang gõ → lặp theo `compareWord(target, input)`
     thay vì theo ký tự nhập. `partial` vẽ như `correct` (không đỏ), `wrong` →
     `incorrect`, `extra` → `incorrect extra`. Vị trí con trỏ: xem mục dưới.
3. **Kiểu bỏ dấu (`oà` hay `òa`)**. Monkeytype vẽ theo kiểu cũ (`hòa`, `tòa`
   trong `vietnamese_1k.json`), còn anh gõ kiểu mới (`hoà`, `uý`). Kiểu nào là
   ô đánh dấu trong bộ gõ của máy, không phải lựa chọn của trang, nên beartype
   **vẽ từ theo kiểu bộ gõ đang viết ra** — đúng cách keybear làm
   (`keybr-unicode/lib/vietnamese.ts`: `toneStyleOf`, `withToneStyle`; và
   `typetest/words.ts` áp kiểu lúc bốc từ).
   - Chép `vietnamese.ts` (cả `MARKS`, `TONES`) thành `beartype/vietnamese.ts`
     cùng test của nó. File này thay luôn tập `MARKS` viết tay nói ở mục 1.
   - Mặc định **kiểu mới**. Mỗi từ đã chốt mà `toneStyleOf(typed) != null` thì
     ghi kiểu ấy vào `localStorage` (`beartype:v1:toneStyle`). Từ bài sau, danh
     sách từ vẽ theo kiểu đó. Không có ô cài đặt: bộ gõ đã quyết rồi.
   - Ở chỗ vào bộ chấm, đổi chữ đã gõ sang kiểu của từ đích
     (`withToneStyle(typed, toneStyleOf(target) ?? style)`) trước khi `align`.
     Nhờ vậy lỡ lệch kiểu (đổi bộ gõ giữa bài) cũng không bị tính là gõ sai.
     Chỉ có 47/4694 từ rơi vào chỗ tranh chấp (âm tiết mở `oa` `oe` `uy`, có
     dấu, không phải `qu`).
   - Test: `hoà` gõ ra khi đích là `hòa` được 100% và từ ấy không vào sổ từ hay
     sai; sau từ đó, bài mới vẽ `hoà`.
4. **Con trỏ nhịp** (`pace-caret.ts`): đi theo ký tự/giây. Đổi bước của nó thành
   theo phím — mỗi chữ tốn `keyCost(chữ)` phần thời gian — để một con trỏ nhịp
   60 WPM đi đúng tốc độ của một người gõ 60 WPM theo cách beartype đếm. Với
   tiếng Anh không đổi gì.
5. **Con trỏ**: monkeytype đặt caret theo độ dài ô nhập. Với `thaa` → `thâ` nó
   sẽ nhảy tới rồi lùi. **Không đổi trước khi đo.** Đo trên bản phase 3 bằng
   VTX: có cú lùi nào không (cách đo có sẵn trong keybear
   `docs/screens/typetest.md`, 2026-09-06). Chỉ khi có mới đưa `caretIndex` vào
   chỗ `caret.ts` lấy chỉ số chữ — một dòng.

## Related Code Files
- Create: `frontend/src/ts/beartype/scoring.ts`, `telex-keys.ts`,
  `vietnamese.ts`, `tone-style.ts` (nhớ kiểu bộ gõ viết), test đi kèm
- Modify (chỉ khối `// beartype:`): `input/helpers/validation.ts`,
  `test/events/stats.ts`, `test/test-ui.ts`, `test/pace-caret.ts`,
  `test/words-generator.ts` (áp `withToneStyle` lúc bốc từ), có thể `test/caret.ts`
- Nguồn chép: keybear `packages/page-practice/lib/typetest/scoring.ts`,
  `scoring.test.ts`, `session.ts` (công thức), `keybr-lesson/lib/speedupwords.ts`,
  `keybr-unicode/lib/vietnamese.ts` (+ test)

## Implementation Steps
1. Chép bộ chấm + test, chạy xanh trong vitest (đổi `node:test`/`rich-assert`
   sang `vitest`).
2. Test so sánh: cùng một dãy trạng thái ô nhập (ghi từ keybear cho vài từ
   `tiếng`, `cuộc`, `người`, `nghiêng`, gõ đúng / bỏ dấu / gõ nhầm / sửa lỗi) →
   beartype và keybear cho **cùng** correct/total/typos.
3. Sửa ba chỗ nối. Chạy lại toàn bộ test `__tests__/input` và `__tests__/test`;
   test nào đỏ vì luật mới (vd. test mong `e` ≠ `ế` là sai) thì sửa kỳ vọng và
   ghi lý do, không xoá.
4. Đo con trỏ như trên, quyết định có đụng `caret.ts` không.
5. Cổng "vẫn gõ y hệt" với tiếng Anh — ở tiếng Anh ba chỗ nối phải cho kết quả
   giống hệt code gốc.

## Success Criteria
- [ ] Gõ `tiếng` bằng Telex `tieesng`: không ô nào đỏ lúc nào, độ chính xác 100%.
- [ ] Gõ `tieng` rồi cách: mất đúng 2 phím (mũ + sắc), không mất cả từ.
- [ ] Gõ sai một chữ rồi xoá sửa: độ chính xác 100%, "lỗi đã sửa" = 1.
- [ ] Tiếng Anh: kết quả trùng bản gốc trên cùng nhật ký sự kiện (test).
- [ ] Bộ gõ để kiểu mới: màn hình vẽ `hoà`, `khoẻ`, `thuỷ`, không bao giờ
      vẽ `hòa`. Gõ `hòa` (kiểu cũ) vẫn được 100%.

## Risk Assessment
- **Monkeytype nhận chữ có dấu thế nào** khi VTX xoá-rồi-gõ-lại: có thể là
  `insertText` từng chữ, có thể `insertReplacementText`, có thể qua
  `composition.ts`. Ba chỗ nối trên chỉ đọc *giá trị ô nhập sau sự kiện*, nên
  không phụ thuộc đường nào — nhưng phải xác nhận `getCurrentInput()` trả đúng
  chuỗi VTX để lại, bằng log thật, trước khi viết chỗ nối.
- `updateWordLetters` được gọi qua gom khung hình theo chỉ số từ; chỉ đổi phần
  *tạo HTML* bên trong, không đổi lúc nào nó được gọi.
