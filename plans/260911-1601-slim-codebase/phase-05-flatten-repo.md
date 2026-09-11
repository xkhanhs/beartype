---
phase: 5
title: "Một package ở gốc repo"
status: pending
priority: P2
effort: "3h"
dependencies: [4]
---

# Phase 5: Một package ở gốc repo

## Overview
Bỏ monorepo: `packages/schemas` và `packages/util` còn lại gì thì chép vào
`src/ts`, rồi dời `frontend/*` lên gốc. Không còn turbo, tsup, `build-pkg`.

## Requirements
- `packages/schemas` → `src/ts/schemas/` (chỉ các file còn import sau phase 4).
  `packages/util` → gộp vào `src/ts/utils/` các hàm còn dùng (`numbers`, `json`,
  `trycatch`, `objects`, `zod`). Test của package: giữ test cho hàm còn dùng, chuyển
  vào `__tests__/`.
- Import `@monkeytype/*` → đường dẫn tương đối (hoặc alias `@/` nếu `tsconfig` đã
  có alias; không thêm alias mới chỉ để đỡ gõ).
- `packages/typescript-config/base.json` gộp vào `tsconfig.json`;
  `packages/oxlint-config` gộp vào `.oxlintrc.json` (giữ `monkeytype-rules.js` nếu
  còn rule đang bật, đổi tên cho đúng repo).
- `git mv frontend/* .` rồi gộp hai `package.json`, hai `vitest.config.ts`,
  `.gitignore`, lint-staged. Xoá `turbo.json`, `pnpm-workspace.yaml` (giữ phần
  `allowBuilds`/`overrides`/`engineStrict` nếu pnpm 11 cần, chuyển sang chỗ tương ứng),
  `packages/`, `.turbo/`.
- Tên package `beartype`, script: `dev`, `build`, `test`, `ts-check`, `lint`,
  `format-check`, `knip`. Giữ `build-fe` làm bí danh của `build` đến khi Cloudflare
  đổi xong, rồi bỏ ở phase 7.
- `.husky/pre-push`: `pnpm ts-check && pnpm test && pnpm build`.

## Cloudflare Pages (người dùng làm, đúng lúc merge PR C)
| | Trước | Sau |
|---|---|---|
| Build command | `pnpm build-fe` | `pnpm build` (hoặc giữ `pnpm build-fe` nhờ bí danh) |
| Output directory | `frontend/dist` | `dist` |
| Root directory | `/` | `/` |

Đổi output dir **trước** khi bấm merge. Nếu merge trước, lần deploy đó sẽ lỗi vì
không thấy `frontend/dist`, còn trang đang chạy thì vẫn giữ bản cũ.

## Related Code Files
- Move: `frontend/**` → gốc
- Delete: `packages/`, `turbo.json`, `pnpm-workspace.yaml` (nếu được), `knip.json` workspaces
- Modify: `package.json`, `tsconfig.json`, `vite.config.ts` (đường dẫn `static`, `src`),
  `vitest.config.ts`, `.oxlintrc.json`, `.husky/pre-push`, `stylelint.config.mjs`, `.gitignore`

## Steps
1. Commit 1: chép `schemas`/`util` vào `frontend/src/ts`, đổi import, xoá `packages/`, turbo. Test xanh.
2. Commit 2: `git mv` lên gốc, gộp config. Test, `tsc`, build, `vite preview` xanh.
3. Xoá `node_modules` và chạy `pnpm install` sạch để chắc lockfile đúng.

## Success Criteria
- [ ] Clone mới: `pnpm install && pnpm test && pnpm build` chạy ở gốc, không bước build package.
- [ ] `git log --follow` trên một file đã dời vẫn thấy lịch sử.

## Risk Assessment
- `vite.config.ts` và các plugin dùng `__dirname` với đường dẫn `../static`; dời
  thư mục là vỡ âm thầm (thiếu file trong `dist`). So danh sách file `dist` trước/sau.
