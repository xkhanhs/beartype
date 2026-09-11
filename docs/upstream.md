# Upstream

beartype là bản chép sạch của [monkeytypegame/monkeytype](https://github.com/monkeytypegame/monkeytype)
(GPL-3.0), không mang lịch sử git.

| | |
|---|---|
| SHA | `91bd24bb8513785c7364cbea29296ff7adafac41` |
| Ngày commit | 2026-08-15 |
| Nhập vào beartype | 2026-09-11, commit `1b88575` |
| Test frontend lúc nhập | 54 file, 1.076 test, xanh (Node 24.20, pnpm 11.21) |

## So một file với upstream

Bản clone monkeytype nằm cạnh repo này ở `~/Documents/GitHub/monkeytype`:

```bash
git -C ../monkeytype show 91bd24bb:frontend/src/ts/test/test-ui.ts | diff - frontend/src/ts/test/test-ui.ts
```

## Những file không được sửa

Đây là chỗ cảm giác gõ của monkeytype nằm. Chỉ được sửa ở những khối đánh dấu
`// beartype:`, và mỗi khối phải ghi vào bảng dưới.

- `frontend/src/ts/input/**`
- `frontend/src/ts/test/test-ui.ts`, `caret.ts`, `test-timer.ts`, `test-logic.ts`,
  `words-generator.ts`, `pace-caret.ts`, `test/events/**`
- `frontend/src/ts/legacy-states/composition.ts`
- `frontend/src/ts/utils/debounced-animation-frame.ts`
- `frontend/src/styles/caret.scss`, `frontend/src/styles/test.scss`

## Các chỗ đã sửa trong lõi

| File | Khối | Vì sao |
|------|------|--------|
| `test/test-logic.ts` | bỏ `saveResult`, nhánh tài khoản trong `finish`, analytics, Sentry, tag | không còn tài khoản; kết quả hợp lệ lưu vào `beartype/local-results.ts` **sau** khi màn kết quả đã so với PB cũ |
| `test/pace-caret.ts` | import `DB` và `getUserAverage10Once`… trỏ sang `beartype/local-results`; nhánh `tagPb` trả 0 | "average"/"pb" đọc kết quả trên máy; không còn tag |
| `test/test-ui.ts` | gỡ 2 lời gọi `AdController` và import của nó | không còn quảng cáo |
| `input/hotkeys/index.ts` | gỡ import `commandline` và `konami` | không còn commandline |
| `input/helpers/validation.ts` | `isCharCorrect`: phím chữ sai khi nó **tạo thêm một lỗi** trong từ (`isWrongKey`) | `e` dưới `ế` là chưa xong, không phải sai; phím cách giữ luật cũ |
| `test/events/stats.ts` | `countCharsForWordIndex` đếm theo phím (`countKeysAsChars`); phần trăm của `getAccuracy` theo keybear | WPM và độ chính xác theo phím đáng tốn, xem `beartype/scoring.ts` |
| `test/test-ui.ts` | `updateWordLetters`: thêm nhánh `else if` vẽ từ đang gõ bằng `beartype/word-html.ts` khi không có funbox tự vẽ | mỗi chữ đích một ô, chữ đang dựng dấu là `partial`; code vẽ gốc nằm nguyên ở nhánh `else` |
| `test/caret.ts` | `updatePosition`: chỉ số chữ lấy từ `caretIndex` | con trỏ không nhảy tới rồi lùi khi bộ gõ viết lại chữ |
| `test/pace-caret.ts` | `stepSeconds`: mỗi chữ mất `spc × số phím` | con trỏ nhịp đi đúng tốc độ tính theo phím |
| `test/words-generator.ts` | `withToneStyle(từ, getToneStyle())` trước khi trả từ | vẽ `hoà`/`hòa` theo kiểu bộ gõ của máy |
| `test/test-logic.ts` | `learnToneStyle(getInputHistory(eventLog))` khi kết thúc bài | học kiểu bỏ dấu từ chính những gì đã gõ |
| `test/test-logic.ts` | cuối `finish`: ghi các từ đã chốt vào sổ từ hay sai (`beartype/miss-book.ts`), kể cả từ có phím sai đã xoá trước dấu cách (đọc `correct` của sự kiện `insertText`) | nút luyện từ hay sai; beartype có phím xoá nên chỉ đọc từ đã chốt thì sổ trống với người sửa lỗi ngay khi gõ |
| `test/test-timer.ts` | hai thông báo khi đồng hồ chạy chậm, dịch sang tiếng Việt | chỉ đổi chữ; điều kiện dừng bài giữ nguyên |
| `test/test-logic.ts` | ba thông báo dịch sang tiếng Việt: thôi luyện từ hay sai (`restart`), không tải được bộ từ (`init`), không tạo được bài gõ | chỉ đổi chữ |
| `test/test-logic.ts` | `finish`: một `showNoticeNotification` rỗng che hàm cùng tên, ngay trước các phép kiểm tra bài hợp lệ | màn kết quả đã ghi lý do bằng tiếng Việt; các phép kiểm tra (quá ngắn, ngừng gõ, độ chính xác dưới 75%...) giữ nguyên |

Phần vận chuyển phím (`input/handlers`, `input/listeners`, `input-element.ts`), gom khung hình (`utils/debounced-animation-frame.ts`), cuộn dòng và `elements/caret.ts` chưa bị sửa dòng nào; `test-timer.ts` chỉ đổi chữ của hai thông báo. Mọi chỗ ở bảng trên nằm trong khối có chú thích `beartype:`.
