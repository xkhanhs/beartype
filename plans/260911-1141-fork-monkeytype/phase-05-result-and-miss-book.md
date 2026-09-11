---
phase: 5
title: "Màn kết quả + sổ từ hay sai"
status: completed
priority: P2
effort: "1d"
dependencies: [4]
---

# Phase 5: Màn kết quả + sổ từ hay sai

## Overview
Giữ màn kết quả của monkeytype (`html/pages/test-result.html`, `test/result.ts`)
nhưng bỏ những thứ cần tài khoản, và thay "practise words" một-lần của họ bằng
sổ từ hay sai **lưu lâu dài** theo cách của keybear.

## Requirements

**Màn kết quả giữ:** WPM, độ chính xác (số theo phase 4), biểu đồ WPM/raw/lỗi
theo giây (chart.js), thời gian, consistency, số phím đúng/thiếu/thừa, lỗi đã
sửa, lịch sử từ (bấm vào từ xem burst và chữ gõ ra).
**Bỏ:** crown PB online, tag, rate/report quote, share, screenshot, replay, nút
đăng nhập để lưu, "last signed out result", thông báo XP.
**Thêm:** "tốt nhất" và "thường" của 20 bài gần nhất trên máy (theo chế độ +
ngôn ngữ), để con số có cái mà so.

**Sổ từ hay sai** (chép luật từ keybear `typetest/miss-book.ts`): mỗi ngôn ngữ
một sổ; gõ sai một từ thì từ đó nợ một, gõ đúng trả một, về 0 thì ra khỏi sổ.
Sai dấu là sai từ (`tôi` cho `tối`). "Sai" ở đây là `commitScore.correct <
total` của phase 4 — cùng một định nghĩa với độ chính xác.

**Nút luyện** đứng cạnh "bài mới" trên màn test, có ngay từ lúc mở trang (không
chỉ sau bài), mờ đi khi sổ trống, hiện số từ. Bấm → một bài *words* dựng từ sổ
(lặp lại để đủ độ dài). Dùng cơ chế `practise-words.ts` của monkeytype để dựng
bài, chỉ thay nguồn từ. Bài luyện **không vào** 20 bài gần nhất.

## Architecture
- `beartype/storage.ts`: một khoá `localStorage` có phiên bản
  (`beartype:v1:results`, `beartype:v1:missbook:<lang>`), đọc bằng zod (monkeytype
  đã có `utils/local-storage-with-schema.ts` — dùng lại). Hỏng dữ liệu → bỏ qua,
  không đổ trang.
- `beartype/miss-book.ts` + test: chép từ keybear, bỏ phần theo từng trẻ.
- Móc vào `TestLogic.finish` (một lời gọi sau khi kết quả đã tính) để ghi kết quả
  và cập nhật sổ. Đây là file ngoài lõi (`result.ts` được sửa nhiều ở mục bỏ).
- **Không cần backup/khôi phục**. Dữ liệu mất khi xoá dữ liệu trang — chấp nhận,
  đã chốt "đơn giản nhất".

## Success Criteria
- [ ] Gõ sai 3 từ, đóng trình duyệt, mở lại: nút luyện hiện 3.
- [ ] Bài luyện gồm đúng các từ ấy; gõ đúng hết thì sổ giảm.
- [ ] Màn kết quả không có nút nào dẫn ra chỗ cần tài khoản.

## Risk Assessment
- `result.ts` 1.400 dòng, dính `DB`/snapshot ở nhiều chỗ — phase 2 có thể đã phải
  cắt dây một phần; phase này hoàn tất. Không đụng phần vẽ biểu đồ ngoài dữ liệu
  đầu vào.
