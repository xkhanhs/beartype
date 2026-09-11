---
title: "Giao diện trang chính, cài đặt và kết quả theo keybear"
status: completed
branch: feat/keybear-look
created: 2026-09-11
blockedBy: []
blocks: []
---

# Giao diện theo keybear

Lượt trước ([phase 6 của plan fork](../260911-1141-fork-monkeytype/phase-06-keybear-skin.md))
đã mang bảng màu, font Quicksand và con gấu của keybear sang. Lượt này làm nốt
phần *hình dáng*: thanh chọn kiểu bài, thẻ cài đặt, màn kết quả, và cách chọn
màu.

## Kết quả mong muốn

- Trang chính, cài đặt và kết quả nhìn ra cùng một ứng dụng với keybear
  (`~/Documents/GitHub/keybear/packages/page-practice/lib/typetest/`).
- Chọn màu mà **nhìn thấy trước**: chấm chia đôi nền/nhấn cạnh mỗi tên, rê chuột
  lên một tên là cả trang đổi thử sang màu ấy.

## Đã chốt với người dùng

| Câu hỏi | Chốt |
|---|---|
| Màn kết quả giữ gì | Gọn như keybear: wpm, chính xác, số từ, thời gian, sổ "tốt nhất · thường · chính xác · số bài" + biểu đồ cột mấy bài gần đây. Gỡ/ẩn biểu đồ theo giây, raw, ký tự, đều tay, lịch sử gõ, replay. |
| Ô chọn màu ở đâu | Chân trang, cạnh nút cài đặt, như keybear. Bỏ hàng "màu" trong cài đặt. |

Thêm giữa chừng, theo lời người dùng: bỏ hẳn con trỏ nhịp (kể cả
`repeatedPace` khi gõ lại bài), thêm cài đặt phông chữ bài gõ như keybear (sáu
phông, mỗi phông có bộ `vietnamese`), logo và favicon vẽ lại thành phím "bt"
theo kiểu monkeytype bằng màu nhấn của giao diện, bỏ dòng chữ nhỏ dưới tên.

## Ràng buộc

- Không sửa file trong danh sách cấm của [docs/upstream.md](../../docs/upstream.md)
  (`test-ui.ts`, `test.scss`, `input/**`...). Style mới nằm trong `beartype.scss`,
  đè lên `test.scss` bằng selector cùng hoặc cao hơn (nạp sau).
- `test-ui.ts` và `replay-ui.ts` gọi `qsr("#resultWordsHistory")`,
  `qsr("#resultReplay")` lúc nạp module, `chart-controller.ts` dựng Chart trên
  `#wpmChart`: ba phần tử này **phải còn trong DOM**, chỉ được ẩn.
- Chữ trong bài gõ giữ `--font` (bề ngang từng chữ là một phần cảm giác gõ).
- Màu chỉ lấy từ biến theme; token keybear suy ra trong CSS để xem-thử-màu
  (không nạp file) cũng đúng.

## Ngoài phạm vi

- Font chữ bài gõ (keybear dùng Be Vietnam Pro), bàn phím ảo, trang nào khác.
- Thay đổi cách chấm điểm.

## Phase

| # | Phase | Phụ thuộc |
|---|-------|-----------|
| 1 | [Màu và ô chọn màu](phase-01-theme-tokens-and-picker.md) | — |
| 2 | [Trang chính và cài đặt](phase-02-main-and-settings.md) | 1 |
| 3 | [Màn kết quả gọn](phase-03-compact-result.md) | 1 |
| 4 | [Kiểm tra](phase-04-verify.md) | 2, 3 |

## Tiêu chí nghiệm thu

- [x] Chín màu + "tự động" đều đọc được: chữ, nút chọn, thẻ, biểu đồ cột
      (xem bằng mắt: ban ngày, biển xanh, đua xe).
- [x] Rê chuột trên danh sách màu đổi thử cả trang; rời danh sách trả về màu cũ.
- [x] Màn kết quả chỉ còn các phần đã chốt.
- [x] 1049 test, oxlint type-check, `vite build` xanh.
