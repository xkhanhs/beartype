---
phase: 2
title: "Trang chính và cài đặt"
status: pending
priority: P1
effort: "2h"
dependencies: [1]
---

# Phase 2: Trang chính và cài đặt

## Overview
Thanh chọn kiểu bài thành một viên như `.options` của keybear; nút làm lại / luyện
từ hay sai thành `.action`; popover cài đặt thành thẻ keybear.

## Requirements
- `TestConfig.tsx`: một khung bo tròn (viền 2px `--kb-border`, nền `--kb-card`,
  `padding .4rem .8rem`, `gap .4rem`), ba nhóm ngăn bằng vạch 1px. Pill: không
  icon, `padding .3rem .8rem`, chữ `--kb-text-f1`; đang chọn nền `--main-color`,
  chữ `--kb-on-accent`. Giữ hành vi mờ đi khi đang gõ / khi hiện kết quả.
- `.testButtons`: `#restartTestButton` và nút luyện từ theo `.action` của keybear
  (pill trong suốt, chữ nhạt, rê chuột nền thẻ). Nút làm lại có chữ "làm lại".
- `SettingsPopover`: thẻ (viền 2px, bo 1.1rem, `padding 1.3rem`, bóng
  `0 .5rem 3rem --kb-shadow`), tiêu đề "cài đặt" đậm; mỗi hàng: tên đậm + gợi ý nhạt
  bên trái, lựa chọn bên phải, vạch trên mỗi hàng.
- `SettingsRow`: thêm `hint`; lựa chọn là nút có viền 2px, bo tròn, đậm; đang
  chọn viền `--main-color`, nền `--sub-alt-color`; focus viền 3px nhấn.

## Related Code Files
- Modify: `frontend/src/ts/components/pages/test/TestConfig.tsx`,
  `frontend/src/ts/components/beartype/SettingsPopover.tsx`, `SettingsRow.tsx`,
  `MissDrillButton.tsx`, `frontend/src/html/pages/test.html` (chữ nút làm lại),
  `frontend/src/styles/beartype.scss`

## Success Criteria
- [ ] Tab + Enter vẫn làm lại bài (restart vẫn là nút đầu tiên Tab tới).
- [ ] Cài đặt đổi con trỏ mượt / con trỏ nhịp như trước.

## Risk Assessment
- `--roundness` còn quyết định hình con trỏ: không đổi biến ấy, chỉ bo góc bằng
  selector riêng.
