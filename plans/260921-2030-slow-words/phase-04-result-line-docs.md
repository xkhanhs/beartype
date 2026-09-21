# Phase 4: Dòng từ chậm ở màn kết quả, docs

## File

- Mới: `src/ts/components/beartype/SlowWordsLine.tsx`, hoặc thêm vào
  `ResultHistory.tsx` nếu nó đứng ngay đó
- Sửa: `src/ts/components/mount.tsx`, `src/html/pages/test-result.html`,
  `src/ts/beartype/strings.ts`, `src/styles/beartype.scss`
- Sửa: `CLAUDE.md` (mục "Code nằm ở đâu" và phần bài tập)

## Việc

1. **Dòng ở màn kết quả**, theo ngôn ngữ đang gõ:
   - Có mốc: `đã đo {đo}/{tổng} từ · {n} từ chậm: a, b, c, d, e`. Tối đa 5 từ
     chậm nhất. `tổng` là số từ của bộ đang gõ (663 hoặc 200).
   - Chưa có mốc: `đã đo {đo}/{tổng} từ`, chưa có phần từ chậm.
   - Chữ mờ, cỡ nhỏ như sổ bài gần đây. Không thêm thông báo nổi.
2. **Tổng số từ** lấy từ danh sách từ đã nạp của bài gõ. Không tự nạp lại file
   json.
3. **Docs.**
   - `CLAUDE.md`: thêm `slow-words.ts` vào danh sách `src/ts/beartype/`, nút
     thứ tư vào danh sách `bt-action`, và một đoạn ngắn về cách đo: mốc theo số
     phím, 0.85, không đo bài luyện, không có FSRS và lý do.
   - Xem lại `docs/upstream.md`: nếu có liệt kê các chỗ beartype chạm vào
     `test-logic.ts`, thêm chỗ ghi sổ mới.

## Kiểm cuối

- `pnpm test`, `pnpm oxlint --type-aware --type-check --format agent`, build.
  knip chạy trong pre-push.
- Trình duyệt, với `localStorage` đã seed, cả tiếng Việt và tiếng Anh, cả giao
  diện `vi` và `en`, cả khung hẹp: dòng ở màn kết quả và hai nút luyện.
- Mở PR, không push thẳng lên `main`, vì push lên `main` là deploy.
