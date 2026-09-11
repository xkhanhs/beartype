---
phase: 3
title: "Màn kết quả gọn"
status: pending
priority: P1
effort: "3h"
dependencies: [1]
---

# Phase 3: Màn kết quả gọn

## Overview
Dựng lại màn kết quả theo `TypeTestResult.tsx` + `TypeTestStats.tsx` của keybear.

## Requirements
- Bố cục dọc, căn giữa, `gap 2rem`:
  1. Hai số lớn (48px, đậm, màu nhấn, nhãn nhỏ nhạt **dưới** số): wpm, chính xác
     (một chữ số lẻ, làm tròn xuống như upstream, dấu phẩy kiểu Việt).
  2. Hai số nhỏ (28px): số từ đã gõ (`getInputHistory` của bài vừa rồi), thời gian
     (tối đa một chữ số lẻ).
  3. Dòng ghi chú nhỏ khi bài không được lưu (afk, invalid, too short) — nhóm
     `.info` sẵn có, Việt hoá.
  4. Nút: "bài mới" (đậm, nền nhấn, là nút Enter), "gõ lại", luyện từ hay sai.
  5. Sổ: tốt nhất · thường · chính xác · số bài; từ 5 bài trở lên thì thêm biểu đồ
     cột 10 bài gần nhất (trục từ bài chậm nhất tới nhanh nhất, vạch đứt "thường",
     cột cuối đậm và in số, bong bóng từng cột).
- Gỡ khỏi HTML: raw, ký tự, đều tay, loại bài, nguồn, chú giải biểu đồ, nút lịch sử
  gõ / replay / practise words. Ẩn hẳn (khối `hidden`) những gì code lõi đòi phải
  có: `#wpmChart`, `#resultWordsHistory`, `#resultReplay`.
- `local-results.recentSummary`: trả thêm `usualAcc`, `recent` (10 bài cuối),
  nhận `null` cho bài sẽ không được lưu. Test cập nhật theo.
- `ResultHistory.tsx`: đọc một signal do `result.ts` đặt trong `updateRecent`.

## Related Code Files
- Create: `frontend/src/ts/components/beartype/ResultHistory.tsx`
- Modify: `frontend/src/html/pages/test-result.html`, `frontend/src/ts/test/result.ts`
  (`updateWpmAndAcc`, `updateTime`, `updateRecent`, `updateOther`),
  `frontend/src/ts/beartype/local-results.ts`, `frontend/__tests__/beartype/local-results.spec.ts`,
  `frontend/src/ts/components/mount.tsx`, `frontend/src/styles/beartype.scss`

## Success Criteria
- [ ] Không lỗi console khi hiện kết quả (các phần tử bị gỡ đều truy cập qua `qs()?.`).
- [ ] Vương miện kỷ lục vẫn hiện cạnh chữ wpm khi phá kỷ lục.

## Risk Assessment
- Code biểu đồ cũ vẫn chạy trên canvas ẩn — tốn chút công vô ích, đổi lại không
  phải sửa sâu vào `result.ts`. Chấp nhận.
