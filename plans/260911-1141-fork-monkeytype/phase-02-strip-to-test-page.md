---
phase: 2
title: "Xoá backend, tài khoản và mọi thứ ngoài màn test"
status: pending
priority: P1
effort: "1-2d"
dependencies: [1]
---

# Phase 2: Xoá mọi thứ ngoài màn test

## Overview
Còn lại: `frontend/` với trang test + trang kết quả, và các package dùng chung
mà code test thật sự import. Xoá **theo cụm, mỗi cụm một commit**, chạy test sau
mỗi cụm, để khi cảm giác gõ lệch thì `git bisect` chỉ ra cụm nào.

## Architecture
Monkeytype nửa SolidJS (`components/`, `.tsx`) nửa vanilla (`test/`, `input/`,
`elements/`). Lõi gõ là vanilla và import khá hẹp: `config/store`,
`states/test`, `utils/*`, `test/events/*`, `legacy-states/composition`,
`funbox/list`, `db` (4 chỗ), `controllers/sound-controller` (3),
`controllers/ad-controller` (3), `collections/tags` (3). Mấy import cuối là chỗ
phải **cắt dây**, không phải xoá mù — thay bằng no-op hoặc gỡ lời gọi, và mỗi
chỗ ghi một dòng vì sao.

Công cụ: `knip` (đã cấu hình sẵn trong repo) và `madge` để tìm file mồ côi sau
mỗi cụm xoá; `tsc --noEmit` / `oxlint --type-aware` bắt import gãy.

## Các cụm xoá, theo thứ tự

1. **Backend + hạ tầng**: `backend/`, `docker/`, `frontend/docker`,
   `packages/contracts` (nếu chỉ `ape/` dùng), `packages/release`,
   `firebase.json`, workflow GitHub Actions của họ, `ape/`, `firebase.ts`,
   `auth.tsx`, `db.ts` (thay 4 lời gọi bằng dữ liệu local hoặc bỏ),
   `queries/`, `collections/`.
2. **Tiền và theo dõi**: `ad-controller`, `eg-ad-controller`, `pw-ad-controller`,
   `ads.scss`, `sentry.ts` + `@sentry/*`, `analytics-controller`, `cookies.ts` +
   `CookiesModal`, `merch-banner`, `psa`, `supporters.json`, `contributors.json`.
3. **Trang và modal khác**: `components/pages/{account,account-settings,
   connections,leaderboard,login,profile,settings}`, `AboutPage`, `404Page`,
   hầu hết `components/modals/*` (giữ lại chỉ modal nào màn test cần — dự kiến
   không cái nào), `popups/`, `commandline/`, header `Nav`/`AccountMenu`/`XpBar`,
   footer `VersionButton`/`ThemeIndicator`. `route-controller` còn một route.
4. **Tính năng test không dùng**: quote (`quotes-controller`, `static/quotes`,
   các modal quote), `custom-text`, `wikipedia.ts`, `poetry.ts`, `tts.ts`,
   `replay-ui.ts`, `test-screenshot.ts`, `pb-crown.ts`,
   `challenge-controller` + `packages/challenges`, `preset-controller`,
   `layout-emulator`, `Keymap*`, `Monkey.tsx`, `monkey-power.ts`,
   `sound-controller` + `static/sounds` + `howler`, `british-english`,
   `lazy-mode`. **Funbox**: không xoá package ngay — code test gọi
   `isFunboxActiveWithProperty` rải rác; để nguyên và khoá danh sách funbox rỗng
   ở phase 3. Xoá funbox là một việc riêng, chỉ làm nếu nó thật sự cản.
5. **Tài nguyên tĩnh**: `static/languages` chỉ giữ `english.json` và một
   `vietnamese.json` **dựng từ `words-vi.json` của keybear** (135M → vài trăm
   KB). Script `scripts/build-vietnamese.ts`: đọc file keybear, đổi mọi từ sang
   kiểu bỏ dấu mới (`withToneStyle(w, "new")`), **bỏ trùng** (danh sách keybear
   có cả `khỏe` lẫn `khoẻ`, `hóa` lẫn `hoá`), rồi ghi theo định dạng ngôn ngữ của
   monkeytype. Việc vẽ theo kiểu bộ gõ đang dùng thì phase 4 lo; `static/layouts`,
   `static/themes` (chủ đề chuyển sang phase 6), `static/challenges`, `static/funbox`
   ảnh, webfonts ngoài Quicksand/Be Vietnam Pro/Roboto Mono.
6. **Phụ thuộc npm**: gỡ những gói `knip` báo không còn ai dùng (firebase,
   chart annotation nếu màn kết quả không cần, `hangul-js`, `slim-select`,
   `@tanstack/solid-table`, v.v.). `vite-plugin-pwa` gỡ luôn — không PWA, không
   service worker, tránh đúng cái bẫy đã tốn keybear một buổi.

**Giữ lại dù trông như phụ:** `pace-caret.ts` (anh bật "average"), 
`theme-controller.ts` (phase 6 dùng lại cơ chế áp màu), `smoothCaret` và mọi
thứ `caret.ts` import.

## Files cấm đụng trong phase này
`input/**`, `test/test-ui.ts`, `test/caret.ts`, `test/test-timer.ts`,
`test/test-logic.ts`, `test/words-generator.ts`, `test/events/**`,
`legacy-states/composition.ts`, `utils/debounced-animation-frame.ts`,
`styles/caret.scss`, `styles/test.scss`. Nếu một cụm xoá bắt buộc sửa file trong
danh sách này (vd. `test-logic.ts` gọi `PaceCaret.init()`), chỉ được **gỡ dòng
gọi**, không đổi logic, và ghi vào `docs/upstream.md`.

## Success Criteria
- [ ] `pnpm build` ra thư mục tĩnh, không request mạng nào ra ngoài lúc chạy
      (kiểm bằng tab Network).
- [ ] Test `__tests__/input` và `__tests__/test` còn xanh (trừ test của code đã
      xoá, xoá cùng commit).
- [ ] Cổng "vẫn gõ y hệt" sau cụm 4 và sau cụm 6.
- [ ] `knip` không báo file mồ côi.

## Risk Assessment
- **Rủi ro lớn nhất**: một thứ tưởng là phụ lại góp vào cảm giác gõ (vd.
  `anim.ts` / `applyEngineSettings` điều khiển animejs dùng cho caret, hay
  `focus.ts` ẩn con trỏ chuột). Quy tắc: không xoá thứ gì mà `caret.ts` hay
  `test-ui.ts` import, dù gián tiếp.
- `index.ts` khoá `Math.random` / freeze `Math` — chống cheat, vô hại, giữ.
- Có thể phải xoá nhiều hơn dự kiến ở `components/` vì Solid mount theo cây —
  ổn, miễn là trang test mount được.
