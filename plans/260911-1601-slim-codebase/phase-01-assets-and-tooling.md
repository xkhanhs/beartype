---
phase: 1
title: "Asset và tooling thừa"
status: pending
priority: P1
effort: "2h"
dependencies: []
---

# Phase 1: Asset và tooling thừa

## Overview
Bỏ những thứ không đi vào code chạy: ảnh, theme, phông, layout, script và công
cụ build/lint của upstream. Không đổi hành vi, nên làm trước để các phase sau
bớt nhiễu.

## Requirements
Mỗi gạch đầu dòng dưới là một commit.

1. **Ảnh**: xoá `merch*.png`, `githubbanner2.png`, `mtsocial.png`, `plushiebanner.png`,
   `mtfulllogo.png`, `mt-icon-512.png`, `monkeymeme.jpg`, `images/monkey/`,
   `images/themes/` (nếu chỉ phục vụ theme bị bỏ). Giữ `beartype.svg`, `fav.png`,
   `icons/`, `caret/`. Trước khi xoá, grep từng tên trong `src/`, `static/`, `index.html`.
2. **Theme CSS**: xoá mọi file trong `static/themes/` trừ `keybear_*.css`.
3. **Layout**: xoá hết `static/layouts/` trừ `qwerty.json` (bàn phím ảo phase 6 cần).
4. **Phông**: `static/webfonts/` chỉ giữ file mà sáu phông trong `FONTS`
   (`config-lock.ts`) cần cho bộ latin (tối thiểu `RobotoMono-Regular`,
   `IBMPlexMono-Regular`; kiểm từng phông trong `constants/fonts.ts` và
   `beartype.scss`). Bỏ `vite-plugins/font-preview.ts` và `webfonts-preview`
   nếu picker phông không dùng bản preview (kiểm `SettingsPopover.tsx`).
5. **Script**: xoá `scripts/fill-colors.js`, `fix-quote-lengths.cjs`,
   `get-short-quotes.ts`, `short-quotes.json`, `import-tree.ts`. `check-assets.ts`
   kiểm theme/layout/phông của upstream: bỏ, hoặc rút còn phần kiểm hai file
   ngôn ngữ nếu thấy đáng giữ. Giữ `build-vietnamese.ts`.
6. **Công cụ**: bỏ eslint (`eslint.config.js`, script `lint-json`, `@eslint/json`,
   `eslint-plugin-*`, `@tanstack/eslint-plugin-query`), prettier (`.prettierrc.json`),
   madge (script `madge`, `dep-graph`, bỏ khỏi `build`), `.fallowrc.json`,
   script `docker`, `@actions/core`, `vite-plugin-inspect`, `solid-devtools`
   nếu không bật trong `vite.config.ts`. Nâng knip lên bản hiện tại, sửa `knip.json`,
   chỉ chạy tay (thành cổng chặn ở phase 7).
7. **Style debug**: `media-queries-{blue,brown,gray,green,orange,purple,yellow}.scss`
   và `setMediaQueryDebugLevel` trong `ui.ts`, nếu chỉ là công cụ debug của upstream.
8. `sitemap.xml` và dòng `Sitemap:` trong `robots.txt`: giữ (một trang, vẫn đúng)
   hoặc bỏ; không quan trọng, mặc định giữ.

## Related Code Files
- Delete: các file nêu trên dưới `frontend/static/`, `frontend/scripts/`, `frontend/src/styles/`
- Modify: `frontend/package.json`, `package.json`, `frontend/vite.config.ts`,
  `frontend/src/styles/index.scss`, `frontend/src/ts/ui.ts`, `knip.json`, `pnpm-lock.yaml`

## Steps
1. Với mỗi cụm: grep tên file/gói → xoá → `pnpm install` nếu đổi dependency →
   `vitest run`, `tsc`, `vite build` → commit.
2. Chạy `pnpm dev` (cổng 3201 trong worktree), đổi qua chín theme và sáu phông:
   không có request 404 trong tab Network.

## Success Criteria
- [ ] Build xanh, không 404 khi đổi theme/phông.
- [ ] `dist` nhỏ đi ít nhất 5 MB.

## Risk Assessment
- Phông latin thiếu thì chữ rơi về phông hệ thống, khó thấy bằng mắt. Kiểm bằng
  Network và `document.fonts` trong console, không chỉ nhìn.
