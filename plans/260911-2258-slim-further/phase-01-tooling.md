# Phase 1: Tooling và cấu hình build

Không đụng code chạy trong trình duyệt (trừ `json-data.ts`). Làm trước để các
phase sau build nhanh và sạch.

## Việc

**1a. Cấu hình cho package không còn** (một commit)
- `vite.config.ts`: nhóm `vendor-tanstack` (~164-166), nhóm
  `monkeytype-packages`, ignore watch `packages/contracts`, luật asset
  `misc.css`, các khối FontAwesome v6 đã comment (khối FA còn chạy để phase 6).
- `vitest.config.ts`: `tanstackSolidNoExternal` (12-15) và ba chỗ dùng; giữ
  `"@solidjs/meta"` trong `noExternal`.
- `vite-plugins/env-config.ts`: chỉ còn `isDevelopment` và `clientVersion`; bỏ
  `backendUrl`, `recaptchaSiteKey`, `quickLogin*`, `BACKEND_URL` →
  `server.host`. Xoá `__tests__/__harness__/mock-env-config.ts` nếu nó mock một
  module không tồn tại (kiểm lại trước khi xoá).
- `.gitignore`: ~40 dòng firebase và `backend/`; `src/webfonts-generated` để
  phase 6.
- `oxlint-config/overrides.jsonc` 70-74: khối `private/script.js`.
- `oxlint-config/rules/jsx.jsonc`: chỉ bỏ `style-prop-object`,
  `checked-requires-onchange-or-readonly`, `jsx-no-duplicate-props`,
  `jsx-no-undef` (đã có bản `solid/*`), `react-in-jsx-scope: off`. **Giữ các
  luật `react/*` còn lại**: chúng chạy trên JSX của Solid (đã thử).

**1b. Kiểm tra toàn vẹn danh sách từ** (một commit)
- Xoá `vite-plugins/language-hashes.ts`, chỗ đăng ký trong `vite.config.ts`, và
  phần kiểm hash ở `src/ts/utils/json-data.ts` (~93). Nó chống sửa danh sách từ
  để gian bảng xếp hạng, beartype không có bảng xếp hạng; còn làm hỏng tab chạy
  bản cũ khi danh sách từ đổi ("Integrity check failed … contact support").

**1c. `version.json`** (gộp vào 1a)
- Xoá `vite-plugins/version-file.ts`, chỗ đăng ký, và `static/version.json`.
  Không ai fetch nó. Giữ `getClientVersion` (`no-css.ts` dùng).

**1d. Bỏ jsdom** (một commit)
- `vitest.config.ts`: hai project jsdom chuyển sang happy-dom (reviewer đã chạy
  thử: 5 file, 57 test xanh). Đổi tên `dom.jsdom-spec.ts` nếu mẫu tên file gắn
  với project. `pnpm remove jsdom`.

**1e. autoprefixer** (thử, chỉ bỏ nếu chứng minh được)
- Bỏ khỏi `vite.config.ts` và `package.json`, build, đếm `-webkit-user-select`
  trong `dist/css` (hiện 8). Còn đủ thì giữ thay đổi, thiếu thì trả lại.

## Kiểm tra
`pnpm ts-check && pnpm knip && pnpm test && pnpm build`, rồi `pnpm dev` mở
http://localhost:3200 xem trang lên bình thường.

## Rủi ro
Thấp. Chỉ 1e đụng CSS xuất ra (Safari).
