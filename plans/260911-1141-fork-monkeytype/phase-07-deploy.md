---
phase: 7
title: "Deploy Cloudflare Pages"
status: pending
priority: P2
effort: "2h"
dependencies: [5, 6]
---

# Phase 7: Deploy Cloudflare Pages

## Overview
Đưa lên `beartype.pages.dev`, cùng cách keybear: build từ GitHub, push lên
`main` là deploy.

## Requirements
- Repo GitHub `xkhanhs/beartype`, **public** (GPL-3.0 bắt buộc đưa mã nguồn cho
  người nhận JS). Tạo repo là việc ra ngoài — hỏi anh trước khi chạy `gh repo create`.
- Cloudflare Pages project `beartype`: build `pnpm install --frozen-lockfile &&
  pnpm build-fe`, output `frontend/dist`, `NODE_VERSION` theo `.nvmrc` của
  monkeytype; `packageManager` trong `package.json` để Pages dùng đúng pnpm.
- `_headers`: asset có hash → `immutable`; `index.html` → `no-cache`.
- **Không** có luật `/*  /index.html  200` phủ lên `/assets/*` — đó là cái bẫy đã
  đầu độc CDN của keybear (chunk URL trả về index.html kèm header immutable).
  Chỉ một trang nên có thể không cần `_redirects` nào.
- `.husky/pre-push`: ts-check + test + build; không `--no-verify`.
- `robots.txt` + `sitemap.xml` + canonical trỏ `https://beartype.pages.dev`,
  viết ở một chỗ.

## Success Criteria
- [ ] `https://beartype.pages.dev` gõ được, Network chỉ có request cùng origin.
- [ ] Deploy lần hai sau một sửa CSS: tải lại thấy ngay, không kẹt cache.
- [ ] Lighthouse: không lỗi console.

## Risk Assessment
- Tên `beartype` trên pages.dev có thể đã bị lấy — khi đó Cloudflare cấp
  `beartype-xxx.pages.dev`; hỏi anh tên thay thế.
- Build monkeytype cần biến môi trường (`envConfig` plugin, Firebase key) — phase
  2 phải đã gỡ, nếu không build trên Pages sẽ đỏ dù local xanh.
