# Upstream

beartype bắt đầu là bản chép sạch của
[monkeytypegame/monkeytype](https://github.com/monkeytypegame/monkeytype)
(GPL-3.0), không mang lịch sử git. Không còn giữ để merge lại với upstream: mọi
tính năng beartype không dùng đã bị xoá hẳn, và repo đã gộp thành một package.

| | |
|---|---|
| SHA | `91bd24bb8513785c7364cbea29296ff7adafac41` |
| Ngày commit | 2026-08-15 |
| Nhập vào beartype | 2026-09-11, commit `1b88575` |

## Lấy lại một file từ upstream

Bản clone monkeytype nằm cạnh repo này ở `~/Documents/GitHub/monkeytype`. Upstream
để app trong `frontend/`, beartype để ở gốc:

```bash
git -C ../monkeytype show 91bd24bb:frontend/src/ts/test/test-ui.ts | diff - src/ts/test/test-ui.ts
```

## Chỗ lõi gõ của beartype cố ý khác monkeytype

Ngoài việc bỏ tính năng, đây là những chỗ beartype đổi hành vi trong lõi gõ. Mọi
chỗ nằm trong khối có chú thích `beartype:`. Khi cảm giác gõ lệch so với
monkeytype, tìm ở đây trước.

| File | Khác gì | Vì sao |
|------|---------|--------|
| `input/helpers/validation.ts` | `isCharCorrect`: phím chữ sai khi nó **tạo thêm một lỗi** trong từ (`isWrongKey`) | `e` dưới `ế` là chưa xong, không phải sai; phím cách giữ luật cũ |
| `test/events/stats.ts` | `countCharsForWordIndex` đếm theo phím (`countKeysAsChars`); phần trăm của `getAccuracy` lấy từ cờ đúng/sai của từng phím lúc gõ, nên lỗi đã sửa vẫn bị trừ | WPM theo phím đáng tốn, xem `beartype/scoring.ts`; phím đúng hay sai chấm bằng `isWrongKey`, nên chữ đang dựng dấu không bị tính sai |
| `test/test-ui.ts` | `updateWordLetters` vẽ từ đang gõ bằng `beartype/word-html.ts` | mỗi chữ đích một ô, chữ đang dựng dấu là `partial` |
| `test/test-ui.ts` | phím gõ sai dưới chữ (`indicateTypos: "below"`) lấy từ `typoHints` của `beartype/word-html.ts` | cùng phép so với cách vẽ từ, nên chữ đang dựng dấu không bao giờ bị treo phím sai |
| `components/pages/test/Keymap.tsx` | bàn phím ảo sáng theo **ký tự của `keydown`** (`event.key`), chữ có dấu sáng phím Telex cuối của nó (`ơ` sáng `w`, `ế` sáng `s`); `event.code` chỉ dùng khi không có ký tự; ký tự sai (từ `insert-text.ts`) tô đỏ phím của chính ký tự ấy | upstream sáng theo ký tự chèn vào ô nhập, mà `ế` không phải phím nào; còn `event.code` thì sai với bố cục không phải QWERTY (Colemak), và VTX gõ bằng phím giả mã 0 nên mọi phím thành `KeyA` |
| `ui.ts` | `applyTypingFont`: phông bài gõ theo ngôn ngữ (Be Vietnam Pro cho tiếng Việt, Roboto Mono cho tiếng Anh), không có bộ chọn phông; hai phông preload và `font-display: block` | con trỏ và chỗ xuống dòng đo theo phông của chữ, nên phông không được đổi giữa lúc vẽ |
| `test/caret.ts` | `updatePosition`: chỉ số chữ lấy từ `caretIndex` | con trỏ không nhảy tới rồi lùi khi bộ gõ viết lại chữ |
| `test/words-generator.ts` | `withToneStyle(từ, getToneStyle())` trước khi trả từ | vẽ `hoà`/`hòa` theo kiểu bộ gõ của máy |
| `test/test-logic.ts` | `learnToneStyle(getInputHistory(eventLog))` khi kết thúc bài | học kiểu bỏ dấu từ chính những gì đã gõ |
| `test/test-logic.ts` | cuối `finish`: ghi các từ đã chốt vào sổ từ hay sai (`beartype/miss-book.ts`), kể cả từ có phím sai đã xoá trước dấu cách; chỉ ghi khi bài hợp lệ | nút luyện từ hay sai |
| `test/test-logic.ts` | `finish`: thêm một chốt không hợp lệ `beartype/idle.ts`: ngừng gõ liền 5 giây ở bất kỳ đâu, hoặc ngừng gõ quá 20% thời lượng bài | upstream chỉ bắt 5 giây cuối không gõ; bài treo giữa chừng vẫn được lưu và kéo tốc độ xuống |
| `test/test-logic.ts` | `restart`: tuỳ chọn `leaveDrill`; bài mới trong lúc luyện từ hay sai là lượt luyện kế (`PractiseWords.continueDrill`) | chế độ luyện giữ tới khi người gõ tự tắt |
| `test/test-logic.ts` | kết quả hợp lệ lưu vào `beartype/local-results.ts` **sau** khi màn kết quả đã so với kỷ lục cũ | không có tài khoản; mọi thứ nằm trên máy |
| `test/test-logic.ts` | `init`: không tải được danh sách từ hay không tạo được bài thì dừng ngay, ghi lý do lên màn (`elements/test-init-failed.ts`) và đưa focus vào nút gõ lại; `utils/json-data.ts` không giữ lần tải hỏng | upstream gọi lại `init` ba lần liền, báo bằng thông báo nổi mà beartype không gắn, và giữ lần tải hỏng nên gõ lại không bao giờ tải được |
| `test/test-logic.ts` | hai chốt chống gian lận (cửa sổ lấy lại focus, tab hiện lại) khởi động lại với `withSameWordset: isRepeated()` | bài gõ lại giữ nguyên từ |
| `test/practise-words.ts` | chỉ còn `initFromWords`: bài luyện là một bài `custom` nội bộ, người dùng không chọn được chế độ này | luyện từ hay sai dùng lại đường chạy bài custom của upstream |

Đường vận chuyển phím (`input/handlers`, `input/listeners`, `input-element.ts`),
gom khung hình (`utils/debounced-animation-frame.ts`), cuộn dòng và
`elements/caret.ts` chỉ bị bỏ những nhánh của tính năng đã xoá (âm thanh, bỏ
ngang bằng Shift+Enter, chữ viết phải sang trái và chữ nối, các kiểu con trỏ
khác con trỏ dọc); không có dòng nào đổi cách chạy.
