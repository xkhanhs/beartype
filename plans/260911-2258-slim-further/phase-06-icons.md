# Phase 6: Icon SVG, vương miện một trạng thái

Thay FontAwesome bằng SVG chép từ Lucide (không cài package). Hai commit:
vương miện trước (xoá bớt icon), rồi đổi icon.

## Commit 6a: vương miện chỉ còn "kỷ lục mới"

`resultCanGetPb` chỉ trả `false` khi `result.bailedOut`, mà bỏ ngang không bao
giờ xảy ra (phase 4, làm trước). Người dùng chốt: bài không hợp lệ thì không có xếp hạng.

- `test/result.ts` `updateCrown`: bỏ nhánh `else` (vương miện cảnh báo và gạch
  chéo); không kỷ lục mới thì `hideCrown()`. `resultCanGetPb` và
  `CanGetPbObject` còn một nghĩa — xoá, `updateCrown` so thẳng với kỷ lục.
- `test/pb-crown.ts`: bỏ `CrownType` và `update()`; chỉ còn `show`/`hide`.
- `test-result.html` 13-16: chỉ giữ icon crown.
- `test.scss` 480-560: bỏ rule `.ineligible`, `.pending`, `.error`,
  `.warning`, `.fa-slash`, `.fa-question`, `.fa-exclamation-triangle`.

## Commit 6b: sprite SVG thay FontAwesome

**Cơ chế:** một sprite duy nhất vì `solid/no-innerhtml` cấm `innerHTML` trong
`.tsx`, các file `.html` không import được TS, và vòng quay tải trang phải hiện
trước khi JS chạy.

- `src/html/icons.html`: `<svg width="0" height="0" style="position:absolute">`
  chứa `<symbol id="i-NAME" viewBox="0 0 24 24">` với phần tử con của Lucide.
  Đầu file ghi giấy phép (ISC của Lucide; MIT của Feather cho `arrow-right`,
  `check`, `chevron-down`, `corner-down-left`, `info`, `lock`, `x`; CC0 cho
  GitHub của simple-icons). Nạp đầu `<body>` bằng `<load src="html/icons.html" />`.
- Chỗ dùng: `<svg class="bt-icon" aria-hidden="true"><use href="#i-NAME"></use></svg>`
  (có thẻ đóng vì oxlint). Trong `.tsx` dùng `components/beartype/Icon.tsx`
  với prop `name: IconName`.
- CSS trong `beartype.scss`:
  ```scss
  .bt-icon { display: inline-block; flex: none; inline-size: 1em; block-size: 1em;
    vertical-align: -0.125em; fill: none; stroke: currentColor; stroke-width: 2;
    stroke-linecap: round; stroke-linejoin: round; pointer-events: none; }
  .bt-icon-fill { fill: currentColor; stroke: none; } // github, pause
  .bt-spin { animation: bt-spin 2s linear infinite; }
  @keyframes bt-spin { to { transform: rotate(1turn); } }
  ```
  Thắng `svg { display: block }` của Tailwind nhờ layer `custom-styles` đứng
  sau `base`. `media-queries.scss:13`: `.fa-spin` → `.bt-spin`.

| Chỗ | FA | Lucide | CSS phải sửa |
|---|---|---|---|
| `test-ui.ts:351` (tabChar) | long-arrow-alt-right fa-fw | `arrow-right` | `test.scss` 135-141 `letter.tabChar i` → `svg` |
| `test-ui.ts:354` (nlChar) | level-down-alt fa-rotate-90 | `corner-down-left` | như trên. Nhánh không chạy (từ không có tab/xuống dòng) nhưng nằm trong đường vẽ chữ: chỉ đổi chuỗi |
| `result.ts:350` | info-circle | `info` | kế thừa |
| `test.html:12` | redo-alt fa-fw | `rotate-cw` | `buttons.scss` 9-14 (`pointer-events`) |
| `test.html:66` | circle-notch fa-spin | `loader-circle` + `bt-spin` | `test.scss` 293-297 `> i` → `> svg` |
| `loading.html:3` | circle-notch fa-spin | `loader-circle` + `bt-spin` | `loading.scss` 9-16 |
| `loading.html:6` | times | `x` | `loading.scss` `.error` |
| `test-result.html:14` | crown | `crown` | `test.scss` 472-497 `i {grid-area}` → `svg`; cỡ 0,7rem có thể phải tăng cho nét 2px đọc được |
| `SettingsPopover.tsx:122` | cog fa-fw | `settings` | `beartype.scss` 484-487 |
| `ThemeMenu.tsx:114` | chevron-down | `chevron-down` | `beartype.scss` 472-474, 505-509, 954 |
| `ThemeMenu.tsx:142` | check | `check` | `beartype.scss:560` |
| `Footer.tsx:32` | github (brand) | simple-icons `github` + `bt-icon-fill` | `beartype.scss` 484-496 |
| `CapsWarning.tsx:11` | lock | `lock` | Tailwind |
| `OutOfFocusWarning.tsx:31` | pause | `pause` + `bt-icon-fill` | `beartype.scss` 236-247 |

**Xoá:**
- Prop `fa`/`icon` của `Button.tsx` và `Notice.tsx` (không ai truyền) cùng test
  fa trong `Button.spec.tsx` 55-128.
- Selector `.fas` chết: `core.scss` 301-307, `test.scss` 82-84 và 557;
  `buttons.scss` 9-11 đổi sang class icon mới.
- `Fa.tsx`, `types/font-awesome.d.ts`, `styles/fontawesome-5.scss`,
  `fontawesome-6.scss`, `vendor.scss:3`, `vite-plugins/fontawesome-subset.ts`.
- `vite.config.ts`: import :14, `sassList` comment 74-79, plugin :108, khối
  205-219 (`bypassFonts`/`$fontAwesomeOverride`), `optimizeDeps` 262-264.
- `knip.ts:4` comment và nhánh `@scope/` của `STYLE_PACKAGES` nếu hết khớp.
- `pnpm-workspace.yaml` `allowBuilds` của FA; `.gitignore`
  `src/webfonts-generated`.
- `pnpm remove @fortawesome/fontawesome-free fontawesome-subset`.
- README mục "Giấy phép": một dòng trỏ tới `src/html/icons.html`.

## Kiểm tra
`grep -rE "fa-|\bfas\b|<Fa" src` rỗng. Pre-push. `pnpm dev`, xem ở khung rộng
và 375px: nút cài đặt, chọn theme (chevron xoay, dấu check), GitHub ở chân
trang, cảnh báo Caps Lock, màn mất focus, vương miện khi phá kỷ lục, vòng quay
lúc tải (chặn JS để thấy). Chụp màn làm bằng chứng.

## Rủi ro
Trung bình: selector `> i` im lặng thôi khớp nếu sót. Không động vào đường gõ
ngoài hai chuỗi tab/xuống dòng.
