---
phase: 6
title: "Khoác giao diện keybear"
status: pending
priority: P2
effort: "1d"
dependencies: [3]
---

# Phase 6: Khoác giao diện keybear

## Overview
Chủ đề của monkeytype là 10 màu (`theme-controller.ts`: `bg`, `main`, `caret`,
`sub`, `subAlt`, `text`, `error`, `errorExtra`, `colorfulError`,
`colorfulErrorExtra`) đổ vào biến CSS. **Giữ nguyên cách họ áp màu** — bộ điều
khiển, biến CSS, các màu suy ra — chỉ thay *nguồn*: danh sách chủ đề của họ
(`constants/themes.ts`, `static/themes/*.css`) đổi thành các chủ đề của keybear.
Rồi đổi font giao diện và vẽ lại phần khung (header, thanh chọn, nút) — **không
đụng** kích thước chữ gõ, khoảng cách dòng hay caret ngoài những gì phase 3 đã
chép từ cấu hình của anh.

## Requirements
- Giao diện: Quicksand. Chữ gõ: font anh đang dùng trên monkeytype.com (chép ở
  phase 3); nếu không đặt gì, Roboto Mono như mặc định keybear. Mọi font phải có
  subset `vietnamese` (U+1EA0–1EF9) — `latin-ext` không đủ.
- **Chủ đề = các chủ đề keybear**, chọn trong ô cài đặt của phase 3: theo máy,
  sáng, tối, princess, ocean, forest, racing, dracula, pixel, hero
  (`keybear/packages/keybr-themes/lib/themes/theme-*.less`).
- Ánh xạ token keybear → màu monkeytype, viết một chỗ, có test:

  | monkeytype | keybear |
  |------------|---------|
  | `bg` | `@primary` |
  | `subAlt` | `--primary-d1` (`darken(primary, 5)`) |
  | `text` | `@secondary` |
  | `sub` | `--secondary-f2` (`mix(primary, secondary, 40)`) |
  | `main`, `caret` | `@accent` |
  | `error` | `@error` |
  | `errorExtra` | `--error-d1` (`darken(error, 10)`) |
  | `colorfulError`, `colorfulErrorExtra` | như `error`, `errorExtra` |

  Các phép `darken`/`mix` của Less tính sẵn thành hex lúc build (script nhỏ đọc
  file `.less` của keybear, hoặc chép tay rồi ghi nguồn) — monkeytype nhận hex,
  không nhận biểu thức Less. "Theo máy" = sáng hoặc tối theo
  `prefers-color-scheme`, như `theme-0-system` của keybear.
- Header: chữ "beartype" + gấu (logo keybear đổi chữ), không điều hướng.
- Thanh chọn và nút "bài mới" / "luyện từ hay sai": viên thuốc như
  `dialog.module.less` của keybear.
- Chữ bấm được không gạch chân sẵn, chỉ gạch khi hover (luật của keybear).
- Chân trang: một dòng mờ "fork của monkeytype · GPL-3.0" có link repo, và gợi ý
  phím `tab` → bài mới.
- Chữ tiếng Việt trên giao diện, gọi người dùng trung tính (không "con").

## Architecture
Monkeytype dùng Tailwind (chỉ màu định nghĩa trong config) + SCSS legacy. Sửa ở
`styles/index.scss`/`core.scss` và `tailwind.css`, thêm `styles/beartype.scss`
chứa biến. Không tạo hệ style thứ ba.

## Success Criteria
- [ ] Đặt cạnh keybear: cùng họ màu, cùng font giao diện, cùng dáng nút.
- [ ] `getComputedStyle` của chữ gõ (font-size, letter-spacing, line-height) giữ
      đúng giá trị đã chốt ở phase 3.
- [ ] Cổng "vẫn gõ y hệt".

## Risk Assessment
- Đổi font chữ gõ **là** đổi cảm giác gõ (bề ngang chữ, nhịp caret). Nếu chữ gõ
  keybear khác chữ monkeytype anh dùng, giữ của monkeytype.
- Phông có ligature (vd. một số mono) gộp hai ô chữ làm một — keybear đã dính
  (`font-variant-ligatures: none` trên vùng chữ gõ).
