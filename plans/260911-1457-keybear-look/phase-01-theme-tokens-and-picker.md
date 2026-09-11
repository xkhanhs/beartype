---
phase: 1
title: "Màu và ô chọn màu"
status: pending
priority: P1
effort: "2h"
dependencies: []
---

# Phase 1: Màu và ô chọn màu

## Overview
Thêm các màu phụ keybear dùng cho thẻ/viền/nền nhạt, và thay hàng chữ "màu"
trong cài đặt bằng `ThemeMenu` của keybear ở chân trang, có xem thử khi rê chuột.

## Requirements
- Token (trên `:root`, trong `beartype.scss`), suy từ 10 màu upstream theo công
  thức Less của keybear (`keybr-themes/lib/themes/palettes.less`):
  - `--kb-card` = lighten(primary, 5%) → `hsl(from var(--bg-color) h s calc(l + 5))`
  - `--kb-border` = primary-d1 = `--sub-alt-color`
  - `--kb-text-f1` = mix(primary, secondary, 20%)
  - `--kb-accent-xlt` ≈ nhấn pha 16% vào nền (keybear chọn tay từng màu)
  - `--kb-on-accent` = nền; `#fff` cho `racing`, `pixel` (keybear làm vậy) — ghi
    vào `static/themes/keybear_racing.css`, `keybear_pixel.css` sẵn có
  - `--kb-shadow`: chữ 22% trên nền sáng, `#00000088` trên `body.darkMode`
- `ThemeMenu.tsx` (Solid, cổng từ `keybear/packages/page-practice/lib/home/ThemeMenu.tsx`):
  viên = chấm + tên + mũi tên; danh sách xổ **lên**; mỗi dòng chấm + tên + dấu ✓.
  Chấm lấy màu từ `themes[name].bg` / `.main` (không chép hex). "tự động" = nửa
  nền sáng, nửa nền tối.
- Rê chuột lên dòng → `ThemeController.preview(name)`; rời danh sách / đóng →
  `clearPreview()`; bấm → lưu như `SettingsPopover` đang làm. Esc và bấm ra ngoài
  đóng danh sách.
- `theme-controller.ts` `clearPreview`: đang ở "tự động" thì trả về
  `themeLight`/`themeDark` theo máy, không phải `Config.theme`.

## Related Code Files
- Create: `frontend/src/ts/components/beartype/ThemeMenu.tsx`
- Modify: `frontend/src/styles/beartype.scss`, `frontend/src/ts/controllers/theme-controller.ts`,
  `frontend/src/ts/components/layout/footer/Footer.tsx`,
  `frontend/src/ts/components/beartype/SettingsPopover.tsx` (bỏ hàng màu, dời nhãn tên màu sang ThemeMenu),
  `frontend/static/themes/keybear_racing.css`, `keybear_pixel.css`

## Success Criteria
- [ ] Danh sách hiện đủ 10 lựa chọn với chấm màu đúng; đang chọn có ✓ và nền nhạt.
- [ ] Rê chuột đổi thử, rời ra trả lại, cả khi "tự động" + máy tối.

## Risk Assessment
- Relative color syntax (`hsl(from …)`) cần Chrome 122+/Safari 18/Firefox 128;
  trình duyệt cũ mất nền thẻ (trong suốt) chứ không vỡ bố cục. Chấp nhận.
