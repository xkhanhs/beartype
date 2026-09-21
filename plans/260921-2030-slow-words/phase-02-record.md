# Phase 2: Ghi sổ sau mỗi bài

## File

- Sửa: `src/ts/test/test-logic.ts`, ngay sau `recordMisses(...)` trong
  `finish`.

## Việc

- Tận dụng `stumbledAt` và `eventLog` mà đoạn ghi sổ từ hay sai đã có sẵn.
  Tính `wordTimings`, rồi `recordSpeeds`.
- Cổng:
  - Đã có sẵn `if (dontSave) return;` phía trên, giữ nguyên.
  - Thêm: bỏ qua khi `Config.mode === "custom"`, vì bài luyện lặp dày làm
    phồng tốc độ.
  - Không cần cổng theo bộ từ: bộ ẩn `#khanh` đã bị xoá, chỉ còn hai bộ chuẩn.
- Comment ngắn theo lối của đoạn ngay trên: vì sao bỏ bài luyện.

Không sửa file nào trong `input/`. Việc này chỉ đọc log sau khi bài đã xong.

## Kiểm

- `pnpm vitest run __tests__/beartype` xanh.
- Bài gõ trong khung ẩn không cho ra kết quả hợp lệ, nên không kiểm bằng cách
  gõ thật trong trình duyệt. Thay vào đó có một test trong `slow-words.spec.ts`
  chạy qua đúng hàm mà `finish` gọi.
