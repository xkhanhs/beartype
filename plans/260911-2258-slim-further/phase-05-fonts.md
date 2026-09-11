# Phase 5: Chốt phông theo ngôn ngữ

Roboto Mono cho bài tiếng Anh, Be Vietnam Pro cho bài tiếng Việt, phông hệ
thống dự phòng. Giao diện giữ Quicksand. `fontFamily` ra khỏi `Config`.

## Việc

| File | Chỗ | Việc |
|---|---|---|
| `schemas/fonts.ts`, `constants/fonts.ts`, `styles/fonts.scss` | cả file | xoá |
| `styles/index.scss` | `"fonts"` trong `@import` (:19) | xoá |
| `vite.config.ts` | import :13, :22; `getFontsConfig` 26-36; `$fonts: (…)` ~:222 | xoá |
| `schemas/configs.ts` | import :5, `fontFamily` :76 | xoá |
| `schemas/languages.ts` | import :2, `preferredFont` :31 | xoá (không file ngôn ngữ nào đặt) |
| `beartype/config-lock.ts` | USER_KEYS, default, `FONTS`, nhánh trong `allowed` | xoá |
| `constants/default-config.ts` | :16 | xoá |
| `config/metadata.tsx` | 130-133 | xoá |
| `SettingsPopover.tsx` | `FONTS`, `FONT_LABELS`, hàng phông 136-144 | xoá |
| `SettingsRow.tsx` | prop `fontOf` | xoá |
| `utils/strings.ts` | `export` của `replaceUnderscoresWithSpaces` | bỏ `export` (knip) |
| `ui.ts` | `applyFontFamily` 17-32, import, subscriber 90-94 | thay bằng hàm đồng bộ dưới đây |
| `test/test-ui.ts` | 980-988 | chỉ giữ nhánh `fontSize` (mảng chuỗi, ts-check không bắt được sót) |
| `styles/core.scss` | `--font` mặc định (:3) | đặt theo bài tiếng Việt, ngôn ngữ mặc định |
| `styles/beartype.scss` | 118-148, comment 199 | chỉ còn Roboto Mono (latin từ `webfonts/`, khai báo **trước** subset vietnamese) và Be Vietnam Pro; bỏ IBM Plex, Lexend, Open Sans |
| `src/html/head.html` | preload | thêm hai file Be Vietnam Pro (hiện chỉ preload RobotoMono và Quicksand latin) |

```ts
function applyTypingFont(): void {
  const font =
    Config.language === "vietnamese"
      ? '"Be Vietnam Pro", system-ui, sans-serif'
      : '"Roboto Mono", ui-monospace, monospace';
  document.documentElement.style.setProperty("--font", font);
}
```

Gọi lúc khởi động và khi `key === "language"`. Đổi ngôn ngữ vốn đã khởi động
lại bài (`test-logic.ts` 785-791) và vẽ lại từ, không cần móc thêm. Bản cũ chờ
`getLanguage` nên phông tới sau khi bài bắt đầu; bản đồng bộ đặt phông trước.

**Phông nhảy lúc vào bài.** Be Vietnam Pro không đơn cách, đang
`font-display: swap` và chưa preload; bài tiếng Việt là mặc định nên lần đầu
vẽ bằng phông dự phòng rồi đổi, làm lệch số đo dòng và con trỏ. Preload cả hai
file và đặt `font-display: block` cho hai phông bài gõ (như Roboto Mono đang
làm).

**Asset xoá:** `fonts-ui/ibm-plex-mono-400.vietnamese`, `lexend-400.*`,
`open-sans-400.*`, `webfonts/IBMPlexMono-Regular.woff2` (~88 KB).
**Giữ:** Quicksand 400/700 (latin + vietnamese), Be Vietnam Pro (latin +
vietnamese), Roboto Mono (latin ở `webfonts/` + vietnamese).

**Test:** `config-lock.spec.ts` (10-15, 24, 31, 59, 66); thêm `fontFamily`
vào danh sách khoá bị bỏ ở `production-local-storage.spec.ts`, giữ :36 làm dữ
liệu cũ.

## Kiểm tra
Pre-push. `pnpm dev`, tắt cache: tải lại ở bài tiếng Việt, con trỏ đứng đúng
chữ đầu ngay từ phím đầu; đổi sang tiếng Anh thấy Roboto Mono; đổi cỡ chữ vẫn
chạy. Kiểm computed `font-family` của `#words` bằng DevTools.

## Rủi ro
Trung bình: phông quyết định số đo dòng và vị trí con trỏ.
