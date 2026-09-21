# Phase 1: Đo tốc độ từng từ và sổ từ chậm

## File

- Mới: `src/ts/beartype/slow-words.ts`
- Mới: `__tests__/beartype/slow-words.spec.ts`
- Sửa: `__tests__/beartype/production-local-storage.spec.ts`

## Việc

1. **`wordTimings(targets, events, stumbledAt)`**, hàm thuần.
   - Mốc chốt của từ `i` là `ms` của event `input` dấu cách chốt từ `i` (cờ
     commit trong `InputEventData`). Riêng từ cuối của bài theo số từ thì mốc
     chốt là phím cuối khi từ đã đủ, như `committedWords` trong `miss-book.ts`.
   - Thời gian của từ `i` = mốc chốt từ `i` − mốc chốt từ `i−1`, đúng như keybear
     (`worddrill/word-timings.ts`): tính luôn quãng đổi từ, vì chỗ khựng thật
     hay nằm ở đó.
   - Trả `null` (không đo) cho: từ đầu bài; quãng ≤ 0 (bộ gõ gửi cả cụm, hay
     lùi về sửa từ cũ); từ không sạch (sai khi chốt, hoặc nằm trong
     `stumbledAt`); từ có input `automatic`.
   - Tốc độ = `wordCost(target) / 5 / phút`, dùng `wordCost` trong
     `beartype/scoring.ts`.
2. **Sổ** trong `localStorage` qua `LocalStorageWithSchema`, khoá
   `beartype:v1:slowbook`, mỗi pool ngôn ngữ (`statsLanguage`) một trang:
   - `words: Record<từ, number[]>`: 5 tốc độ gần nhất của từng từ.
   - `recent: [cost, speed][]`: 500 mẫu gõ sạch gần nhất, làm mốc.
   - Schema zod không `.strict()`. Dữ liệu hỏng hoặc thiếu thì về `{}`.
3. **Mốc theo số phím.** `barFor(cost, recent)` = trung vị tốc độ của các mẫu
   cùng `cost`. Nhóm dưới 20 mẫu thì nới dần sang `cost ± 1`, `± 2`… cho đến khi
   đủ. Tổng `recent` dưới 100 mẫu thì trả `null` (chưa có mốc).
4. **`slowWords(language)`**: những từ có ít nhất 3 mẫu và trung vị các mẫu
   < `0.85 × barFor(wordCost(từ))`. Xếp theo tỉ lệ so với mốc, chậm nhất trước.
5. **`measuredCount(language)`**: số từ có ít nhất 3 mẫu. Dòng ở màn kết quả
   dùng số này.
6. **`recordSpeeds(language, rows)`**: thêm mẫu vào `words` và `recent`, cắt về
   5 và 500. Signal Solid như `miss-book.ts`, để nút và dòng kết quả tự vẽ lại.

Hằng số (`0.85`, `3`, `5`, `500`, `100`, `20`) đặt tên và viết comment lý do
ngay chỗ khai báo, theo lối của `miss-book.ts`.

## Test

- Đo thời gian: từ đầu bị bỏ; từ sai và từ vấp bị bỏ; quãng 0 hoặc âm thành
  `null`; tốc độ đúng với một từ có dấu (ví dụ `bán` = 4 phím + dấu cách).
- Mốc: tách theo số phím; nhóm thưa gộp nhóm liền kề; dưới 100 mẫu thì
  `null`.
- Từ chậm: dưới 3 mẫu không tính; một lần khựng giữa hai lần nhanh không làm
  từ thành chậm; gõ nhanh lên thì từ tự ra khỏi sổ.
- Không lệch theo độ dài: một bộ mẫu có quãng đổi từ cố định không đẩy từ
  ngắn vào sổ.
- `production-local-storage.spec.ts`: không có khoá, khoá rỗng, hay khoá hỏng
  đều nạp được.

## Rủi ro

Đọc sai mốc chốt từ trong event log (dấu cách do bộ gõ gửi, sửa từ cũ). Test
dùng event log dựng tay theo đúng hình `InputEvent`. Trước khi viết thì đọc
`src/ts/test/events/helpers.ts` (`getInputHistory`, nhóm event theo
`wordIndex`) để không tự viết lại cái đã có.
